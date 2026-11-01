import{h as e,t}from"./util-C-XnCQOZ.js";var n=[`CN`,`NN`,`TT`,`DC`,`VC`,`CB`],r={CN:{name:`Công nghiệp Thiên Hà`,short:`Thiên Hà`},NN:{name:`Đồng bằng nông nghiệp`,short:`Đồng bằng`},TT:{name:`Đô thị trung tâm`,short:`Trung tâm`},DC:{name:`Khu dân cư`,short:`Khu dân cư`},VC:{name:`Vùng cao Bản Mây`,short:`Bản Mây`},CB:{name:`Duyên hải và cảng`,short:`Cảng`}},i={stable:`Ổn định`,opportunity:`Có cơ hội`,attention:`Cần quan tâm`,urgent:`Khẩn cấp`},a={random:`Ngẫu nhiên`,consequence:`Hệ quả`,opportunity:`Cơ hội`},o={open:`Chưa xử lý`,working:`Đang xử lý`,escalated:`Đang leo thang`},s={1:`Nhẹ`,2:`Vừa`,3:`Nặng`},c={short:`Thiếu`,tight:`Sát nhu cầu`,ok:`Đủ`},l=[{key:`output`,label:`Sản xuất`},{key:`wellbeing`,label:`Đời sống`},{key:`access`,label:`Tiếp cận dịch vụ`}],u={risk:`nguy cơ`,active:`đang ảnh hưởng`,benefit:`lợi ích`},d=(e,t=48)=>`<svg viewBox="0 0 ${t} ${t}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${e}</svg>`,f={stable:d(`<circle cx="24" cy="24" r="17"/><path d="M15.5 24.5l6 6 11-12"/>`),opportunity:d(`<path d="M24 6l4.6 12.4L41 24l-12.4 5.6L24 42l-4.6-12.4L7 24l12.4-5.6z"/>`),attention:d(`<path d="M24 6L44 41H4z"/><path d="M24 19v10"/><path d="M24 34.5v.5"/>`),urgent:d(`<path d="M16.5 5h15L43 16.5v15L31.5 43h-15L5 31.5v-15z"/><path d="M24 14v13"/><path d="M24 33v.5"/>`),random:d(`<rect x="8" y="8" width="32" height="32" rx="6"/><circle cx="17" cy="17" r="1.6"/><circle cx="31" cy="31" r="1.6"/><circle cx="24" cy="24" r="1.6"/><circle cx="31" cy="17" r="1.6"/><circle cx="17" cy="31" r="1.6"/>`),consequence:d(`<path d="M20 28l8-8"/><path d="M22.5 13.5l3-3a8 8 0 0 1 11.3 11.3l-3 3"/><path d="M25.5 34.5l-3 3a8 8 0 0 1-11.3-11.3l3-3"/>`),project:d(`<path d="M8 42h32"/><path d="M14 42V14h4v28"/><path d="M16 14h22l-4 6"/><path d="M34 20v8"/><rect x="30" y="28" width="8" height="6" rx="1"/>`),clock:d(`<circle cx="24" cy="24" r="17"/><path d="M24 14v10l7 5"/>`),budget:d(`<ellipse cx="24" cy="14" rx="14" ry="5.5"/><path d="M10 14v10c0 3 6.3 5.5 14 5.5S38 27 38 24V14"/><path d="M10 24v10c0 3 6.3 5.5 14 5.5S38 37 38 34V24"/>`),income:d(`<path d="M24 40V12"/><path d="M13 22l11-11 11 11"/><path d="M10 44h28"/>`),upkeep:d(`<path d="M38 22a14 14 0 1 0-3.5 11"/><path d="M38 12v10H28"/>`),next:d(`<path d="M10 12l14 12-14 12z"/><path d="M26 12l14 12-14 12z"/>`),back:d(`<path d="M30 10L16 24l14 14"/>`),close:d(`<path d="M13 13l22 22M35 13L13 35"/>`),book:d(`<path d="M8 8h13a5 5 0 0 1 5 5v28a4 4 0 0 0-4-4H8z"/><path d="M40 8H30a5 5 0 0 0-4 2"/><path d="M40 8v29H30a4 4 0 0 0-4 4"/>`),news:d(`<rect x="6" y="10" width="30" height="30" rx="3"/><path d="M36 18h6v18a4 4 0 0 1-4 4H10"/><path d="M12 18h18M12 25h18M12 32h11"/>`),good:d(`<circle cx="24" cy="24" r="17"/><path d="M15.5 24.5l6 6 11-12"/>`),bad:d(`<path d="M24 6L44 41H4z"/><path d="M24 19v10"/><path d="M24 34.5v.5"/>`),neutral:d(`<circle cx="24" cy="24" r="17"/><path d="M16 24h16"/>`),up:d(`<path d="M24 38V12M13 22l11-11 11 11"/>`),down:d(`<path d="M24 10v26M13 26l11 11 11-11"/>`),flat:d(`<path d="M10 24h28M30 16l8 8-8 8"/>`),wait:d(`<path d="M14 6h20M14 42h20"/><path d="M16 6c0 9 16 11 16 18S16 33 16 42"/><path d="M32 6c0 9-16 11-16 18s16 9 16 18"/>`),fullscreen:d(`<path d="M8 18V8h10M30 8h10v10M40 30v10H30M18 40H8V30"/>`),keys:d(`<rect x="5" y="12" width="38" height="24" rx="4"/><path d="M12 19h2M19 19h2M26 19h2M33 19h2M12 26h2M33 26h2M19 29h10"/>`),restart:d(`<path d="M9 24a15 15 0 1 0 4.4-10.6"/><path d="M9 7v7h7"/>`),lock:d(`<rect x="10" y="21" width="28" height="20" rx="3"/><path d="M16 21v-5a8 8 0 0 1 16 0v5"/>`),CN:d(`<path d="M6 42V22l10 6v-6l10 6v-6l10 6V8h6v34z"/><path d="M6 42h36"/>`),NN:d(`<path d="M6 40c8-4 28-4 36 0"/><path d="M24 36V14"/><path d="M24 22c-6 0-9-3.5-9-8.5 6 0 9 3.5 9 8.5z"/><path d="M24 18c0-5 3-8 9-8 0 5-3 8-9 8z"/>`),TT:d(`<path d="M6 42h36"/><path d="M10 42V20h10v22"/><path d="M20 42V10h12v32"/><path d="M32 42V24h6v18"/><path d="M24 16h4M24 22h4M24 28h4"/>`),DC:d(`<path d="M6 22L24 8l18 14"/><path d="M11 18v24h26V18"/><rect x="20" y="30" width="8" height="12"/><path d="M15 25h4M29 25h4"/>`),VC:d(`<path d="M4 40l13-22 8 12 6-9 13 19z"/><path d="M13 25l4-7 4 6"/>`),CB:d(`<path d="M6 34h36l-5 8H11z"/><path d="M14 34V22h14v12"/><path d="M28 26h8v8"/><path d="M4 44c4 0 4-2 8-2s4 2 8 2 4-2 8-2 4 2 8 2 4-2 8-2"/>`)};function p(e,t=``){return`<span class="rg-ic ${t}">${f[e]??``}</span>`}function m(e,t){let n=e?.regions?.find(e=>e.id===t),i=r[t]??{name:t,short:t};return{name:n?.name??i.name,short:n?.short??i.short}}function h(e){return e?.statusLabel||i[e?.status]||``}function g(e){return e?e.charAt(0).toLocaleLowerCase(`vi`)+e.slice(1):``}function _(e,n=`rg-chain`){return e?.length?`<span class="${n}">${e.map(e=>`<span class="rg-chain-step">${t(e)}</span>`).join(`<span class="rg-chain-arrow" aria-label="dẫn đến"> → </span>`)}</span>`:``}function v(e){let t=Math.round(Number(e)||0);return t>0?`+${t}`:t<0?`−${Math.abs(t)}`:`0`}function y(e){let t=[];return t.push(e.cost>0?`Chi ${e.cost}`:`Không tốn ngân sách`),e.upkeep>0&&t.push(`Duy trì ${e.upkeep}/kỳ${e.upkeepFor>0?` trong ${e.upkeepFor} kỳ`:``}`),t}function b(e){return e.delayText?e.delayText:e.delay?`Sau ${e.delay} kỳ`:`Ngay`}var x=12,S=6,C=6,w=2;function T(e,{onHover:r,onSelect:i,onOpenProblem:a}){let s=new Map,c=null,l={top:0,bottom:0,right:1/0},u=null,d=null,f=!0,_={W:window.innerWidth,H:window.innerHeight};function v(t){let n=s.get(t);if(n)return n;let o=document.createElement(`div`);o.className=`rg-label`,o.dataset.region=t;let c=document.createElement(`span`);c.className=`rg-anchor`,c.setAttribute(`aria-hidden`,`true`);let l=document.createElement(`span`);return l.className=`rg-leader`,l.setAttribute(`aria-hidden`,`true`),e.append(l,c,o),o.addEventListener(`pointerenter`,()=>r(t,!0)),o.addEventListener(`pointerleave`,()=>r(null,!0)),o.addEventListener(`focusin`,()=>r(t,!0)),o.addEventListener(`focusout`,e=>{o.contains(e.relatedTarget)||r(null,!0)}),o.addEventListener(`click`,e=>{let n=e.target.closest(`[data-problem]`);n?a(n.dataset.problem,t):i(t)}),n={el:o,dot:c,leader:l,w:0,h:0,shown:null,tx:null,ty:null,lead:null,tail:!1},s.set(t,n),n}function y(e,n){let r=e.status===`working`||e.chosen,i=``;r&&e.chosen?.completesAt?i=`xong kỳ ${e.chosen.completesAt}`:r?i=g(o.working):e.deadline!=null&&n?.period!=null&&e.deadline<=n.period?i=`hạn chót`:e.deadlineText&&(i=g(e.deadlineText));let a=e.short||e.title,s=r?`is-working`:`is-${e.origin}`,c=r?`clock`:e.origin===`opportunity`?`opportunity`:e.origin===`consequence`?`consequence`:`attention`;return`<li><button type="button" class="rg-pin ${s}${e.severity>=3&&!r?` is-severe`:``}" data-problem="${t(e.instanceId)}" title="${t(e.title)}${i?` · `+t(i):``}" tabindex="-1">
      ${p(c)}<span class="rg-pin-title">${t(a)}</span>${i?`<span class="rg-pin-dl">· ${t(i)}</span>`:``}
    </button></li>`}function b(e){let r=e?.regions??[],i=e?.phase===`period`;for(let a of n){let o=r.find(e=>e.id===a),s=v(a);if(!o){s.el.innerHTML=``,s.missing=!0;continue}s.missing=!1;let c=m(e,a),l=(o.problems??[]).map(t=>e.problems?.find(e=>e.instanceId===t)).filter(Boolean);l.sort((t,n)=>T(t,e)-T(n,e));let f=l.slice(0,w),g=l.length-f.length,_=(e.projects??[]).filter(e=>!e.done&&(e.region===a||(o.projects??[]).includes(e.id))),b=h(o),x=n.indexOf(a)+1;s.el.className=`rg-label is-${o.status||`stable`}${u===a?` is-selected`:``}${d===a?` is-hover`:``}${i?``:` is-passive`}${s.shown===!1?` is-off`:``}${s.tail?` has-tail`:``}`,s.el.innerHTML=`
        <button type="button" class="rg-label-main" data-select="${a}" ${i?``:`tabindex="-1"`}
          aria-label="${t(c.name)}: ${t(b)}${l.length?`, ${l.length} việc cần xem`:``}. Phím ${x}">
          <span class="rg-label-head"><kbd class="rg-key" aria-hidden="true">${x}</kbd><span class="rg-label-name">${t(c.short)}</span></span>
          <span class="rg-label-status">${p(o.status||`stable`)}<span>${t(b)}</span></span>
        </button>
        ${f.length?`<ul class="rg-pins">${f.map(t=>y(t,e)).join(``)}${g>0?`<li class="rg-pin-more">+${g} việc khác</li>`:``}</ul>`:``}
        ${_.length?`<div class="rg-chip-project" title="${t(_.map(e=>`${e.label}: ${e.doneText??``}`).join(`; `))}">${p(`project`)}<span>Đang thi công · kỳ ${t(_[0].doneAt??`?`)}${_.length>1?` (+${_.length-1})`:``}</span></div>`:``}`}E()}function T(e,t){let n=e.status===`working`||e.chosen?1e3:0,r=e.status===`escalated`?-50:0,i=e.deadline==null?50:Math.max(0,e.deadline-(t.period??0))*10;return n+r-(e.severity??1)*20+i+(e.origin===`opportunity`?15:0)}function E(){_={W:e.clientWidth||window.innerWidth,H:e.clientHeight||window.innerHeight};for(let e of s.values())e.w=e.el.offsetWidth,e.h=e.el.offsetHeight;f=!0,k()}function D(e){e&&(!f&&c&&O(c,e)||(c=e,f=!1,k()))}function O(e,t){for(let r of n){let n=e[r],i=t[r];if(!n!=!i||n&&(n.visible!==i.visible||Math.abs(n.x-i.x)>.25||Math.abs(n.y-i.y)>.25))return!1}return!0}function k(){if(!c)return;let{W:e,H:t}=_,r=l.top+C,i=t-l.bottom-C,a=[];for(let r of n){let n=s.get(r),i=c[r],o=!!i&&i.visible!==!1&&!n?.missing&&Number.isFinite(i.x)&&Number.isFinite(i.y)&&i.x>=-40&&i.x<=e+40&&i.y>=-40&&i.y<=t+40&&i.x<l.right;n&&A(n,o),o&&a.push({id:r,it:n,ax:i.x,ay:i.y,x:i.x-n.w/2,y:i.y-n.h-x,w:n.w,h:n.h})}let o=t=>{t.x=Math.max(C,Math.min(Math.min(e,l.right)-C-t.w,t.x)),t.y=Math.max(r,Math.min(i-t.h,t.y))};a.forEach(o);for(let e=0;e<10;e++){let e=!1;for(let t=0;t<a.length;t++)for(let n=t+1;n<a.length;n++){let r=a[t],i=a[n],s=Math.min(r.x+r.w,i.x+i.w)-Math.max(r.x,i.x)+S,c=Math.min(r.y+r.h,i.y+i.h)-Math.max(r.y,i.y)+S;if(!(s<=S||c<=S)){if(e=!0,c<=s*1.4){let e=r.ay+r.y/1e6<=i.ay+i.y/1e6?r:i,t=e===r?i:r;e.y-=c/2,t.y+=c/2}else{let e=r.ax<=i.ax?r:i,t=e===r?i:r;e.x-=s/2,t.x+=s/2}o(r),o(i)}}if(!e)break}for(let e of a)j(e)}function A(e,t){e.shown!==t&&(e.shown=t,e.el.classList.toggle(`is-off`,!t),e.dot.classList.toggle(`is-off`,!t),t||e.leader.classList.add(`is-off`))}function j(e){let{it:t}=e,n=Math.round(e.x),r=Math.round(e.y);(n!==t.tx||r!==t.ty)&&(t.tx=n,t.ty=r,t.el.style.transform=`translate3d(${n}px,${r}px,0)`),t.dot.style.transform=`translate3d(${Math.round(e.ax)}px,${Math.round(e.ay)}px,0)`;let i=Math.max(e.x+10,Math.min(e.x+e.w-10,e.ax)),a=e.ay<e.y?e.y:e.y+e.h,o=i-e.ax,s=a-e.ay,c=e.ax-e.w/2,l=e.ay-e.h-x,u=Math.abs(e.x-c)>14||Math.abs(e.y-l)>14,d=Math.hypot(o,s),f=u&&d>4;t.tail!==!u&&(t.tail=!u,t.el.classList.toggle(`has-tail`,t.tail)),f!==t.lead&&(t.lead=f,t.leader.classList.toggle(`is-off`,!f)),f&&(t.leader.style.transform=`translate3d(${e.ax.toFixed(1)}px,${e.ay.toFixed(1)}px,0) rotate(${Math.atan2(s,o).toFixed(4)}rad) scaleX(${(d/100).toFixed(3)})`)}function M(){for(let[e,t]of s)t.el.classList.toggle(`is-selected`,u===e),t.el.classList.toggle(`is-hover`,d===e)}return window.addEventListener(`resize`,()=>E()),document.fonts?.ready?.then(()=>E()),{update:b,measure:E,setAnchors:D,setSafe(e){let t=e.top!==l.top||e.bottom!==l.bottom||e.right!==l.right;l=e,t&&k()},setSelected(e){u=e,M()},setHover(e){d=e,M()},setVisible(t){e.classList.toggle(`is-hidden`,!t)}}}function E(e){let t=[];for(let n of e?.problems??[]){if(n.chosen||n.status===`working`)continue;let r=n.deadline!=null&&n.deadline<=e.period;n.origin===`opportunity`?r&&t.push({p:n,text:`cơ hội hết hạn kỳ này`,soft:!0}):(n.status===`escalated`||n.severity>=3||r)&&t.push({p:n,text:r?`hết hạn kỳ này`:n.status===`escalated`?`đang leo thang`:`mức nặng`})}return t}function D(e,{confirmOpen:n=!1,testMode:r=!1}={}){let i=e.slots??{used:0,max:2},a=i.used>=i.max,o=E(e),s=o.filter(e=>!e.soft).length,c=e.period>=e.totalPeriods;return`
    <div class="rg-top-row">
      <div class="rg-period" aria-label="Kỳ ${e.period} trên ${e.totalPeriods}">
        <span class="rg-eyebrow">Kỳ</span>
        <span class="rg-period-num"><b>${t(e.period)}</b><small>/${t(e.totalPeriods)}</small></span>
      </div>
      <ul class="rg-stats">
        <li class="rg-stat is-budget" title="Ngân sách hiện có">${p(`budget`)}<span class="rg-stat-label">Ngân sách</span><b>${t(e.budget)}</b></li>
        <li class="rg-stat" title="Thu dự kiến kỳ tới, đã trừ phí duy trì">${p(`income`)}<span class="rg-stat-label">Thu kỳ tới</span><b>${t(v(e.incomeNext))}</b></li>
        <li class="rg-stat${e.upkeep>0?` is-upkeep`:``}" title="Phí duy trì đang trả mỗi kỳ">${p(`upkeep`)}<span class="rg-stat-label">Phí duy trì</span><b>${e.upkeep>0?`−`+t(e.upkeep):`0`}<small>/kỳ</small></b></li>
        <li class="rg-stat${a?` is-full`:``}" title="Dự án dài hạn đang thi công (tối đa ${t(i.max)})">${p(`project`)}<span class="rg-stat-label">Dự án</span><b>${t(i.used)}/${t(i.max)}</b>${a?`<span class="rg-stat-note">đã đủ</span>`:``}</li>
      </ul>
      ${r?`<span class="rg-badge-test">Thử nghiệm</span>`:``}
      <div class="rg-next-wrap">
        <button type="button" class="rg-next${s?` has-warn`:``}" data-action="next" aria-keyshortcuts="N">
          ${p(s?`attention`:`next`)}<span>${c?`Kết thúc ván`:`Sang kỳ tiếp theo`}</span><kbd>N</kbd>
        </button>
        ${n?O(e,o,c):``}
      </div>
    </div>`}function O(e,n,r){return`<div class="rg-confirm" role="alertdialog" aria-label="Còn việc chưa xử lý">
    <p class="rg-confirm-title">${p(`attention`)}<b>Còn ${n.length} việc chưa xử lý</b></p>
    <ul>${n.slice(0,4).map(n=>`<li><button type="button" class="rg-linkish" data-open-problem="${t(n.p.instanceId)}" data-region="${t(n.p.region)}">${t(n.p.title)}</button> <span class="rg-muted">· ${t(m(e,n.p.region).short)} · ${t(n.text)}</span></li>`).join(``)}</ul>
    <p class="rg-muted rg-confirm-hint">Vấn đề chưa xử lý sẽ tiếp tục sang kỳ sau${r?``:` và có thể nặng thêm`}.</p>
    <div class="rg-confirm-actions">
      <button type="button" class="rg-btn is-primary" data-action="next-confirm">${r?`Vẫn kết thúc`:`Vẫn sang kỳ`} <kbd>N</kbd></button>
      <button type="button" class="rg-btn" data-action="next-cancel">Ở lại <kbd>Esc</kbd></button>
    </div>
  </div>`}function k(e,{expanded:n=!1}={}){let r=(e.news??[]).filter(t=>t.period===e.period);if(!r.length)return``;let i=n?r.length:2,a=r.slice(0,i),o=r.length-a.length;return`
    <h2 class="rg-news-head">${p(`news`)}<span>Tin kỳ ${t(e.period)}</span></h2>
    <ul class="rg-news-list">
      ${a.map(n=>`<li class="rg-news-item is-${t(n.tone||`neutral`)}"${n.region?` data-region-hover="${t(n.region)}"`:``}>
        ${p(n.tone===`good`?`good`:n.tone===`bad`?`bad`:`neutral`,`rg-news-ic`)}
        <span class="rg-news-text">${n.region?`<b class="rg-news-region">${t(m(e,n.region).short)}:</b> `:``}${t(n.text)}${n.chain?.length?`<span class="rg-news-chain"><span class="rg-sr">Chuỗi: </span>${_(n.chain)}</span>`:``}</span>
      </li>`).join(``)}
    </ul>
    ${o>0||n?`<button type="button" class="rg-linkish rg-news-more" data-action="news-toggle">${n?`Thu gọn`:`+${o} tin khác`}</button>`:``}`}var A=[`A`,`B`,`C`,`D`];function j(e,t){return(t.problems??[]).map(t=>e.problems?.find(e=>e.instanceId===t)).filter(Boolean)}function M(e){let t=Math.round(Number(e)||0);return t>0?`<span class="rg-trend is-up" title="Tăng ${t} so với kỳ trước">${p(`up`)}<span>${v(t)}</span></span>`:t<0?`<span class="rg-trend is-down" title="Giảm ${-t} so với kỳ trước">${p(`down`)}<span>${v(t)}</span></span>`:`<span class="rg-trend is-flat" title="Không đổi so với kỳ trước">${p(`flat`)}<span>0</span></span>`}function N(e){return`<ul class="rg-inds">${l.map(({key:t,label:n})=>{let r=Math.max(0,Math.min(100,Math.round(e.indicators?.[t]??0)));return`<li class="rg-ind">
      <span class="rg-ind-label">${n}</span>
      <span class="rg-bar" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${r}" aria-label="${n}"><span style="width:${r}%"></span></span>
      <b class="rg-ind-val">${r}</b>${M(e.trend?.[t])}
    </li>`}).join(``)}</ul>`}function P(e){let n=e.services??[];if(!n.length)return``;let r={short:0,tight:1,ok:2};return`<section class="rg-sec"><h3 class="rg-sec-title">Dịch vụ thiết yếu</h3>
    <ul class="rg-svcs">${[...n].sort((e,t)=>(r[e.status]??3)-(r[t.status]??3)).map(e=>{let n=e.need>0?Math.max(0,Math.min(100,Math.round(e.have/e.need*100))):100,r=e.status===`short`?`attention`:e.status===`tight`?`clock`:`stable`;return`<li class="rg-svc is-${t(e.status)}">
        <span class="rg-svc-label">${t(e.label)}</span>
        <span class="rg-svc-state">${p(r)}${t(c[e.status]??e.status)}</span>
        <span class="rg-svc-nums" title="Có ${t(e.have)} trên nhu cầu ${t(e.need)}">có <b>${t(e.have)}</b> / cần ${t(e.need)}</span>
        <span class="rg-svc-bar" aria-hidden="true"><span style="width:${n}%"></span></span>
      </li>`}).join(``)}</ul></section>`}function F(e,n){let r=(e.projects??[]).filter(e=>e.region===n.id||(n.projects??[]).includes(e.id));return r.length?`<section class="rg-sec"><h3 class="rg-sec-title">Công trình</h3>
    <ul class="rg-projs">${r.map(e=>`<li class="rg-proj${e.done?` is-done`:``}">
      ${p(e.done?`stable`:`project`)}<span class="rg-proj-label">${t(e.label)}</span>
      <span class="rg-proj-when">${e.done?`Đã hoàn tất`:t(e.doneText||`Hoàn tất kỳ ${e.doneAt}`)}</span>
    </li>`).join(``)}</ul></section>`:``}function I(e){let n=e.origin||`random`,r=n===`opportunity`?`opportunity`:n===`consequence`?`consequence`:`random`;return`<span class="rg-origin is-${t(n)}">${p(r)}${t(a[n]??n)}</span>`}function L(e){if(e.chosen||e.status===`working`){let n=e.chosen;return`<span class="rg-pstate is-working">${p(`clock`)}Đang xử lý${n?.completesAt?` · xong kỳ ${t(n.completesAt)}`:``}</span>`}return e.status===`escalated`?`<span class="rg-pstate is-escalated">${p(`urgent`)}Đang leo thang</span>`:e.deadlineText?`<span class="rg-pstate is-deadline">${p(`clock`)}${t(e.deadlineText)}</span>`:``}function R(e,n){let r=n.options?.length??0;return`<li><button type="button" class="rg-pcard is-${t(n.origin)}${n.chosen?` is-chosen`:``}" data-open-problem="${t(n.instanceId)}">
    <span class="rg-pcard-top">${I(n)}${n.severity?`<span class="rg-sev is-s${t(n.severity)}">Mức ${t(s[n.severity]??n.severity).toLowerCase()}</span>`:``}</span>
    <span class="rg-pcard-title">${t(n.title)}</span>
    <span class="rg-pcard-meta">${L(n)}${!n.chosen&&r?`<span class="rg-muted">${r} cách xử lý</span>`:``}${n.chosen?`<span class="rg-muted">Đã chọn: ${t(n.chosen.label??n.chosen.option)}</span>`:``}</span>
    <span class="rg-pcard-go" aria-hidden="true">›</span>
  </button></li>`}function z(e,n){let r=e.regions?.find(e=>e.id===n);if(!r)return``;let i=m(e,n),a=j(e,r);return`
    <header class="rg-ph">
      <button type="button" class="rg-iconbtn" data-action="close" title="Về bản đồ (Esc)" aria-label="Về bản đồ">${p(`back`)}<span>Bản đồ</span></button>
      <span class="rg-ph-crumb rg-muted">Vùng</span>
    </header>
    <div class="rg-pbody" data-scroll>
      <div class="rg-rhead">
        ${p(n,`rg-rhead-ic`)}
        <div>
          <h2 class="rg-rname">${t(i.name)}</h2>
          <span class="rg-status is-${t(r.status)}">${p(r.status||`stable`)}${t(h(r))}</span>
        </div>
      </div>
      ${r.line?`<p class="rg-line">${t(r.line)}</p>`:``}
      <section class="rg-sec"><h3 class="rg-sec-title">Việc cần xem${a.length?` (${a.length})`:``}</h3>
        ${a.length?`<ul class="rg-pcards">${a.map(t=>R(e,t)).join(``)}</ul>`:`<p class="rg-empty">Không có vấn đề đang mở. Vùng có thể chờ để bạn lo nơi khác.</p>`}
      </section>
      ${N(r)}
      ${P(r)}
      ${F(e,r)}
    </div>`}function B(e,n,r,i,a){let o=A[i]??``,s=n.chosen&&n.chosen.option===r.id,c=r.disabled||a,l=y(r);return`<li><button type="button" class="rg-opt${r.disabled?` is-disabled`:``}${s?` is-chosen`:``}${a&&!s?` is-locked`:``}"
      data-opt="${t(r.id)}" aria-disabled="${c?`true`:`false`}" ${o?`aria-keyshortcuts="${o}"`:``}>
    <span class="rg-opt-head"><kbd class="rg-opt-key">${o}</kbd><span class="rg-opt-label">${t(r.label)}</span>${s?`<span class="rg-opt-tag">Đã chọn</span>`:``}</span>
    <span class="rg-opt-facts">
      <span class="rg-fact is-cost">${p(`budget`)}${t(l[0])}</span>
      ${l[1]?`<span class="rg-fact is-upkeep">${p(`upkeep`)}${t(l[1])}</span>`:``}
      <span class="rg-fact">${p(`clock`)}${t(b(r))}</span>
      ${r.project?`<span class="rg-fact is-project">${p(`project`)}Dự án dài hạn · ${t(e.slots?.used??0)}/${t(e.slots?.max??2)} chỗ</span>`:``}
    </span>
    ${r.preview?`<span class="rg-opt-preview">${t(r.preview)}</span>`:``}
    ${r.disabled&&r.reason?`<span class="rg-opt-reason">${p(`lock`)}${t(r.reason)}</span>`:``}
  </button></li>`}function V(n,r){let i=m(n,r.region),a=!!r.chosen||r.status===`working`,o=(r.affects??[]).filter(Boolean),c=r.links??[];return`
    <header class="rg-ph">
      <button type="button" class="rg-iconbtn" data-action="back" title="Về vùng (Esc)" aria-label="Về vùng ${t(i.short)}">${p(`back`)}<span>${t(i.short)}</span></button>
      <button type="button" class="rg-iconbtn is-quiet" data-action="close" title="Về bản đồ" aria-label="Về bản đồ">${p(`close`)}<span>Bản đồ</span></button>
    </header>
    <div class="rg-pbody" data-scroll>
      <div class="rg-prob-top">${I(r)}${r.severity?`<span class="rg-sev is-s${t(r.severity)}">Mức ${t(s[r.severity]??r.severity).toLowerCase()}</span>`:``}${L(r)}</div>
      <h2 class="rg-ptitle">${t(r.title)}</h2>
      ${r.causes?.length?`<p class="rg-causes"><span class="rg-causes-lead">Vì</span>${_([...r.causes,r.title])}</p>`:``}
      ${r.text?`<p class="rg-ptext">${t(r.text)}</p>`:``}
      ${o.length?`<div class="rg-affects"><span class="rg-muted">Vùng liên quan:</span>${o.map(e=>`<button type="button" class="rg-chip-region${e===r.region?` is-home`:``}" data-region-chip="${t(e)}">${t(m(n,e).short)}</button>`).join(``)}</div>`:``}
      ${c.length?`<ul class="rg-links">${c.map(e=>`<li class="rg-link is-${t(e.kind)}"><span class="rg-link-line" aria-hidden="true"></span><span>${t(m(n,e.from).short)} → ${t(m(n,e.to).short)}: ${t(e.label??e.service)} <span class="rg-muted">(${t(u[e.kind]??e.kind)})</span></span></li>`).join(``)}</ul>`:``}
      ${a?`<p class="rg-working">${p(`clock`)}<span>Đã chọn <b>${t(r.chosen?.label??r.chosen?.option??``)}</b>${r.chosen?.period?` ở kỳ ${t(r.chosen.period)}`:``}. Đang thực hiện${r.chosen?.completesAt?`, có tác dụng từ kỳ ${t(r.chosen.completesAt)}`:``}. Vấn đề vẫn còn cho tới khi xong.</span></p>`:``}
      <h3 class="rg-sec-title">${a?`Các cách đã cân nhắc`:`Chọn cách xử lý`}</h3>
      <ul class="rg-opts">${(r.options??[]).map((e,t)=>B(n,r,e,t,a)).join(``)}</ul>
      ${r.wait?.preview&&!a?`<p class="rg-wait">${p(`wait`)}<span><b>Chờ:</b> ${t(r.wait.preview)}</span></p>`:``}
      ${r.learn?`<details class="rg-learn"><summary>${p(`book`)}Liên hệ môn học</summary>
        <p><b>${t(r.learn.topic)}</b>${r.learn.chapter?` <span class="rg-muted">· ${t(e(r.learn.chapter))}</span>`:``}</p>
        ${r.learn.note?`<p>${t(r.learn.note)}</p>`:``}
      </details>`:``}
      ${r.code?`<p class="rg-code rg-muted">Mã ${t(r.code)}</p>`:``}
    </div>`}function H(e){let n=e.paragraphs??[];return`
    <div class="rg-brief" role="dialog" aria-modal="false" aria-labelledby="rg-brief-title">
      <p class="rg-eyebrow">Hòa Minh · chế độ quản lý vùng</p>
      <h1 id="rg-brief-title" class="rg-brief-title">${t(e.title??`Điều hành đất nước qua bản đồ vùng`)}</h1>
      ${n.map(e=>`<p>${t(e)}</p>`).join(``)}
      <ol class="rg-steps" aria-label="Vòng chơi">
        <li>${p(`attention`)}<span>Nhìn bản đồ: nơi nào đang cần quan tâm</span></li>
        <li>${p(`NN`)}<span>Chọn vùng (bấm hoặc phím 1–6)</span></li>
        <li>${p(`budget`)}<span>Chọn cách xử lý trong ngân sách (A/B/C)</span></li>
        <li>${p(`next`)}<span>Sang kỳ tiếp theo (N) và xem vùng thay đổi</span></li>
      </ol>
      <div class="rg-brief-actions">
        <button type="button" class="rg-btn is-primary is-big" data-action="start">Bắt đầu điều hành <kbd>Enter</kbd></button>
      </div>
    </div>`}function U(e,t){return`<span class="rg-mini">${l.map(({key:n,label:r})=>{let i=Math.round(e?.[n]??0),a=Math.round(t?.[n]??0),o=a-i;return`<span class="rg-mini-row" title="${r}: ${i} → ${a}">
      <span class="rg-mini-label">${r}</span>
      <span class="rg-mini-bar" aria-hidden="true"><span class="is-before" style="width:${Math.max(0,Math.min(100,i))}%"></span><span class="is-after" style="width:${Math.max(0,Math.min(100,a))}%"></span></span>
      <span class="rg-mini-num">${i} → <b>${a}</b> <span class="rg-delta ${o>0?`is-up`:o<0?`is-down`:``}">(${v(o)})</span></span>
    </span>`}).join(``)}</span>`}var W=[{key:`output`,label:`Sản xuất`,short:`Sản xuất`,color:`#2a78d6`,dash:``},{key:`wellbeing`,label:`Đời sống`,short:`Đời sống`,color:`#eb6834`,dash:`10 6`},{key:`access`,label:`Tiếp cận dịch vụ`,short:`Tiếp cận`,color:`#1baf7a`,dash:`3 5`},{key:`gap`,label:`Chênh lệch giữa vùng`,short:`Chênh lệch`,color:`#b07c00`,dash:`14 5 3 5`}];function G(e){if(!e?.length)return`<p class="rg-muted">Chưa có số liệu theo kỳ.</p>`;let n=e.length,r=e=>44+(n===1?233:e/(n-1)*466),i=e=>260-Math.max(0,Math.min(100,e))/100*244,a=[0,25,50,75,100].map(e=>`<g><line x1="44" x2="510" y1="${i(e)}" y2="${i(e)}" class="rg-ch-grid"/><text x="36" y="${i(e)+5}" text-anchor="end" class="rg-ch-tick">${e}</text></g>`).join(``),o=e.map((e,n)=>`<text x="${r(n)}" y="282" text-anchor="middle" class="rg-ch-tick">${t(e.period)}</text>`).join(``),s=W.map(t=>({s:t,y:i(e[n-1].national?.[t.key]??0),v:Math.round(e[n-1].national?.[t.key]??0)})).sort((e,t)=>e.y-t.y);for(let e=1;e<s.length;e++)s[e].y-s[e-1].y<18&&(s[e].y=s[e-1].y+18);return`
    <figure class="rg-chart">
      <svg viewBox="0 0 640 300" role="img" aria-label="Chỉ số cả nước theo kỳ">
        ${a}${o}
        <text x="277" y="296" text-anchor="middle" class="rg-ch-axis">Kỳ</text>
        ${W.map(n=>{let a=e.map((e,t)=>`${r(t).toFixed(1)},${i(e.national?.[n.key]??0).toFixed(1)}`).join(` `),o=e.map((e,a)=>`<circle cx="${r(a).toFixed(1)}" cy="${i(e.national?.[n.key]??0).toFixed(1)}" r="4" fill="${n.color}" class="rg-ch-dot"><title>Kỳ ${t(e.period)} · ${n.label}: ${Math.round(e.national?.[n.key]??0)}</title></circle>`).join(``);return`<polyline points="${a}" fill="none" stroke="${n.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" ${n.dash?`stroke-dasharray="${n.dash}"`:``}/>${o}`}).join(``)}${s.map(e=>`<text x="520" y="${(e.y+5).toFixed(1)}" class="rg-ch-end">${e.s.short} ${e.v}</text>`).join(``)}
      </svg>
      <figcaption class="rg-legend">${W.map(e=>`<span><svg viewBox="0 0 30 10" aria-hidden="true"><line x1="1" x2="29" y1="5" y2="5" stroke="${e.color}" stroke-width="3" ${e.dash?`stroke-dasharray="${e.dash.split(` `).map(e=>Math.max(2,e*.6)).join(` `)}"`:``}/></svg>${e.label}</span>`).join(``)}
        <span class="rg-muted">Chênh lệch: càng thấp càng đều giữa các vùng.</span></figcaption>
    </figure>
    <details class="rg-sub"><summary>Xem bảng số</summary>
      <table class="rg-table"><thead><tr><th>Kỳ</th>${W.map(e=>`<th>${e.label}</th>`).join(``)}</tr></thead>
      <tbody>${e.map(e=>`<tr><td>${t(e.period)}</td>${W.map(t=>`<td>${Math.round(e.national?.[t.key]??0)}</td>`).join(``)}</tr>`).join(``)}</tbody></table>
    </details>`}function K(r){let i=r.summary??{},a=e=>t(m(r,e).short),o=n.filter(e=>i.before?.[e]||i.after?.[e]),s=(i.topics??[]).filter(e=>e.seen),c=(i.topics??[]).filter(e=>!e.seen);return`
    <div class="rg-end" role="dialog" aria-modal="false" aria-labelledby="rg-end-title">
      <header class="rg-end-head">
        <p class="rg-eyebrow">Tổng kết sau ${t(r.totalPeriods??``)} kỳ</p>
        <h1 id="rg-end-title" class="rg-end-title">${t(i.headline??`Kết thúc nhiệm kỳ`)}</h1>
        ${i.text?`<p class="rg-end-lead">${t(i.text)}</p>`:``}
      </header>
      <div class="rg-end-body" data-scroll>
        <div class="rg-end-cols">
          <section class="rg-end-box is-good"><h2>${p(`up`)}Vùng đã khá lên</h2>
            ${(i.improved??[]).length?`<ul>${i.improved.map(e=>`<li><b>${a(e.region)}</b> · ${t(e.text)}</li>`).join(``)}</ul>`:`<p class="rg-muted">Chưa vùng nào cải thiện rõ.</p>`}
          </section>
          <section class="rg-end-box is-bad"><h2>${p(`down`)}Nơi còn bị bỏ lại</h2>
            ${(i.leftBehind??[]).length?`<ul>${i.leftBehind.map(e=>`<li><b>${a(e.region)}</b> · ${t(e.text)}</li>`).join(``)}</ul>`:`<p class="rg-muted">Không vùng nào bị tụt lại rõ rệt.</p>`}
          </section>
        </div>

        ${(i.chains??[]).length?`<section class="rg-end-sec"><h2>Ba chuỗi đáng nhớ</h2>
          <ol class="rg-chains">${i.chains.slice(0,3).map(e=>`<li class="rg-chaincard">
            <h3>${t(e.title)}${e.period?` <span class="rg-muted">· kỳ ${t(e.period)}</span>`:``}</h3>
            <ol class="rg-chain-steps">${(e.steps??[]).map(e=>`<li>${t(e)}</li>`).join(``)}</ol>
          </li>`).join(``)}</ol></section>`:``}

        ${o.length?`<section class="rg-end-sec"><h2>Bản đồ trước → sau</h2>
          <ul class="rg-ba">${o.map(e=>`<li class="rg-ba-row"><span class="rg-ba-name">${p(e)}${a(e)}</span>${U(i.before?.[e],i.after?.[e])}</li>`).join(``)}</ul>
          <p class="rg-muted rg-ba-key"><span class="rg-key-swatch is-before"></span>đầu ván <span class="rg-key-swatch is-after"></span>cuối ván</p>
        </section>`:``}

        ${(i.openProblems??[]).length?`<section class="rg-end-sec"><h2>Việc còn dang dở</h2>
          <ul class="rg-open">${i.openProblems.map(e=>`<li>${p(`attention`)}<b>${a(e.region)}</b> · ${t(e.title)}</li>`).join(``)}</ul></section>`:``}

        <details class="rg-end-more"><summary>${p(`income`)}Số liệu cả nước qua các kỳ</summary>${G(i.timeline)}</details>

        <details class="rg-end-more"><summary>${p(`book`)}Liên hệ môn học (${s.length}/${(i.topics??[]).length} chủ đề đã gặp)</summary>
          ${s.length?`<h3 class="rg-sec-title">Đã gặp trong ván</h3><ul class="rg-topics">${s.map(n=>`<li class="is-seen">${p(`stable`)}<span><b>${t(n.topic)}</b>${n.chapter?` <span class="rg-muted">· ${t(e(n.chapter))}</span>`:``}${(n.via??[]).length?`<span class="rg-via">qua: ${n.via.map(t).join(`; `)}</span>`:``}</span></li>`).join(``)}</ul>`:``}
          ${c.length?`<h3 class="rg-sec-title">Chưa gặp trong ván này</h3><p class="rg-muted">Phiên này ngắn hoặc chưa đi qua các tình huống đó; không tính là đã học.</p><ul class="rg-topics">${c.map(n=>`<li class="is-unseen">${p(`neutral`)}<span>${t(n.topic)}${n.chapter?` <span class="rg-muted">· ${t(e(n.chapter))}</span>`:``}</span></li>`).join(``)}</ul>`:``}
        </details>

        ${(i.decisions??[]).length?`<details class="rg-end-more"><summary>${p(`keys`)}Các quyết định đã đưa ra (${i.decisions.length})</summary>
          <ol class="rg-decisions">${i.decisions.map(e=>`<li><span class="rg-muted">Kỳ ${t(e.period)} · ${a(e.region)}</span> ${t(e.title)} → <b>${t(e.option)}</b></li>`).join(``)}</ol>
        </details>`:``}
      </div>
      <footer class="rg-end-foot">
        <button type="button" class="rg-btn is-primary is-big" data-action="restart">${p(`restart`)}Chơi ván mới</button>
      </footer>
    </div>`}var q=[`a`,`b`,`c`,`d`],J=350,Y=700,X=1500;function Z(e,{onAction:t=()=>{},onSelect:r=()=>{},onHover:i=()=>{},onFocusProblem:a=()=>{},onUndo:o}={}){let s=new URLSearchParams(location.search).get(`test`)===`1`,c={view:null,selected:null,problem:null,focused:null,hover:null,confirm:!1,newsOpen:!1,acting:!1,openedAt:0,choseAt:0,shownAt:0};e.classList.add(`rg-root`),e.innerHTML=`
    <div class="rg-ui" data-phase="">
      <div class="rg-labels" aria-label="Các vùng trên bản đồ"></div>
      <header class="rg-top" hidden></header>
      <section class="rg-news" aria-label="Tin tức kỳ này" aria-live="polite"></section>
      <p class="rg-keyhint"><kbd>1</kbd>–<kbd>6</kbd> chọn vùng · <kbd>Tab</kbd> vùng kế · <kbd>N</kbd> sang kỳ · <kbd>F</kbd> toàn màn hình</p>
      <aside class="rg-panel" aria-label="Bảng vùng" hidden></aside>
      <div class="rg-overlay"></div>
      <div class="rg-toasts" aria-live="polite"></div>
    </div>`;let l=e.querySelector(`.rg-ui`),u=l.querySelector(`.rg-top`),d=l.querySelector(`.rg-news`),f=l.querySelector(`.rg-panel`),p=l.querySelector(`.rg-overlay`),h=l.querySelector(`.rg-toasts`),g=T(l.querySelector(`.rg-labels`),{onHover:e=>F(e,!0),onSelect:e=>{c.view?.phase===`period`&&M(e===c.selected&&!c.problem?null:e)},onOpenProblem:e=>N(e)}),_=e=>c.view?.problems?.find(t=>t.instanceId===e)??null,v=()=>c.view?.phase===`period`;function y(e,t=``){let n=h.lastElementChild;if(n&&n.textContent===e&&!n.classList.contains(`is-out`))return;let r=document.createElement(`div`);for(r.className=`rg-toast ${t}`,r.textContent=e,h.appendChild(r);h.children.length>3;)h.firstElementChild.remove();setTimeout(()=>r.classList.add(`is-out`),2200),setTimeout(()=>r.remove(),2700)}function b(e){let t=c.focused;if(c.focused=e,t!==e)try{a(e)}catch(e){console.error(`[ui-regions] onFocusProblem failed`,e)}}function x(){let e=u.hidden?0:u.offsetHeight;l.style.setProperty(`--top-h`,`${e}px`);let t=!f.hidden;g.setSafe({top:e?u.offsetTop+e:0,bottom:0,right:t?f.offsetLeft-4:1/0})}function S(){v()?(u.hidden=!1,u.innerHTML=D(c.view,{confirmOpen:c.confirm,testMode:s})):(u.hidden=!0,u.innerHTML=``)}function C(){d.innerHTML=v()?k(c.view,{expanded:c.newsOpen}):``}function w({animate:e=!1,keepScroll:t=!0}={}){let n=f.hidden,r=`${c.selected}|${c.problem}`,i=f.dataset.key===r,a=t&&i?f.querySelector(`[data-scroll]`)?.scrollTop??0:0;if(!v()||!c.selected){f.hidden=!0,f.innerHTML=``,f.dataset.key=``,l.classList.remove(`has-panel`),x();return}let o=c.problem?_(c.problem):null;f.innerHTML=o?V(c.view,o):z(c.view,c.selected),f.dataset.key=r,f.setAttribute(`aria-label`,o?`Vấn đề: ${o.title}`:`Vùng ${m(c.view,c.selected).name}`),f.hidden=!1,l.classList.add(`has-panel`);let s=f.querySelector(`[data-scroll]`);s&&(s.scrollTop=a),(e||n)&&!i&&(f.classList.remove(`is-enter`),f.offsetWidth,f.classList.add(`is-enter`)),x()}function O(){let e=c.view;e.phase===`briefing`?p.innerHTML=H(e):e.phase===`end`?p.innerHTML=K(e):p.innerHTML=``}function A(e){if(!e)return;let t=c.view;c.view=e,c.acting=!1,l.dataset.phase=e.phase;let n=!t||t.phase!==e.phase,i=!t||t.period!==e.period;if(e.phase!==`period`)c.selected&&(c.selected=null,j(r,null)),c.problem=null,c.confirm=!1,b(null);else{if(i&&(c.confirm=!1,c.newsOpen=!1),c.selected&&!e.regions?.some(e=>e.id===c.selected)&&(c.selected=null,c.problem=null,j(r,null)),c.problem){let e=_(c.problem);e?b(e):(c.problem=null,b(null))}t?.phase===`period`&&i&&y(`Bắt đầu kỳ ${e.period}/${e.totalPeriods}`)}S(),C(),g.setVisible(e.phase!==`end`),g.setSelected(c.selected),g.update(e),(n||e.phase!==`period`)&&O(),w(),n&&(c.shownAt=performance.now(),(e.phase===`briefing`||e.phase===`end`)&&requestAnimationFrame(()=>p.querySelector(`[data-action="start"], .rg-end-title`)?.focus?.({preventScroll:!0})))}function j(e,...t){try{e(...t)}catch(e){console.error(`[ui-regions] callback failed`,e)}}function M(e,{problem:t=null}={}){if(!v()||e!=null&&!n.includes(e)&&!c.view.regions?.some(t=>t.id===e))return;let i=c.selected,a=c.problem;c.selected=e??null,c.problem=e?t:null,c.confirm=!1,c.problem&&c.problem!==a&&(c.openedAt=performance.now()),g.setSelected(c.selected),S(),w({animate:i!==c.selected,keepScroll:!1}),i!==c.selected&&j(r,c.selected),b(c.problem?_(c.problem):null)}function N(e){let t=_(e);t&&v()&&M(t.region,{problem:e})}function P(){return c.confirm?(c.confirm=!1,S(),!0):c.problem?(M(c.selected),!0):c.selected?(M(null),!0):!1}function F(e,t){c.hover!==e&&(c.hover=e,g.setHover(e),t&&j(i,e))}function I(e,n){if(c.acting)return!1;c.acting=!0;let r=setTimeout(()=>{c.acting=!1},X);try{return t(e),!0}catch(e){return console.error(`[ui-regions] onAction failed`,e),y(e?.message&&/[À-ỹ]/.test(e.message)?e.message:`Không thực hiện được thao tác này`,`is-bad`),c.acting=!1,clearTimeout(r),n?.classList.remove(`is-picked`),!1}}function L(e,{fromKey:t=!1}={}){let n=_(c.problem);if(!n||!v())return;let r=n.options?.find(t=>String(t.id)===String(e));if(!r)return;let i=performance.now();if(t&&i-c.openedAt<J||i-c.choseAt<Y)return;let a=f.querySelector(`[data-opt="${CSS.escape(String(r.id))}"]`);n.chosen||n.status===`working`?y(`Đã chọn “${n.chosen?.label??n.chosen?.option??``}”, đang thực hiện`):r.disabled?(y(r.reason||`Phương án này chưa thể chọn`,`is-bad`),a&&(a.classList.remove(`is-shake`),a.offsetWidth,a.classList.add(`is-shake`))):(c.choseAt=i,a?.classList.add(`is-picked`),I({type:`choose`,problem:n.instanceId,option:r.id},a)&&y(`Đã chọn: ${r.label}`,`is-good`))}function R(e=!1){v()&&!c.acting&&(E(c.view).length&&!e&&!c.confirm?(c.confirm=!0,S()):(c.confirm=!1,I({type:`endPeriod`})&&S()))}function B(){document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.().catch(()=>y(`Trình duyệt chặn toàn màn hình`))}function U(e){let t=n.filter(e=>c.view?.regions?.some(t=>t.id===e));if(!t.length)return;let r=t.indexOf(c.selected??c.hover);M(t[r<0?e>0?0:t.length-1:(r+e+t.length)%t.length])}function W(e){if(e.defaultPrevented||e.isComposing)return;let t=e.target;if(t&&(t.tagName===`INPUT`||t.tagName===`TEXTAREA`||t.tagName===`SELECT`||t.isContentEditable)||!c.view)return;let r=e.key,i=r.length===1?r.toLowerCase():r,a=c.view.phase;if((e.ctrlKey||e.metaKey)&&i===`z`){s&&typeof o==`function`&&(e.preventDefault(),c.acting=!1,j(o),y(`Đã hoàn tác (chế độ thử nghiệm)`));return}if(e.ctrlKey||e.metaKey||e.altKey)return;if(i===`f`){B(),e.preventDefault();return}if(a===`briefing`){r!==`Enter`&&r!==` `||e.repeat||t.closest?.(`button:not([data-action="start"])`)||(e.preventDefault(),I({type:`start`}));return}if(a!==`period`)return;if(r===`Escape`){P()&&(e.preventDefault(),f.contains(document.activeElement)&&document.activeElement.blur());return}if(r===`Tab`){if(t?.closest?.(`.rg-panel, .rg-confirm, .rg-news`))return;e.preventDefault(),U(e.shiftKey?-1:1);return}let l=/^Digit[1-6]$/.test(e.code??``)?e.code.slice(5):/^Numpad[1-6]$/.test(e.code??``)?e.code.slice(6):/^[1-6]$/.test(r)?r:null;if(l){if(e.preventDefault(),e.repeat)return;let t=n[Number(l)-1];c.view.regions?.some(e=>e.id===t)&&M(t);return}if(i===`n`){if(e.preventDefault(),e.repeat)return;R(c.confirm);return}let u=q.indexOf(i);if(u>=0&&c.problem){if(e.preventDefault(),e.repeat)return;let t=_(c.problem)?.options?.[u];t&&L(t.id,{fromKey:!0})}else if(r===`Enter`&&c.selected&&!t?.closest?.(`button, summary, a`)){let t=f.querySelector(`.rg-pcard, .rg-opt:not(.is-locked), [data-action]`);t&&(e.preventDefault(),t.focus())}else if((r===`ArrowDown`||r===`ArrowUp`||r===`PageDown`||r===`PageUp`)&&c.selected&&!f.contains(t)){let t=f.querySelector(`[data-scroll]`);if(t){e.preventDefault();let n=r===`PageDown`?.85:r===`PageUp`?-.85:r===`ArrowDown`?.25:-.25;t.scrollBy({top:n*t.clientHeight})}}}window.addEventListener(`keydown`,W),l.addEventListener(`click`,e=>{let t=e.target.closest(`[data-action], [data-open-problem], [data-opt], [data-region-chip]`);if(!t||!l.contains(t))return;if(t.dataset.openProblem){N(t.dataset.openProblem),G(t,e);return}if(t.dataset.regionChip){M(t.dataset.regionChip);return}if(t.dataset.opt){L(t.dataset.opt),G(t,e);return}let n=t.dataset.action;G(t,e),n===`next`?R(c.confirm):n===`next-confirm`?R(!0):n===`next-cancel`?(c.confirm=!1,S()):n===`close`?M(null):n===`back`?M(c.selected):n===`news-toggle`?(c.newsOpen=!c.newsOpen,C()):n===`start`?I({type:`start`}):n===`restart`&&I({type:`restart`})});function G(e,t){t.detail>0&&e.blur?.()}return l.addEventListener(`pointerover`,e=>{let t=e.target.closest(`[data-region-chip], [data-region-hover]`);t&&F(t.dataset.regionChip||t.dataset.regionHover,!0)}),l.addEventListener(`pointerout`,e=>{let t=e.target.closest(`[data-region-chip], [data-region-hover]`);t&&!t.contains(e.relatedTarget)&&F(null,!0)}),window.addEventListener(`resize`,()=>x()),{render:A,setAnchors:e=>g.setAnchors(e),select:e=>{(e??null)!==c.selected&&M(e??null)},hover:e=>F(e??null,!1),toast:(e,t)=>y(String(e),t),get selected(){return c.selected},get openProblem(){return c.problem},destroy(){window.removeEventListener(`keydown`,W),e.innerHTML=``}}}export{Z as createRegionUI};