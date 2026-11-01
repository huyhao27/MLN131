// Public API of the region mode (ARCHITECTURE_REGIONS.md "Hợp đồng Sim vùng").
//   const game = createRegionGame({ seed: 2026 });
//   game.view(); game.act({ type: 'choose', problem: 'p3', option: 'A' }); game.act({ type: 'endPeriod' });
import { bus as coreBus } from '../core/bus.js';
import { CONFIG, REGION_ORDER, INDICATORS } from './data/config.js';
import { REGIONS, BUILT, TOPICS, serviceLabel } from './data/regions.js';
import { SHORT_TITLES } from './data/events.js';
import {
  initialState, beginPeriod, endPeriod, choose, optionStates, computeServices, params, context,
  income, upkeepNow, slotsUsed, national, regionStatus, regionScore, isOpen, EVENT_BY_ID,
} from './engine.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const ORIGIN_LABEL = { random: 'Ngẫu nhiên', consequence: 'Hệ quả', opportunity: 'Cơ hội' };

export const BRIEFING = {
  title: 'The Transition — Điều hành theo vùng',
  paragraphs: [
    'Bạn điều hành Cộng hòa Hòa Minh — một quốc gia hư cấu gồm sáu vùng: Thiên Hà công nghiệp, Đồng bằng nông nghiệp, Đô thị trung tâm, Khu dân cư, Vùng cao Bản Mây và Duyên hải – cảng.',
    'Mỗi kỳ, vài vùng sẽ báo vấn đề hoặc cơ hội trên bản đồ. Bạn tự chọn vùng ghé trước, chọn cách xử lý trong giới hạn ngân sách và tối đa hai công trình cùng lúc, rồi bấm “Sang kỳ tiếp theo”.',
    'Các vùng nối với nhau bằng điện, nước, đường, cảng và người lao động. Cứu vùng này có thể làm khó vùng khác một kỳ — hãy theo dõi bản tin để thấy vì sao.',
    `Nhiệm kỳ có ${CONFIG.periods} kỳ. Địa danh, số liệu và quan hệ tác động đều là giả định để mô phỏng, không mô tả quốc gia có thật.`,
  ],
};

const deadlineText = (p, period) => {
  if (p.deadline == null) return null;
  const left = p.deadline - period + 1;
  return left <= 1 ? 'Hạn chót kỳ này' : `Còn ${left} kỳ`;
};
const delayText = (d) => (!d ? 'Ngay' : d === 1 ? 'Kỳ tới' : `Sau ${d} kỳ`);

