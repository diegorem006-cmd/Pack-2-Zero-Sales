-- Pack 2 Zero Ventas — Database Schema
-- Run against a fresh Supabase project (RLS disabled for v1)

-- ============================================================
-- Settings
-- ============================================================
create table if not exists settings (
  id              uuid        primary key default gen_random_uuid(),
  app_name        text        not null default 'Pack 2 Zero Ventas',
  company_description text    not null default '',
  logo_url        text,
  primary_color   text        not null default '#16a34a',
  accent_color    text        not null default '#0ea5e9',
  sender_email    text        not null,
  sender_name     text        not null,
  resend_api_key  text,
  llm_api_key     text,
  llm_provider    text        not null default 'openai'
                              check (llm_provider in ('openai', 'anthropic')),
  access_password_hash text   not null,
  column_mapping  jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-update updated_at on settings
create or replace function update_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_settings_updated_at
  before update on settings
  for each row
  execute function update_settings_updated_at();

-- ============================================================
-- Team members
-- ============================================================
create table if not exists team_members (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  email       text        not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Contacts
-- ============================================================
create table if not exists contacts (
  id              uuid        primary key default gen_random_uuid(),
  first_name      text        not null,
  last_name       text,
  company_name    text,
  email           text        not null,
  website         text,
  country         text,
  state           text,
  type            text        not null
                              check (type in ('Productor', 'Distribuidor', 'Marca nueva', 'Consumidor', 'Otro')),
  priority        text        not null
                              check (priority in ('Alta', 'Media', 'Baja')),
  source          text,
  submission_date timestamptz,
  status          text        not null default 'Nuevo'
                              check (status in ('Nuevo', 'Pendiente', 'Contestado')),
  assigned_to     uuid        references team_members(id) on delete set null,
  extra           jsonb,
  created_at      timestamptz not null default now()
);

create index idx_contacts_email_submission on contacts (email, submission_date);
create index idx_contacts_status_priority  on contacts (status, priority);

-- ============================================================
-- Messages
-- ============================================================
create table if not exists messages (
  id          uuid        primary key default gen_random_uuid(),
  contact_id  uuid        not null references contacts(id) on delete cascade,
  direction   text        not null
                          check (direction in ('recibido', 'enviado')),
  subject     text,
  body        text        not null,
  sent_by     uuid        references team_members(id) on delete set null,
  channel     text        not null default 'email'
                          check (channel in ('email', 'nota')),
  created_at  timestamptz not null default now()
);

create index idx_messages_contact_created on messages (contact_id, created_at);
