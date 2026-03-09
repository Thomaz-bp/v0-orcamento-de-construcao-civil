-- =============================================
-- Sistema de Orçamentos de Construção Civil
-- Migration 004: Seed de Regras Técnicas
-- =============================================

-- Regras para família Elétrica
INSERT INTO technical_rules (family, attribute, operator, required_value, error_message, severity) VALUES
  ('Elétrica', 'tensao_nominal', 'min', '750', 'Tensão nominal deve ser no mínimo 750V para instalações prediais', 'error'),
  ('Elétrica', 'secao_mm2', 'min', '1.5', 'Seção mínima de 1,5mm² para circuitos de iluminação', 'warning'),
  ('Elétrica', 'norma', 'contains', '"NBR 5410"', 'Material deve atender à NBR 5410', 'error'),
  ('Elétrica', 'classe_isolacao', 'in_list', '["450/750V", "0,6/1kV"]', 'Classe de isolação deve ser 450/750V ou 0,6/1kV', 'error')
ON CONFLICT DO NOTHING;

-- Regras para família Hidráulica
INSERT INTO technical_rules (family, attribute, operator, required_value, error_message, severity) VALUES
  ('Hidráulica', 'classe_pressao', 'in_list', '["PN10", "PN16", "PN25"]', 'Classe de pressão deve ser especificada', 'warning'),
  ('Hidráulica', 'temperatura_max', 'min', '60', 'Tubulação de água quente deve suportar mínimo 60°C', 'error'),
  ('Hidráulica', 'norma', 'contains', '"NBR 5648"', 'Tubos PVC devem atender à NBR 5648', 'error'),
  ('Hidráulica', 'material', 'in_list', '["PVC", "CPVC", "PPR", "Cobre", "PEX"]', 'Material deve ser especificado corretamente', 'warning')
ON CONFLICT DO NOTHING;

-- Regras para família Estrutural
INSERT INTO technical_rules (family, attribute, operator, required_value, error_message, severity) VALUES
  ('Estrutural', 'fck', 'min', '20', 'Resistência mínima do concreto deve ser fck 20 MPa', 'error'),
  ('Estrutural', 'cobrimento_mm', 'min', '25', 'Cobrimento mínimo da armadura de 25mm para ambientes internos', 'warning'),
  ('Estrutural', 'aco_ca', 'in_list', '["CA-50", "CA-60"]', 'Categoria do aço deve ser CA-50 ou CA-60', 'error'),
  ('Estrutural', 'norma', 'contains', '"NBR 6118"', 'Projeto estrutural deve atender à NBR 6118', 'error')
ON CONFLICT DO NOTHING;

-- Regras para família Revestimentos
INSERT INTO technical_rules (family, attribute, operator, required_value, error_message, severity) VALUES
  ('Revestimentos', 'pei', 'min', '3', 'PEI mínimo 3 para áreas de tráfego moderado', 'warning'),
  ('Revestimentos', 'pei', 'min', '4', 'PEI mínimo 4 para áreas comerciais', 'error'),
  ('Revestimentos', 'classe_argamassa', 'in_list', '["AC-I", "AC-II", "AC-III"]', 'Classe da argamassa colante deve ser especificada', 'warning'),
  ('Revestimentos', 'absorcao_agua', 'max', '0.5', 'Porcelanato técnico deve ter absorção menor que 0,5%', 'info')
ON CONFLICT DO NOTHING;

-- Regras para família Impermeabilização
INSERT INTO technical_rules (family, attribute, operator, required_value, error_message, severity) VALUES
  ('Impermeabilização', 'espessura_mm', 'min', '3', 'Manta asfáltica deve ter espessura mínima de 3mm', 'error'),
  ('Impermeabilização', 'norma', 'contains', '"NBR 9575"', 'Sistema deve atender à NBR 9575', 'error'),
  ('Impermeabilização', 'estruturada', 'equals', 'true', 'Manta deve ser estruturada com armação', 'warning')
ON CONFLICT DO NOTHING;

-- Regras para família Pintura
INSERT INTO technical_rules (family, attribute, operator, required_value, error_message, severity) VALUES
  ('Pintura', 'acabamento', 'in_list', '["Fosco", "Acetinado", "Semi-brilho", "Brilhante"]', 'Acabamento deve ser especificado', 'info'),
  ('Pintura', 'rendimento_m2_litro', 'min', '8', 'Rendimento mínimo de 8m²/litro por demão', 'warning'),
  ('Pintura', 'demaos', 'min', '2', 'Aplicar mínimo de 2 demãos', 'warning')
ON CONFLICT DO NOTHING;