export function createRegionGame({ seed = 2026, bus = coreBus, emit = true } = {}) {
  let s = initialState(seed);
  let snapshots = [];

  function problemView(p) {
    const def = EVENT_BY_ID[p.rootId];
    const opts = isOpen(p) ? optionStates(s, p) : [];
    return {
      instanceId: p.instanceId,
      rootId: p.rootId,
      code: p.rootId,
      origin: p.origin,
      originLabel: ORIGIN_LABEL[p.origin],
      region: p.region,
      title: def.title,
      short: SHORT_TITLES[p.rootId] || def.title,
      text: def.text,
      severity: p.severity,
      status: p.status,
      deadline: p.deadline,
      deadlineText: p.chosen ? null : deadlineText(p, s.period),
      affects: def.affects || [p.region],
      links: def.links || [],
      causes: p.causes,
      options: opts.map(({ def: o, disabled, reason }) => ({
        id: o.id,
        label: o.label,
        cost: o.cost,
        upkeep: o.upkeep?.v || 0,
        upkeepFor: o.upkeep?.n || 0,
        delay: o.delay || 0,
        delayText: delayText(o.delay),
        project: !!o.project,
        preview: o.preview,
        disabled,
        reason,
      })),
      wait: def.wait ? { preview: def.wait } : null,
      chosen: p.chosen ? { option: p.chosen.option, label: p.chosen.label, period: p.chosen.period, completesAt: p.chosen.completesAt, completed: !!p.chosen.completed } : null,
      learn: { ...(TOPICS[def.topic] || {}), note: def.learn?.note || null },
      openedAt: p.openedAt,
    };
  }

  function regionLine(r, st, svc, probs, projects) {
    const undecided = probs.filter((p) => !p.chosen && p.origin !== 'opportunity');
    if (undecided.length) {
      const p = undecided.sort((a, b) => b.severity - a.severity)[0];
      const dl = deadlineText(p, s.period);
      return `${EVENT_BY_ID[p.rootId].title}${dl ? ` · ${dl.toLowerCase()}` : ''}`;
    }
    const short = Object.entries(svc).filter(([, x]) => x.status === 'short');
    if (short.length) return `${serviceLabel(short[0][0], r)} đang thiếu`;
    const working = probs.filter((p) => p.chosen);
    if (working.length) {
      const p = working[0];
      return p.chosen.completed ? `Đang theo dõi: ${p.chosen.label.toLowerCase()}` : `${p.chosen.label} · xong kỳ ${p.chosen.completesAt}`;
    }
    if (projects.length) return `Đang thi công: ${projects[0].label.toLowerCase()}`;
    const opp = probs.find((p) => p.origin === 'opportunity');
    if (opp) return `Cơ hội: ${EVENT_BY_ID[opp.rootId].title.toLowerCase()}`;
    const calm = REGIONS[r].calm;
    return calm[(s.period + r.charCodeAt(0)) % calm.length];
  }

  function regionsView() {
    const S = computeServices(s);
    return REGION_ORDER.map((r) => {
      const R = s.regions[r];
      const probs = s.problems.filter((p) => isOpen(p) && p.region === r);
      const projects = s.projects.filter((j) => !j.done && j.region === r);
      const st = regionStatus(s, r);
      return {
        id: r,
        name: REGIONS[r].name,
        short: REGIONS[r].short,
        role: REGIONS[r].role,
        ...st,
        line: regionLine(r, st, S.svc[r], probs, projects),
        indicators: { ...R.ind },
        trend: Object.fromEntries(INDICATORS.map((k) => [k, R.ind[k] - R.prev[k]])),
        services: Object.entries(S.svc[r]).map(([id, x]) => ({ id, label: serviceLabel(id, r), ...x })),
        problems: probs.map((p) => p.instanceId),
        projects: projects.map((j) => j.id),
        built: s.built.filter((k) => BUILT[k]?.region === r),
      };
    });
  }

  function base() {
    return {
      mode: 'regions',
      phase: s.phase,
      period: s.period,
      totalPeriods: s.total,
      budget: s.budget,
      incomeNext: income(s) - upkeepNow(s),
      upkeep: upkeepNow(s),
      slots: { used: slotsUsed(s), max: CONFIG.maxProjects },
      national: national(s),
    };
  }

  function view() {
    const v = base();
    if (s.phase === 'briefing') {
      return { ...v, ...clone(BRIEFING), regions: regionsView(), problems: [], projects: [], links: [], news: [] };
    }
    const S = computeServices(s);
    v.regions = regionsView();
    v.problems = s.problems.filter(isOpen).map(problemView)
      .sort((a, b) => (a.chosen ? 1 : 0) - (b.chosen ? 1 : 0) || b.severity - a.severity);
    v.projects = s.projects.map((j) => ({
      id: j.id, key: j.key, label: j.label, region: j.region, startedAt: j.startedAt, doneAt: j.doneAt, done: j.done,
      doneText: j.done ? 'Đã hoàn tất' : j.doneAt - s.period <= 0 ? 'Hoàn tất cuối kỳ này' : j.doneAt - s.period === 1 ? 'Hoàn tất kỳ tới' : `Hoàn tất kỳ ${j.doneAt}`,
    }));
    v.links = S.links;
    v.news = s.news.filter((n) => n.period >= s.period - 1).slice().reverse();
    if (s.phase === 'end') v.summary = summary();
    return v;
  }

  function summary() {
    const nat = national(s);
    const after = Object.fromEntries(REGION_ORDER.map((r) => [r, { ...s.regions[r].ind }]));
    const diffs = REGION_ORDER.map((r) => {
      const d = Object.fromEntries(INDICATORS.map((k) => [k, after[r][k] - s.before[r][k]]));
      return { r, d, total: d.output + d.wellbeing + d.access, score: regionScore(after[r]) };
    });
    const label = { output: 'Sản xuất', wellbeing: 'Đời sống', access: 'Tiếp cận dịch vụ' };
    const describe = (d) => INDICATORS.filter((k) => d[k]).sort((a, b) => Math.abs(d[b]) - Math.abs(d[a])).slice(0, 2)
      .map((k) => `${label[k]} ${d[k] > 0 ? '+' : ''}${d[k]}`).join(', ');
    const builtIn = (r) => s.built.filter((k) => BUILT[k]?.region === r).map((k) => BUILT[k].label.toLowerCase());
    const improved = diffs.filter((x) => x.total >= 6).sort((a, b) => b.total - a.total)
      .map((x) => ({ region: x.r, text: `${describe(x.d)}${builtIn(x.r).length ? ` · có ${builtIn(x.r).join(', ')}` : ''}` }));
    const leftBehind = diffs.filter((x) => x.total <= -4 || x.score < 40).sort((a, b) => a.total - b.total)
      .map((x) => ({ region: x.r, text: `${describe(x.d) || 'không cải thiện'}${x.score < 40 ? ' · vẫn ở mức thấp' : ''}` }));

    // Memorable chains: roots whose decisions led to consequences elsewhere, most steps first.
    const byParent = {};
    for (const p of s.problems) if (p.parent) (byParent[p.parent] ||= []).push(p);
    const stepOf = (p) => {
      const def = EVENT_BY_ID[p.rootId];
      const choice = p.chosen ? `chọn “${p.chosen.label}”` : p.outcome === 'expired' ? 'để quá hạn' : p.status === 'closed' ? 'tự ổn định' : 'chưa xử lý';
      return `Kỳ ${p.openedAt} · ${REGIONS[p.region].short}: ${def.title} — ${choice}`;
    };
    const walk = (p, depth = 0) => [stepOf(p), ...(depth < 3 ? (byParent[p.instanceId] || []).flatMap((c) => walk(c, depth + 1)) : [])];
    const roots = s.problems.filter((p) => !p.parent);
    const chains = roots
      .map((p) => ({ p, steps: walk(p) }))
      .sort((a, b) => b.steps.length - a.steps.length || (b.p.chosen ? 1 : 0) - (a.p.chosen ? 1 : 0) || b.p.severity - a.p.severity)
      .slice(0, 3)
      .map(({ p, steps }) => ({ title: EVENT_BY_ID[p.rootId].title, period: p.openedAt, steps }));

    const openProblems = s.problems.filter(isOpen).map((p) => ({ region: p.region, title: EVENT_BY_ID[p.rootId].title, status: p.status }));
    const topics = Object.entries(TOPICS).map(([id, t]) => {
      const via = s.decisions.filter((d) => d.topic === id).map((d) => `Kỳ ${d.period} · ${d.title}: ${d.label}`);
      return { id, chapter: t.chapter, topic: t.topic, seen: via.length > 0, via };
    });

    let headline, text;
    const best = improved[0] && REGIONS[improved[0].region].short;
    const worst = leftBehind[0] && REGIONS[leftBehind[0].region].short;
    const start = nationalOf(s.before);
    const gain = nat.overall - start.overall;
    const lowest = Math.min(...REGION_ORDER.map((r) => regionScore(after[r])));
    if (gain >= 4 && nat.gap <= 16 && lowest >= 42) {
      headline = 'Phát triển đồng đều hơn';
      text = 'Các vùng cùng tiến lên và khoảng cách đời sống giữa các vùng được giữ ở mức thấp. Những gì đã xây dựng sẽ là nền cho nhiệm kỳ sau.';
    } else if (gain >= 2) {
      headline = 'Lớn lên nhưng lệch vùng';
      text = `Cả nước khá hơn${best ? `, rõ nhất ở ${best}` : ''}, nhưng khoảng cách đời sống giữa các vùng còn lớn${worst ? ` — ${worst} bị bỏ lại phía sau` : ''}.`;
    } else if (gain <= -4) {
      headline = 'Nhiều vùng còn chật vật';
      text = 'Các vấn đề chồng lên nhau nhanh hơn khả năng xử lý. Nhìn lại chuỗi quyết định để thấy chỗ nào một lựa chọn khác có thể chặn được sự lan rộng.';
    } else {
      headline = 'Đi từng bước, còn việc dang dở';
      text = `Có những tiến bộ thật${best ? ` ở ${best}` : ''}, song nhiều việc mới ở giữa chừng. Thời kỳ quá độ là quá trình lâu dài với nhiều mâu thuẫn cần xử lý dần.`;
    }

    return {
      headline, text,
      before: clone(s.before), after,
      improved, leftBehind, chains, openProblems, topics,
      timeline: [{ period: 0, national: nationalOf(s.before) }, ...clone(s.timeline)],
      decisions: s.decisions.map((d) => ({ period: d.period, region: d.region, title: d.title, option: d.label })),
      built: s.built.map((k) => ({ key: k, label: BUILT[k]?.label, region: BUILT[k]?.region })),
      national: nat,
    };
  }

  function step(action) {
    switch (action?.type) {
      case 'start':
        if (s.phase !== 'briefing') throw new Error('game already started');
        s.phase = 'period';
        s.period = 1;
        beginPeriod(s);
        return;
      case 'choose':
        if (s.phase !== 'period') throw new Error('not in a period');
        choose(s, action.problem, action.option);
        return;
      case 'endPeriod':
        if (s.phase !== 'period') throw new Error('not in a period');
        endPeriod(s);
        return;
      case 'restart':
        s = initialState(seed);
        snapshots = [];
        return;
      default:
        throw new Error(`invalid action ${JSON.stringify(action)}`);
    }
  }

  const numbers = () => JSON.stringify([s.period, s.budget, REGION_ORDER.map((r) => s.regions[r].ind), s.built, s.problems.length]);
  function publish(prev, force = false) {
    if (!emit || !bus) return;
    const v = view();
    bus.emit('region:view', { view: v });
    if (force || numbers() !== prev) bus.emit('region:state', { regions: v.regions, links: v.links, period: v.period });
  }

  const game = {
    view,
    act(action) {
      const prev = numbers();
      const snap = clone(s);
      step(action);
      if (action.type !== 'restart') snapshots.push(snap);
      publish(prev);
      return view();
    },
    undo() {
      if (!snapshots.length) return view();
      const prev = numbers();
      s = snapshots.pop();
      publish(prev);
      return view();
    },
    sync() {
      publish(null, true);
      return view();
    },
    get state() { return clone(s); },
    get canUndo() { return snapshots.length > 0; },
    seed,
  };
  return game;
}

function nationalOf(inds) {
  const m = (k) => Math.round(REGION_ORDER.reduce((a, r) => a + inds[r][k], 0) / REGION_ORDER.length);
  const wb = REGION_ORDER.map((r) => inds[r].wellbeing);
  const out = { output: m('output'), wellbeing: m('wellbeing'), access: m('access') };
  out.gap = Math.max(...wb) - Math.min(...wb);
  out.overall = Math.round((out.output + out.wellbeing + out.access) / 3);
  return out;
}

export { REGION_ORDER };
