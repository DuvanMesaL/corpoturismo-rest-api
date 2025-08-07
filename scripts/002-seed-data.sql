-- Insertar buques de ejemplo
INSERT INTO "buques" (id, nombre, bandera, eslora, manga, calado, tonelaje, "tipoEmbarcacion", "createdAt", "updatedAt") VALUES
('buque_harmony', 'Harmony of the Seas', 'Bahamas', 362.12, 66.0, 9.3, 226963, 'Crucero', NOW(), NOW()),
('buque_symphony', 'Symphony of the Seas', 'Bahamas', 361.0, 65.0, 9.1, 228081, 'Crucero', NOW(), NOW()),
('buque_allure', 'Allure of the Seas', 'Bahamas', 360.0, 60.5, 9.1, 225282, 'Crucero', NOW(), NOW()),
('buque_oasis', 'Oasis of the Seas', 'Bahamas', 360.0, 60.5, 9.1, 225282, 'Crucero', NOW(), NOW()),
('buque_wonder', 'Wonder of the Seas', 'Bahamas', 362.0, 64.0, 9.3, 236857, 'Crucero', NOW(), NOW());

-- Insertar recaladas de ejemplo para hoy y próximos días
INSERT INTO "recaladas" (
  id, "buqueId", "puertoOrigenId", "puertoDestinoId", 
  "fechaLlegada", "fechaSalida", "numeroViaje", 
  observaciones, estado, "createdAt", "updatedAt"
) VALUES
(
  'recalada_harmony_001',
  'buque_harmony',
  'puerto_santa_marta',
  'puerto_cartagena',
  NOW() + INTERVAL '2 hours',
  NOW() + INTERVAL '8 hours',
  'HAR-2025-001',
  'Recalada programada con 3500 pasajeros',
  'PROGRAMADA',
  NOW(),
  NOW()
),
(
  'recalada_symphony_001',
  'buque_symphony',
  'puerto_barranquilla',
  'puerto_cartagena',
  NOW() + INTERVAL '4 hours',
  NOW() + INTERVAL '10 hours',
  'SYM-2025-001',
  'Recalada con 4200 pasajeros',
  'PROGRAMADA',
  NOW(),
  NOW()
),
(
  'recalada_wonder_001',
  'buque_wonder',
  'puerto_cartagena',
  'puerto_santa_marta',
  NOW() - INTERVAL '2 hours',
  NOW() + INTERVAL '6 hours',
  'WON-2025-001',
  'Recalada en puerto - 3800 pasajeros',
  'EN_PUERTO',
  NOW(),
  NOW()
);

-- Insertar turnos de ejemplo para las recaladas
INSERT INTO "turnos" (
  id, "recaladaId", "creadorId", "fechaInicio", "fechaFin", 
  estado, observaciones, "createdAt", "updatedAt"
) VALUES
(
  'turno_harmony_001',
  'recalada_harmony_001',
  'user_super_admin',
  NOW() + INTERVAL '1 hour',
  NOW() + INTERVAL '5 hours',
  'DISPONIBLE',
  'Turno de recepción y tour matutino',
  NOW(),
  NOW()
),
(
  'turno_harmony_002',
  'recalada_harmony_001',
  'user_super_admin',
  NOW() + INTERVAL '5 hours',
  NOW() + INTERVAL '9 hours',
  'DISPONIBLE',
  'Turno de despedida y logística',
  NOW(),
  NOW()
),
(
  'turno_symphony_001',
  'recalada_symphony_001',
  'user_super_admin',
  NOW() + INTERVAL '3 hours',
  NOW() + INTERVAL '7 hours',
  'DISPONIBLE',
  'Turno completo de atención',
  NOW(),
  NOW()
);
