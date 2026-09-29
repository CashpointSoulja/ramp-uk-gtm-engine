// Synthetic UK account universe. Every company, signal and number here is invented for the demo.
// As-of date for all relative signal ages: 29 September 2026.

export const AS_OF = "2026-09-29";

/** @typedef {{type: string, daysAgo?: number, inDays?: number, kind?: string, note: string}} Signal */
/** @typedef {{id: string, name: string, city: string, sector: string, employees: number, stage: string, ukEntity: boolean, gbpShare: number, entities: number, incumbent: string, accounting: string, monthlySpendGBP: number, aiNative: boolean, signals: Signal[]}} Account */

/** @type {Account[]} */

export const ACCOUNTS = [
  {
    id: "A01", name: "Larkspur Health", city: "London", sector: "Healthtech", employees: 140, stage: "Series B",
    ukEntity: true, gbpShare: 0.92, entities: 2, incumbent: "Pleo", accounting: "Xero", monthlySpendGBP: 62000, aiNative: false,
    signals: [
      { type: "finance_leader_hired", daysAgo: 18, note: "Hired a Head of Finance from a US-listed healthtech" },
      { type: "incumbent_renewal", inDays: 74, note: "Pleo annual plan renews in mid-December" },
    ],
  },
  {
    id: "A02", name: "Northbank Analytics", city: "London", sector: "B2B SaaS", employees: 210, stage: "Series C",
    ukEntity: true, gbpShare: 0.71, entities: 3, incumbent: "Spendesk", accounting: "NetSuite", monthlySpendGBP: 180000, aiNative: true,
    signals: [
      { type: "us_ramp_alumni", kind: "entity", note: "US subsidiary already runs on Ramp; UK entity runs on Spendesk" },
      { type: "ai_spend_growth", daysAgo: 20, note: "LLM API line items up sharply over the last two quarters" },
    ],
  },
  {
    id: "A03", name: "Tidewell Logistics", city: "Felixstowe", sector: "Logistics", employees: 480, stage: "PE-backed",
    ukEntity: true, gbpShare: 0.88, entities: 4, incumbent: "Amex + reimbursements", accounting: "NetSuite", monthlySpendGBP: 310000, aiNative: false,
    signals: [
      { type: "job_post_close_pain", daysAgo: 9, note: "Financial Controller ad asks for help getting month-end close under 10 days" },
      { type: "new_entity", daysAgo: 40, note: "Registered a fourth UK entity after an acquisition" },
    ],
  },
  {
    id: "A04", name: "Brightloom Studio", city: "Manchester", sector: "Creative agency", employees: 38, stage: "Bootstrapped",
    ukEntity: true, gbpShare: 0.97, entities: 1, incumbent: "Spreadsheets", accounting: "Xero", monthlySpendGBP: 14000, aiNative: false,
    signals: [
      { type: "accountant_referral", daysAgo: 6, note: "Their outsourced accountant (synthetic firm: Holloway & Pike) asked about card options" },
    ],
  },
  {
    id: "A05", name: "Quillstone AI", city: "London", sector: "AI infrastructure", employees: 95, stage: "Series A",
    ukEntity: true, gbpShare: 0.64, entities: 2, incumbent: "Revolut Business", accounting: "Xero", monthlySpendGBP: 140000, aiNative: true,
    signals: [
      { type: "funding_round", daysAgo: 27, note: "Closed a Series A" },
      { type: "ai_spend_growth", daysAgo: 12, note: "Model-provider bills now its second-largest cost line" },
      { type: "pricing_page_visit", daysAgo: 2, note: "Three visits to the UK pricing page this week" },
    ],
  },
  {
    id: "A06", name: "Harrow & Finch", city: "Edinburgh", sector: "Professional services", employees: 260, stage: "Partnership",
    ukEntity: true, gbpShare: 0.95, entities: 1, incumbent: "Soldo", accounting: "Sage 50", monthlySpendGBP: 90000, aiNative: false,
    signals: [
      { type: "incumbent_renewal", inDays: 45, note: "Soldo contract up for renewal in November" },
    ],
  },
  {
    id: "A07", name: "Copperleaf Energy", city: "Aberdeen", sector: "Energy services", employees: 620, stage: "PE-backed",
    ukEntity: true, gbpShare: 0.58, entities: 5, incumbent: "Amex + reimbursements", accounting: "NetSuite", monthlySpendGBP: 420000, aiNative: false,
    signals: [
      { type: "finance_leader_hired", daysAgo: 64, note: "New CFO appointed by the PE sponsor" },
      { type: "hiring_finance", daysAgo: 15, note: "Hiring two AP clerks" },
    ],
  },
  {
    id: "A08", name: "Marlow Kitchens", city: "Bristol", sector: "Hospitality", employees: 22, stage: "Bootstrapped",
    ukEntity: true, gbpShare: 1, entities: 1, incumbent: "Spreadsheets", accounting: "QuickBooks", monthlySpendGBP: 9000, aiNative: false,
    signals: [
      { type: "pricing_page_visit", daysAgo: 1, note: "Started a sign-up from the UK homepage but did not finish" },
    ],
  },
  {
    id: "A09", name: "Fernhill Robotics", city: "Cambridge", sector: "Deeptech", employees: 175, stage: "Series B",
    ukEntity: true, gbpShare: 0.66, entities: 2, incumbent: "Payhawk", accounting: "NetSuite", monthlySpendGBP: 150000, aiNative: false,
    signals: [
      { type: "funding_round", daysAgo: 55, note: "Raised a Series B" },
      { type: "headcount_growth", daysAgo: 30, note: "Headcount up about 30% in six months" },
    ],
  },
  {
    id: "A10", name: "Saltmarsh Outdoor", city: "Leeds", sector: "DTC retail", employees: 85, stage: "Series A",
    ukEntity: true, gbpShare: 0.9, entities: 1, incumbent: "Pleo", accounting: "Xero", monthlySpendGBP: 48000, aiNative: false,
    signals: [
      { type: "incumbent_renewal", inDays: 120, note: "Pleo renewal due in late January" },
      { type: "job_post_close_pain", daysAgo: 33, note: "Finance Manager ad mentions 'chasing receipts'" },
    ],
  },
  {
    id: "A11", name: "Ivybridge Capital Partners", city: "London", sector: "Investment firm", employees: 60, stage: "Partnership",
    ukEntity: true, gbpShare: 0.4, entities: 3, incumbent: "Amex + reimbursements", accounting: "Sage 50", monthlySpendGBP: 70000, aiNative: false,
    signals: [
      { type: "finance_leader_hired", daysAgo: 22, note: "New COO/CFO joined" },
    ],
  },
  {
    id: "A12", name: "Orbital Ledger", city: "London", sector: "Fintech", employees: 320, stage: "Series C",
    ukEntity: true, gbpShare: 0.76, entities: 3, incumbent: "Spendesk", accounting: "NetSuite", monthlySpendGBP: 240000, aiNative: true,
    signals: [
      { type: "us_ramp_alumni", kind: "person", note: "VP Finance ran Ramp at their previous US employer" },
      { type: "incumbent_renewal", inDays: 95, note: "Spendesk renewal in early January" },
    ],
  },
  {
    id: "A13", name: "Wrenfield Schools Trust", city: "Birmingham", sector: "Education", employees: 900, stage: "Charity",
    ukEntity: true, gbpShare: 1, entities: 1, incumbent: "Purchase cards (bank)", accounting: "Sage 50", monthlySpendGBP: 130000, aiNative: false,
    signals: [],
  },
  {
    id: "A14", name: "Kestrel Mobility", city: "Coventry", sector: "Automotive tech", employees: 130, stage: "Series A",
    ukEntity: true, gbpShare: 0.83, entities: 1, incumbent: "Expensify", accounting: "QuickBooks", monthlySpendGBP: 55000, aiNative: false,
    signals: [
      { type: "hiring_finance", daysAgo: 8, note: "Hiring a first Financial Controller" },
      { type: "headcount_growth", daysAgo: 45, note: "Opened a second site" },
    ],
  },
  {
    id: "A15", name: "Palisade Security", city: "Reading", sector: "Cybersecurity", employees: 240, stage: "Series B",
    ukEntity: true, gbpShare: 0.69, entities: 2, incumbent: "Moss", accounting: "Xero", monthlySpendGBP: 110000, aiNative: true,
    signals: [
      { type: "ai_spend_growth", daysAgo: 35, note: "Rolled out paid AI coding assistants company-wide" },
    ],
  },
  {
    id: "A16", name: "Hollowtree Games", city: "Dundee", sector: "Gaming", employees: 70, stage: "Series A",
    ukEntity: true, gbpShare: 0.55, entities: 1, incumbent: "Revolut Business", accounting: "Xero", monthlySpendGBP: 35000, aiNative: false,
    signals: [
      { type: "funding_round", daysAgo: 110, note: "Raised a Series A" },
    ],
  },
  {
    id: "A17", name: "Meridian Clinics", city: "Glasgow", sector: "Healthcare", employees: 350, stage: "PE-backed",
    ukEntity: true, gbpShare: 0.99, entities: 6, incumbent: "Amex + reimbursements", accounting: "Sage Intacct", monthlySpendGBP: 160000, aiNative: false,
    signals: [
      { type: "new_entity", daysAgo: 12, note: "Bought two more clinics, each its own company" },
      { type: "job_post_close_pain", daysAgo: 20, note: "Group accountant ad: 'consolidating six entities in spreadsheets'" },
    ],
  },
  {
    id: "A18", name: "Cinderpath Media", city: "London", sector: "Media", employees: 45, stage: "Seed",
    ukEntity: true, gbpShare: 0.93, entities: 1, incumbent: "Pleo", accounting: "Xero", monthlySpendGBP: 18000, aiNative: false,
    signals: [
      { type: "accountant_referral", daysAgo: 14, note: "Accountant (synthetic firm: Beacon Ledger) flagged Pleo seat costs" },
    ],
  },
  {
    id: "A19", name: "Vantage Freight EU", city: "Rotterdam (UK branch in Hull)", sector: "Logistics", employees: 400, stage: "PE-backed",
    ukEntity: false, gbpShare: 0.2, entities: 3, incumbent: "Payhawk", accounting: "NetSuite", monthlySpendGBP: 260000, aiNative: false,
    signals: [
      { type: "finance_leader_hired", daysAgo: 10, note: "New group CFO" },
    ],
  },
  {
    id: "A20", name: "Thistle Bio", city: "Oxford", sector: "Biotech", employees: 110, stage: "Series B",
    ukEntity: true, gbpShare: 0.6, entities: 2, incumbent: "Amex + reimbursements", accounting: "QuickBooks", monthlySpendGBP: 95000, aiNative: false,
    signals: [
      { type: "funding_round", daysAgo: 8, note: "Closed a Series B" },
      { type: "hiring_finance", daysAgo: 5, note: "Hiring a Head of Finance" },
    ],
  },
  {
    id: "A21", name: "Greyline Architects", city: "London", sector: "Architecture", employees: 55, stage: "Partnership",
    ukEntity: true, gbpShare: 0.98, entities: 1, incumbent: "Spreadsheets", accounting: "Xero", monthlySpendGBP: 16000, aiNative: false,
    signals: [],
  },
  {
    id: "A22", name: "Lumen Payroll", city: "Belfast", sector: "HR tech", employees: 150, stage: "Series B",
    ukEntity: true, gbpShare: 0.87, entities: 2, incumbent: "Soldo", accounting: "Xero", monthlySpendGBP: 70000, aiNative: false,
    signals: [
      { type: "incumbent_renewal", inDays: 20, note: "Soldo renewal in three weeks with a 60-day notice clause" },
      { type: "pricing_page_visit", daysAgo: 4, note: "Read the Ramp UK accounting-integration page" },
    ],
  },
  {
    id: "A23", name: "Oakhaven Hotels", city: "York", sector: "Hospitality", employees: 700, stage: "Family-owned",
    ukEntity: true, gbpShare: 0.97, entities: 8, incumbent: "Purchase cards (bank)", accounting: "Business Central", monthlySpendGBP: 210000, aiNative: false,
    signals: [
      { type: "finance_leader_hired", daysAgo: 140, note: "Finance Director joined earlier this year" },
    ],
  },
  {
    id: "A24", name: "Sparrowhawk Labs", city: "London", sector: "AI applications", employees: 32, stage: "Seed",
    ukEntity: true, gbpShare: 0.5, entities: 2, incumbent: "Revolut Business", accounting: "Xero", monthlySpendGBP: 42000, aiNative: true,
    signals: [
      { type: "us_ramp_alumni", kind: "entity", note: "Founders ran their earlier US entity on Ramp" },
      { type: "ai_spend_growth", daysAgo: 6, note: "Token spend now larger than payroll for contractors" },
    ],
  },
  {
    id: "A25", name: "Riverside Care Group", city: "Nottingham", sector: "Social care", employees: 1400, stage: "PE-backed",
    ukEntity: true, gbpShare: 1, entities: 12, incumbent: "Purchase cards (bank)", accounting: "Other ERP", monthlySpendGBP: 380000, aiNative: false,
    signals: [
      { type: "hiring_finance", daysAgo: 60, note: "Hiring a Purchase-to-Pay lead" },
    ],
  },
  {
    id: "A26", name: "Bramble Pet Co", city: "Bath", sector: "DTC retail", employees: 28, stage: "Seed",
    ukEntity: true, gbpShare: 0.95, entities: 1, incumbent: "Spreadsheets", accounting: "QuickBooks", monthlySpendGBP: 11000, aiNative: false,
    signals: [
      { type: "funding_round", daysAgo: 40, note: "Raised a seed round" },
    ],
  },
  {
    id: "A27", name: "Stirling Grid", city: "Stirling", sector: "Climate tech", employees: 190, stage: "Series B",
    ukEntity: true, gbpShare: 0.85, entities: 2, incumbent: "Pleo", accounting: "NetSuite", monthlySpendGBP: 120000, aiNative: false,
    signals: [
      { type: "finance_leader_hired", daysAgo: 35, note: "CFO hired ahead of a Series C" },
      { type: "headcount_growth", daysAgo: 20, note: "Doubling field engineering team" },
    ],
  },
  {
    id: "A28", name: "Keel & Compass", city: "Southampton", sector: "Marine services", employees: 80, stage: "Family-owned",
    ukEntity: true, gbpShare: 0.9, entities: 1, incumbent: "Amex + reimbursements", accounting: "Sage 50", monthlySpendGBP: 30000, aiNative: false,
    signals: [],
  },
  {
    id: "A29", name: "Parallax Fintech", city: "London", sector: "Fintech", employees: 115, stage: "Series A",
    ukEntity: true, gbpShare: 0.8, entities: 2, incumbent: "Spendesk", accounting: "Xero", monthlySpendGBP: 65000, aiNative: true,
    signals: [
      { type: "incumbent_renewal", inDays: 60, note: "Spendesk renewal in late November" },
      { type: "ai_spend_growth", daysAgo: 25, note: "Moved support to an LLM agent" },
    ],
  },
  {
    id: "A30", name: "Heathcote Engineering", city: "Sheffield", sector: "Manufacturing", employees: 520, stage: "Family-owned",
    ukEntity: true, gbpShare: 0.78, entities: 2, incumbent: "Purchase cards (bank)", accounting: "Other ERP", monthlySpendGBP: 200000, aiNative: false,
    signals: [
      { type: "job_post_close_pain", daysAgo: 50, note: "Ad for a Systems Accountant to 'replace paper expense forms'" },
    ],
  },
];

export const SIGNAL_TYPES = {
  us_ramp_alumni: { label: "Ramp in the US already", weight: 45, decays: false },
  finance_leader_hired: { label: "New finance leader", weight: 38, decays: true },
  funding_round: { label: "Recent funding round", weight: 30, decays: true },
  incumbent_renewal: { label: "Incumbent renewal window", weight: 34, decays: false },
  accountant_referral: { label: "Accountant referral", weight: 32, decays: true },
  pricing_page_visit: { label: "High-intent web visit", weight: 26, decays: true, fast: true },
  ai_spend_growth: { label: "AI spend growing", weight: 22, decays: true },
  job_post_close_pain: { label: "Close pain in job ad", weight: 20, decays: true },
  hiring_finance: { label: "Hiring in finance", weight: 16, decays: true },
  new_entity: { label: "New entity / acquisition", weight: 18, decays: true },
  headcount_growth: { label: "Headcount growth", weight: 14, decays: true },
};
