-- Sistema de Orçamentos de Construção Civil

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  location_uf TEXT,
  location_city TEXT,
  bdi_percentage NUMERIC DEFAULT 25.00,
  margin_percentage NUMERIC DEFAULT 10.00,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_url TEXT,
  original_filename TEXT,
  extracted_text TEXT,
  extraction_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  section TEXT,
  application_location TEXT,
  generic_item TEXT NOT NULL,
  attributes_json JSONB DEFAULT '{}',
  restrictions_json JSONB DEFAULT '{}',
  source_excerpt TEXT,
  confidence_score NUMERIC DEFAULT 0.00,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_code TEXT UNIQUE,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  family TEXT NOT NULL,
  subfamily TEXT,
  technical_attributes_json JSONB DEFAULT '{}',
  application_rules_json JSONB DEFAULT '{}',
  equivalences_json JSONB DEFAULT '[]',
  approved_brands_json JSONB DEFAULT '[]',
  loss_coefficients_json JSONB DEFAULT '{}',
  fiscal_data_json JSONB DEFAULT '{}',
  logistics_json JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  location_uf TEXT,
  location_city TEXT,
  tax_benefits_json JSONB DEFAULT '{}',
  lead_time_days INTEGER DEFAULT 7,
  payment_terms TEXT,
  rating NUMERIC DEFAULT 0.0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  bdi_percentage NUMERIC DEFAULT 25.00,
  margin_percentage NUMERIC DEFAULT 10.00,
  sales_taxes_json JSONB DEFAULT '{}',
  freight_policy TEXT,
  payment_conditions TEXT,
  substitution_criteria_json JSONB DEFAULT '{}',
  warranty_requirements TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS requirement_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  match_confidence NUMERIC DEFAULT 0.00,
  match_reasons_json JSONB DEFAULT '[]',
  status TEXT DEFAULT 'suggested',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS technical_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_match_id UUID NOT NULL REFERENCES requirement_matches(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL,
  rule_applied TEXT,
  result TEXT NOT NULL,
  details_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  deadline TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id),
  requirement_id UUID REFERENCES requirements(id),
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  specifications_json JSONB DEFAULT '{}',
  delivery_location TEXT,
  delivery_window TEXT
);

CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_item_id UUID NOT NULL REFERENCES rfq_items(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  unit_price NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  taxes_json JSONB DEFAULT '{}',
  freight_value NUMERIC DEFAULT 0.00,
  freight_type TEXT,
  insurance_value NUMERIC DEFAULT 0.00,
  total_landed_cost NUMERIC,
  lead_time_days INTEGER,
  validity_date DATE,
  ncm TEXT,
  cst_csosn TEXT,
  notes TEXT,
  selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES requirements(id),
  material_id UUID REFERENCES materials(id),
  quotation_id UUID REFERENCES quotations(id),
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  margin_applied NUMERIC,
  final_price NUMERIC NOT NULL,
  justification TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS technical_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family TEXT NOT NULL,
  attribute TEXT NOT NULL,
  operator TEXT NOT NULL,
  required_value JSONB NOT NULL,
  error_message TEXT NOT NULL,
  severity TEXT DEFAULT 'error',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS material_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  default_rules_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
