-- ============================================================
-- FIX: Permitir lectura y escritura con la llave anonima (anon)
-- ============================================================
-- Esta app NO tiene login: usa la llave anonima (VITE_SUPABASE_ANON_KEY)
-- para TODAS las operaciones. Si las tablas tienen RLS (Row Level Security)
-- activado sin politicas, Supabase BLOQUEA las escrituras en silencio:
-- puedes LEER datos pero al GUARDAR no pasa nada.
--
-- COMO USAR:
--   1. Entra a tu proyecto en https://supabase.com
--   2. Menu izquierdo -> SQL Editor -> New query
--   3. Pega TODO este archivo y presiona "Run"
--   4. Recarga la app y vuelve a probar Guardar
-- ============================================================

-- Opcion A (recomendada para esta app sin login):
-- Politicas permisivas que dejan a anon y authenticated hacer TODO.

-- Asegura que RLS este activo (para que las politicas apliquen)
alter table settings      enable row level security;
alter table team_members  enable row level security;
alter table contacts      enable row level security;
alter table messages      enable row level security;

-- settings
drop policy if exists "anon full access settings" on settings;
create policy "anon full access settings" on settings
  for all to anon, authenticated
  using (true) with check (true);

-- team_members
drop policy if exists "anon full access team_members" on team_members;
create policy "anon full access team_members" on team_members
  for all to anon, authenticated
  using (true) with check (true);

-- contacts
drop policy if exists "anon full access contacts" on contacts;
create policy "anon full access contacts" on contacts
  for all to anon, authenticated
  using (true) with check (true);

-- messages
drop policy if exists "anon full access messages" on messages;
create policy "anon full access messages" on messages
  for all to anon, authenticated
  using (true) with check (true);

-- ============================================================
-- Opcion B (alternativa mas simple): desactivar RLS por completo.
-- Si la Opcion A no funciona, comenta la Opcion A de arriba,
-- descomenta estas 4 lineas y vuelve a correr el script.
-- ============================================================
-- alter table settings     disable row level security;
-- alter table team_members disable row level security;
-- alter table contacts     disable row level security;
-- alter table messages     disable row level security;
