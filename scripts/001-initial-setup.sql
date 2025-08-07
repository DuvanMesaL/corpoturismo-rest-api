-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insertar roles iniciales
INSERT INTO "roles" (id, nombre, descripcion, permisos, "createdAt", "updatedAt") VALUES
('role_super_admin', 'super_admin', 'Super Administrador con acceso total', 
 ARRAY['*'], NOW(), NOW()),
('role_admin', 'admin', 'Administrador con permisos de gestión', 
 ARRAY['usuarios:crear', 'usuarios:editar', 'usuarios:ver', 'turnos:*', 'recaladas:*', 'buques:*'], NOW(), NOW()),
('role_supervisor', 'supervisor', 'Supervisor de operaciones', 
 ARRAY['turnos:tomar', 'turnos:usar', 'turnos:liberar', 'turnos:terminar', 'recaladas:ver', 'buques:ver'], NOW(), NOW()),
('role_guia', 'guia', 'Guía turístico', 
 ARRAY['turnos:tomar', 'turnos:usar', 'turnos:liberar', 'turnos:terminar', 'recaladas:ver', 'buques:ver'], NOW(), NOW());

-- Crear usuario super admin inicial
INSERT INTO "usuarios" (
  id, uuid, email, password, 
  "primerNombre", "primerApellido", 
  "rolId", estado, "fechaInvitacion", "fechaActivacion",
  "esTemporal", "createdAt", "updatedAt"
) VALUES (
  'user_super_admin',
  uuid_generate_v4(),
  'admin@corpoturismo.com',
  '$2a$12$ing5GU1gLwkxDHFW7Rk/WOigE1Rp4pcA2xmN1hwkVjYiIn84aA2/C',
  'Super',
  'Admin',
  'role_super_admin',
  'ACTIVO',
  NOW(),
  NOW(),
  false,
  NOW(),
  NOW()
);

-- Insertar tipos de atención básicos
INSERT INTO "tipos_atencion" (id, nombre, descripcion, duracion, "createdAt", "updatedAt") VALUES
('tipo_recepcion', 'Recepción de Buque', 'Atención inicial al arribo del buque', 60, NOW(), NOW()),
('tipo_tour', 'Tour Turístico', 'Guía turística para pasajeros', 180, NOW(), NOW()),
('tipo_logistica', 'Apoyo Logístico', 'Coordinación de servicios portuarios', 120, NOW(), NOW()),
('tipo_despedida', 'Despedida de Buque', 'Atención final antes de la partida', 45, NOW(), NOW());

-- Insertar puertos de ejemplo
INSERT INTO "puertos" (id, nombre, codigo, ciudad, pais, coordenadas, "createdAt", "updatedAt") VALUES
('puerto_cartagena', 'Puerto de Cartagena', 'CTG', 'Cartagena', 'Colombia', '{"lat": 10.3932, "lng": -75.4832}', NOW(), NOW()),
('puerto_santa_marta', 'Puerto de Santa Marta', 'SMR', 'Santa Marta', 'Colombia', '{"lat": 11.2408, "lng": -74.2110}', NOW(), NOW()),
('puerto_barranquilla', 'Puerto de Barranquilla', 'BAQ', 'Barranquilla', 'Colombia', '{"lat": 10.9639, "lng": -74.7964}', NOW(), NOW());
