// Tunable numbers for the simulation (GDD §3). Everything here is a design
// assumption for gameplay, not a measured quantity.

export const METRIC_KEYS = ['PROD', 'LIFE', 'TRUST', 'LAW', 'EQUITY', 'COHESION'];
export const RESOURCE_KEYS = ['BUDGET', 'CAPACITY', 'DEBT'];
export const COUNTER_KEYS = ['latent_discontent', 'consecutive_budget_deficit', 'random_events_seen'];

export const INITIAL = {
  metrics: { PROD: 52, LIFE: 48, TRUST: 54, LAW: 51, EQUITY: 45, COHESION: 57 },
  // GDD lists BUDGET=60 and base income 12. With those numbers the budget never
  // binds and "always pick A" wins every run. Tuned with `npm run sim` so that
  // budget/debt is the real constraint: blind always-A reaches E1 in ~1/3 of runs,
  // a budget-aware balanced player in ~1/2, random play almost never.
  resources: { BUDGET: 0, CAPACITY: 50, DEBT: 0 },
};

export const RULES = {
  years: 8,
  income: { base: 8, prodPivot: 50, prodStep: 15, debtStep: 25, min: 5 },
  // A choice is selectable only if BUDGET - cost >= minBalance.
  minBalance: -10,
  // End of year: BUDGET<0 is financed by borrowing: DEBT += |BUDGET| * deficitDebtFactor, BUDGET := 0.
  deficitDebtFactor: 2,
  // Two consecutive deficit years: LIFE and TRUST penalty at the next year start.
  deficitPenalty: { LIFE: -2, TRUST: -2 },
  // CAPACITY below this cuts every positive effect of complex policies.
  lowCapacity: 35,
  lowCapacityFactor: 0.6,
  // Fallback "thí điểm / phân kỳ": cost and positive effects scaled.
  fallbackCostFactor: 0.5,
  fallbackEffectFactor: 0.5,
  // Random events.
  random: {
    maxPerSession: 3,
    firstYear: 2,
    chance: 0.42, // chance to draw when only "background" events are eligible
    consequenceChance: 0.75, // chance when an event illustrating earlier flags is eligible
  },
  // Early crisis (GDD §7.1). Checked at end of every year; 2 consecutive years -> FINAL_REPAIR.
  crisis: {
    institutional: { LAW: 15, TRUST: 15 },
    livelihood: { LIFE: 12, PROD: 15 },
    // After the repair the crisis is resolved only if the state is out of the zone by this margin.
    recoveryMargin: 3,
  },
};

export const METRIC_LABELS = {
  PROD: 'Năng lực sản xuất',
  LIFE: 'Đời sống & an sinh',
  TRUST: 'Niềm tin & tham gia',
  LAW: 'Pháp quyền & liêm chính',
  EQUITY: 'Công bằng cơ hội',
  COHESION: 'Đoàn kết & ổn định',
  BUDGET: 'Ngân sách',
  CAPACITY: 'Năng lực thực thi',
  DEBT: 'Áp lực nợ',
};

export const STAKEHOLDERS = {
  worker: 'Công nhân công nghiệp',
  farmer: 'Nông dân, hợp tác xã',
  platform: 'Lao động nền tảng',
  intellectual: 'Trí thức, kỹ sư',
  business: 'Doanh nghiệp tư nhân',
  minority: 'Cộng đồng dân tộc thiểu số',
  faith: 'Cộng đồng tín ngưỡng',
  family: 'Gia đình',
};
