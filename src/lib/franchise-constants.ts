// Franchise pricing — flat base + per-location fee (INR, monthly)
export const FRANCHISE_BASE_PRICE = 4999;       // ₹4,999/mo base
export const FRANCHISE_PER_LOCATION = 699;       // +₹699/mo per location

// Discount for GymSetu Pro subscribers
export const PRO_SUBSCRIBER_DISCOUNT = 0.15; // 15% off franchise base price

// Features included in the franchise plan
export const FRANCHISE_FEATURES = [
  'Unlimited franchise locations',
  'Invite link management',
  'Revenue tracking & reporting',
  'Royalty auto-invoicing',
  'SOP template library',
  'HQ dashboard with charts',
  'Location status management',
  'Franchisee onboarding flow',
] as const;

// Readiness checklist items
export const READINESS_ITEMS = [
  { key: 'brand_name',        label: 'Brand Name & Identity',    desc: 'You have a registered brand name and visual identity (logo, colors, guidelines).' },
  { key: 'business_model',    label: 'Business Model',           desc: 'Your franchise fee structure, revenue model, and pricing are clearly defined.' },
  { key: 'operations_manual', label: 'Operations Manual',        desc: 'You have a documented playbook covering daily operations, staffing, and member experience.' },
  { key: 'training_program',  label: 'Training Program',         desc: 'You can train new franchisees on your methods, systems, and brand standards.' },
  { key: 'legal_framework',   label: 'Legal Framework',          desc: 'You have franchise agreements, IP protection, and compliance documents ready.' },
  { key: 'financial_model',   label: 'Financial Model',          desc: 'You have a clear P&L template, break-even projections, and investment requirements.' },
  { key: 'brand_standards',   label: 'Brand Standards',          desc: 'Equipment specs, facility layout, member experience standards are documented.' },
  { key: 'support_system',    label: 'Support System',           desc: 'You have a plan for ongoing franchisee support — onboarding, troubleshooting, check-ins.' },
  { key: 'growth_strategy',   label: 'Growth Strategy',          desc: 'You have a territory plan and know where and how fast you want to expand.' },
] as const;

export type ReadinessKey = typeof READINESS_ITEMS[number]['key'];

// Territory models
export const TERRITORY_MODELS = [
  { value: 'exclusive',     label: 'Exclusive',     desc: 'One franchisee per territory — no overlap.' },
  { value: 'non_exclusive',  label: 'Non-Exclusive', desc: 'Multiple franchisees can operate in the same area.' },
  { value: 'shared',        label: 'Shared',        desc: 'Territory shared with company-owned locations.' },
] as const;

// Support levels
export const SUPPORT_LEVELS = [
  { value: 'basic',    label: 'Basic',    desc: 'Email support, quarterly check-ins.' },
  { value: 'standard', label: 'Standard', desc: 'Weekly calls, onboarding assistance, SOP reviews.' },
  { value: 'premium',  label: 'Premium',  desc: 'Dedicated account manager, on-site visits, priority resolution.' },
] as const;

// Location status colors
export const LOCATION_STATUS_COLORS: Record<string, string> = {
  pending:    'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  active:     'text-green-400 border-green-400/30 bg-green-400/10',
  suspended:  'text-red-400 border-red-400/30 bg-red-400/10',
  terminated: 'text-white/30 border-white/10 bg-white/5',
};

// Royalty status colors
export const ROYALTY_STATUS_COLORS: Record<string, string> = {
  pending:  'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  paid:     'text-green-400 border-green-400/30 bg-green-400/10',
  overdue:  'text-red-400 border-red-400/30 bg-red-400/10',
  waived:   'text-white/30 border-white/10 bg-white/5',
};
