-- Pack 2 Zero Ventas — Seed Data
-- Deterministic UUIDs for referencing across inserts

-- ============================================================
-- Settings
-- ============================================================
insert into settings (
  id, app_name, company_description, primary_color, accent_color,
  sender_email, sender_name, access_password_hash
) values (
  '00000000-0000-0000-0000-000000000001',
  'Pack 2 Zero Ventas',
  'E6PR / Pack 2 Cero fabrica anillos y carriers compostables de fibra vegetal para latas (formatos 4, 6, 8 y slim/sleek), además de aplicadores: prensa manual, semiautomático e inline.',
  '#16a34a',
  '#0ea5e9',
  'ventas@pack2cero.com',
  'Pack 2 Cero Ventas',
  'demo123'
);

-- ============================================================
-- Team members
-- ============================================================
insert into team_members (id, name, email) values
  ('a0000000-0000-0000-0000-000000000001', 'Diego Romero',  'diego@e6pr.com'),
  ('a0000000-0000-0000-0000-000000000002', 'Maria Lopez',   'maria@e6pr.com'),
  ('a0000000-0000-0000-0000-000000000003', 'Carlos Ruiz',   'carlos@e6pr.com');

-- ============================================================
-- Contacts
-- ============================================================
insert into contacts (id, first_name, last_name, company_name, email, website, country, state, type, priority, source, submission_date, status, assigned_to) values
  (
    'c0000000-0000-0000-0000-000000000001',
    'Alejandro', 'Gutierrez', 'Cerveceria Artesanal del Valle', 'alejandro@cerveceriadelvalle.mx',
    'https://cerveceriadelvalle.mx', 'Mexico', 'Jalisco',
    'Productor', 'Alta', 'Expo Cerveza 2026', '2026-06-10 14:30:00+00',
    'Contestado', 'a0000000-0000-0000-0000-000000000001'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'Laura', 'Chen', 'Pacific Beverage Distributors', 'laura.chen@pacbev.com',
    'https://pacbev.com', 'United States', 'California',
    'Distribuidor', 'Alta', 'LinkedIn', '2026-06-15 09:00:00+00',
    'Pendiente', 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'Rodrigo', 'Fernandez', 'Kombucha Tropical', 'rodrigo@kombuchatropical.co',
    'https://kombuchatropical.co', 'Colombia', 'Antioquia',
    'Marca nueva', 'Media', 'Instagram', '2026-06-18 11:20:00+00',
    'Nuevo', null
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'Mariana', 'Santos', null, 'mariana.santos@gmail.com',
    null, 'Mexico', 'CDMX',
    'Consumidor', 'Baja', 'Sitio web', '2026-06-20 16:45:00+00',
    'Contestado', 'a0000000-0000-0000-0000-000000000003'
  ),
  (
    'c0000000-0000-0000-0000-000000000005',
    'James', 'O''Brien', 'Hop & Harvest Brewing Co.', 'james@hopharvest.ca',
    'https://hopharvest.ca', 'Canada', 'Ontario',
    'Productor', 'Media', 'Referencia cliente', '2026-06-22 08:10:00+00',
    'Pendiente', 'a0000000-0000-0000-0000-000000000001'
  );

-- ============================================================
-- Messages
-- ============================================================
insert into messages (contact_id, direction, subject, body, sent_by, channel, created_at) values
  -- Thread: Alejandro (Cerveceria del Valle)
  (
    'c0000000-0000-0000-0000-000000000001', 'recibido',
    'Información sobre carriers para latas de 355ml',
    'Hola, nos conocimos en la Expo Cerveza. Producimos alrededor de 50,000 latas mensuales en formato 6-pack. Me gustaría recibir cotización de sus carriers compostables y saber los tiempos de entrega a Guadalajara.',
    null, 'email', '2026-06-10 14:30:00+00'
  ),
  (
    'c0000000-0000-0000-0000-000000000001', 'enviado',
    'Re: Información sobre carriers para latas de 355ml',
    'Hola Alejandro, gracias por tu interés. Para 50k unidades mensuales en formato 6-pack estándar (355ml), el precio unitario es de $0.12 USD. Tiempo de entrega: 3-4 semanas a Guadalajara. Te adjunto nuestra ficha técnica y catálogo completo. ¿Te gustaría agendar una llamada para revisar opciones de aplicador?',
    'a0000000-0000-0000-0000-000000000001', 'email', '2026-06-11 10:15:00+00'
  ),
  (
    'c0000000-0000-0000-0000-000000000001', 'recibido',
    'Re: Información sobre carriers para latas de 355ml',
    'Excelente precio. Sí, me interesa la prensa manual para empezar. ¿Podemos hablar el jueves a las 11am?',
    null, 'email', '2026-06-12 09:00:00+00'
  ),

  -- Thread: Laura Chen (Pacific Beverage)
  (
    'c0000000-0000-0000-0000-000000000002', 'recibido',
    'Distribution inquiry - West Coast',
    'Hi, I''m the purchasing manager at Pacific Beverage Distributors. We supply over 200 craft breweries in California and Oregon. Looking for an eco-friendly alternative to plastic rings. Can you send pricing for high-volume orders (500k+ units/month)?',
    null, 'email', '2026-06-15 09:00:00+00'
  ),
  (
    'c0000000-0000-0000-0000-000000000002', 'enviado',
    null,
    'Nota interna: Cliente potencial muy grande. Preparar propuesta especial con descuento por volumen y opciones de aplicador inline. Coordinar con logística para envíos a California.',
    'a0000000-0000-0000-0000-000000000002', 'nota', '2026-06-15 10:30:00+00'
  ),

  -- Thread: Rodrigo (Kombucha Tropical)
  (
    'c0000000-0000-0000-0000-000000000003', 'recibido',
    'Carriers para latas slim de kombucha',
    'Hola! Somos una marca nueva de kombucha en Medellín. Estamos por lanzar en latas slim de 250ml, packs de 4. Producción inicial sería de unas 5,000 unidades al mes. ¿Tienen formato para slim cans? ¿Hacen envíos a Colombia?',
    null, 'email', '2026-06-18 11:20:00+00'
  ),

  -- Thread: Mariana Santos (consumidor)
  (
    'c0000000-0000-0000-0000-000000000004', 'recibido',
    'Pregunta sobre material compostable',
    '¿De qué están hechos sus anillos? Me interesa saber si realmente se compostan y en cuánto tiempo. Compré unas cervezas que los usan y me pareció increíble.',
    null, 'email', '2026-06-20 16:45:00+00'
  ),
  (
    'c0000000-0000-0000-0000-000000000004', 'enviado',
    'Re: Pregunta sobre material compostable',
    'Hola Mariana, gracias por escribirnos. Nuestros anillos están hechos de fibra de cebada y trigo, residuos de la industria cervecera. Se compostan en un rango de 60-200 días dependiendo de las condiciones. Son 100% libres de plástico. ¡Nos alegra que te gusten!',
    'a0000000-0000-0000-0000-000000000003', 'email', '2026-06-21 09:30:00+00'
  );
