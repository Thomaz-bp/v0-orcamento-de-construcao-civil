-- =============================================
-- Sistema de Orçamentos de Construção Civil
-- Migration 002: Índices para performance
-- =============================================

-- Índices para projects
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Índices para memorials
CREATE INDEX IF NOT EXISTS idx_memorials_project_id ON memorials(project_id);
CREATE INDEX IF NOT EXISTS idx_memorials_status ON memorials(extraction_status);

-- Índices para requirements
CREATE INDEX IF NOT EXISTS idx_requirements_memorial_id ON requirements(memorial_id);
CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements(status);
CREATE INDEX IF NOT EXISTS idx_requirements_section ON requirements(section);

-- Índices para materials
CREATE INDEX IF NOT EXISTS idx_materials_family ON materials(family);
CREATE INDEX IF NOT EXISTS idx_materials_subfamily ON materials(subfamily);
CREATE INDEX IF NOT EXISTS idx_materials_internal_code ON materials(internal_code);
CREATE INDEX IF NOT EXISTS idx_materials_description_gin ON materials USING gin(to_tsvector('portuguese', description));
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(active);

-- Índices para suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_location ON suppliers(location_uf, location_city);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active);
CREATE INDEX IF NOT EXISTS idx_suppliers_cnpj ON suppliers(cnpj);

-- Índices para requirement_matches
CREATE INDEX IF NOT EXISTS idx_req_matches_requirement ON requirement_matches(requirement_id);
CREATE INDEX IF NOT EXISTS idx_req_matches_material ON requirement_matches(material_id);
CREATE INDEX IF NOT EXISTS idx_req_matches_status ON requirement_matches(status);

-- Índices para technical_checks
CREATE INDEX IF NOT EXISTS idx_tech_checks_match ON technical_checks(requirement_match_id);
CREATE INDEX IF NOT EXISTS idx_tech_checks_result ON technical_checks(result);

-- Índices para rfqs
CREATE INDEX IF NOT EXISTS idx_rfqs_project ON rfqs(project_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);

-- Índices para rfq_items
CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq ON rfq_items(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_items_material ON rfq_items(material_id);

-- Índices para quotations
CREATE INDEX IF NOT EXISTS idx_quotations_rfq_item ON quotations(rfq_item_id);
CREATE INDEX IF NOT EXISTS idx_quotations_supplier ON quotations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_quotations_selected ON quotations(selected);

-- Índices para budget_items
CREATE INDEX IF NOT EXISTS idx_budget_items_project ON budget_items(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_material ON budget_items(material_id);

-- Índices para technical_rules
CREATE INDEX IF NOT EXISTS idx_tech_rules_family ON technical_rules(family);
CREATE INDEX IF NOT EXISTS idx_tech_rules_active ON technical_rules(active);

-- Índices para material_families
CREATE INDEX IF NOT EXISTS idx_material_families_name ON material_families(name);
