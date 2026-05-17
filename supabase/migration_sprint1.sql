-- CRM Qualiopi Color Aim — Migration Sprint 1
-- Coller dans Supabase SQL Editor → Run

create table if not exists public.formateurs (
  id             uuid primary key default gen_random_uuid(),
  prenom         text not null,
  nom            text not null,
  email          text not null unique,
  telephone      text,
  specialite     text,
  bio            text,
  diplomes       text,
  experience_ans integer default 0,
  cv_url         text,
  photo_url      text,
  siret          text,
  statut         text not null default 'actif' check (statut in ('actif','inactif')),
  created_at     timestamptz default now()
);

alter table public.formations
  add column if not exists formateur_id uuid references public.formateurs(id),
  add column if not exists type         text default 'formation',
  add column if not exists categorie    text default 'Arts graphiques',
  add column if not exists prix_ttc     numeric(10,2),
  add column if not exists objectifs_pedagogiques  text,
  add column if not exists programme    text,
  add column if not exists public_cible text,
  add column if not exists prerequis    text,
  add column if not exists methodes_pedagogiques   text,
  add column if not exists moyens_evaluation       text,
  add column if not exists accessibilite_handicap  text default 'Locaux accessibles PMR.',
  add column if not exists delai_acces  text default '7 jours ouvrés',
  add column if not exists statut       text default 'active';

create table if not exists public.emails (
  id           uuid primary key default gen_random_uuid(),
  candidat_id  uuid references public.candidats(id) on delete set null,
  formation_id uuid references public.formations(id) on delete set null,
  destinataire text not null,
  sujet        text not null,
  template     text not null default 'custom',
  statut       text not null default 'envoyé',
  sent_at      timestamptz default now(),
  delivered_at timestamptz,
  opened_at    timestamptz,
  clicked_at   timestamptz
);

create table if not exists public.documents (
  id                   uuid primary key default gen_random_uuid(),
  candidat_id          uuid references public.candidats(id) on delete cascade,
  inscription_id       uuid references public.inscriptions(id) on delete set null,
  type                 text not null,
  nom                  text not null,
  statut               text not null default 'non envoyé',
  lien_signature       text,
  docusign_envelope_id text,
  fichier_url          text,
  sent_at              timestamptz,
  signed_at            timestamptz,
  created_at           timestamptz default now()
);

alter table public.formateurs enable row level security;
alter table public.emails     enable row level security;
alter table public.documents  enable row level security;

create policy if not exists "read formateurs" on public.formateurs for select to authenticated using (true);
create policy if not exists "insert formateurs" on public.formateurs for insert to authenticated with check (true);
create policy if not exists "update formateurs" on public.formateurs for update to authenticated using (true);
create policy if not exists "read emails" on public.emails for select to authenticated using (true);
create policy if not exists "insert emails" on public.emails for insert to authenticated with check (true);
create policy if not exists "update emails" on public.emails for update to authenticated using (true);
create policy if not exists "read documents" on public.documents for select to authenticated using (true);
create policy if not exists "insert documents" on public.documents for insert to authenticated with check (true);
create policy if not exists "update documents" on public.documents for update to authenticated using (true);

insert into public.formateurs (prenom, nom, email, telephone, specialite, bio, experience_ans, statut)
values ('Maud','Batellier','maud@coloraim.fr','06 12 34 56 78','Colorimétrie, ICC, certification Qualiopi',
  'Experte en arts graphiques depuis 2006. Ancienne membre CT130 AFNOR. Formatrice certifiée Qualiopi.',20,'actif')
on conflict (email) do nothing;

create index if not exists emails_candidat_idx  on public.emails(candidat_id);
create index if not exists emails_sent_at_idx   on public.emails(sent_at desc);
create index if not exists docs_candidat_idx    on public.documents(candidat_id);

select 'formateurs' as tbl, count(*) from public.formateurs
union all select 'emails', count(*) from public.emails
union all select 'documents', count(*) from public.documents;
