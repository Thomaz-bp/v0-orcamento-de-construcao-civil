// Tipos principais do sistema de orçamentos

export type ProjectStatus = 'draft' | 'in_progress' | 'quoting' | 'budgeting' | 'completed' | 'cancelled'
export type RequirementStatus = 'pending' | 'matched' | 'approved' | 'rejected'
export type MatchStatus = 'suggested' | 'approved' | 'rejected' | 'manual'
export type RfqStatus = 'draft' | 'sent' | 'collecting' | 'closed'
export type CheckResult = 'pass' | 'fail' | 'warning'
export type Severity = 'error' | 'warning' | 'info'

export interface Project {
  id: string
  name: string
  description: string | null
  client_name: string | null
  location_uf: string | null
  location_city: string | null
  bdi_percentage: number
  margin_percentage: number
  status: ProjectStatus
  created_at: string
  updated_at: string
}

export interface Memorial {
  id: string
  project_id: string
  file_url: string | null
  original_filename: string | null
  extracted_text: string | null
  extraction_status: 'pending' | 'processing' | 'completed' | 'error'
  created_at: string
}

export interface Requirement {
  id: string
  memorial_id: string
  section: string | null
  application_location: string | null
  generic_item: string
  attributes_json: Record<string, unknown>
  restrictions_json: Record<string, unknown>
  source_excerpt: string | null
  confidence_score: number
  status: RequirementStatus
  created_at: string
}

export interface Material {
  id: string
  internal_code: string | null
  description: string
  unit: string
  family: string
  subfamily: string | null
  technical_attributes_json: Record<string, unknown>
  application_rules_json: Record<string, unknown>
  equivalences_json: string[]
  approved_brands_json: string[]
  loss_coefficients_json: Record<string, number>
  fiscal_data_json: Record<string, unknown>
  logistics_json: Record<string, unknown>
  active: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  company_name: string
  cnpj: string | null
  contact_name: string | null
  email: string | null
  phone: string | null
  location_uf: string | null
  location_city: string | null
  tax_benefits_json: Record<string, unknown>
  lead_time_days: number
  payment_terms: string | null
  rating: number
  active: boolean
  created_at: string
}

export interface BusinessRules {
  id: string
  project_id: string | null
  bdi_percentage: number
  margin_percentage: number
  sales_taxes_json: Record<string, number>
  freight_policy: string | null
  payment_conditions: string | null
  substitution_criteria_json: Record<string, unknown>
  warranty_requirements: string | null
  created_at: string
}

export interface RequirementMatch {
  id: string
  requirement_id: string
  material_id: string
  match_confidence: number
  match_reasons_json: string[]
  status: MatchStatus
  approved_by: string | null
  approved_at: string | null
  created_at: string
  // Joins
  requirement?: Requirement
  material?: Material
}

export interface TechnicalCheck {
  id: string
  requirement_match_id: string
  check_type: string
  rule_applied: string | null
  result: CheckResult
  details_json: Record<string, unknown>
  created_at: string
}

export interface Rfq {
  id: string
  project_id: string
  title: string
  status: RfqStatus
  deadline: string | null
  notes: string | null
  created_at: string
  // Joins
  items?: RfqItem[]
}

export interface RfqItem {
  id: string
  rfq_id: string
  material_id: string | null
  requirement_id: string | null
  quantity: number
  unit: string
  specifications_json: Record<string, unknown>
  delivery_location: string | null
  delivery_window: string | null
  // Joins
  material?: Material
  requirement?: Requirement
  quotations?: Quotation[]
}

export interface Quotation {
  id: string
  rfq_item_id: string
  supplier_id: string
  unit_price: number
  quantity: number
  taxes_json: Record<string, number>
  freight_value: number
  freight_type: string | null
  insurance_value: number
  total_landed_cost: number | null
  lead_time_days: number | null
  validity_date: string | null
  ncm: string | null
  cst_csosn: string | null
  notes: string | null
  selected: boolean
  created_at: string
  // Joins
  supplier?: Supplier
}

export interface BudgetItem {
  id: string
  project_id: string
  requirement_id: string | null
  material_id: string | null
  quotation_id: string | null
  quantity: number
  unit_cost: number
  total_cost: number
  margin_applied: number | null
  final_price: number
  justification: string | null
  created_at: string
  // Joins
  requirement?: Requirement
  material?: Material
  quotation?: Quotation
}

export interface TechnicalRule {
  id: string
  family: string
  attribute: string
  operator: 'equals' | 'gte' | 'lte' | 'gt' | 'lt' | 'in' | 'contains'
  required_value: unknown
  error_message: string
  severity: Severity
  active: boolean
  created_at: string
}

export interface MaterialFamily {
  id: string
  name: string
  description: string | null
  icon: string | null
  default_rules_json: Record<string, unknown>
  created_at: string
}

// Tipos auxiliares para formulários
export type ProjectFormData = Omit<Project, 'id' | 'created_at' | 'updated_at'>
export type MaterialFormData = Omit<Material, 'id' | 'created_at' | 'updated_at'>
export type SupplierFormData = Omit<Supplier, 'id' | 'created_at'>

// Tipos para extração de memorial via IA
export interface ExtractedRequirement {
  section: string
  application_location: string
  generic_item: string
  attributes: Record<string, unknown>
  restrictions: Record<string, unknown>
  source_excerpt: string
  confidence: number
}

// Tipos para cálculo de custo posto-obra
export interface LandedCostCalculation {
  unit_price: number
  quantity: number
  subtotal: number
  icms: number
  ipi: number
  pis_cofins: number
  freight: number
  insurance: number
  total_landed: number
  unit_landed: number
}
