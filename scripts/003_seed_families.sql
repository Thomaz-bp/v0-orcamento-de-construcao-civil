-- =============================================
-- Sistema de Orçamentos de Construção Civil
-- Migration 003: Seed de Famílias de Materiais
-- =============================================

INSERT INTO material_families (name, description, icon) VALUES
  ('Estrutural', 'Materiais estruturais: concreto, aço, formas', 'building'),
  ('Alvenaria', 'Blocos, tijolos, argamassas de assentamento', 'brick'),
  ('Revestimentos', 'Pisos, azulejos, porcelanatos, argamassas', 'palette'),
  ('Hidráulica', 'Tubos, conexões, registros, louças, metais', 'droplet'),
  ('Elétrica', 'Cabos, disjuntores, tomadas, luminárias', 'zap'),
  ('Esquadrias', 'Portas, janelas, vidros, ferragens', 'door-open'),
  ('Pintura', 'Tintas, vernizes, solventes, massas', 'paint-bucket'),
  ('Impermeabilização', 'Mantas, emulsões, argamassas impermeabilizantes', 'shield'),
  ('Cobertura', 'Telhas, estruturas metálicas, calhas', 'home'),
  ('Isolamento', 'Térmico, acústico, EPS, lã de vidro', 'thermometer')
ON CONFLICT (name) DO NOTHING;
