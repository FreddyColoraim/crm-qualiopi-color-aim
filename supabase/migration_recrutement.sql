
-- Migration Module Recrutement
create table if not exists public.prospects (
  id            uuid primary key default gen_random_uuid(),
  prenom        text,
  nom           text not null,
  email         text not null unique,
  telephone     text,
  entreprise    text,
  metier        text, -- graphiste, photographe, imprimeur, illustrateur, agence, artiste, autre
  source        text default 'manuel', -- site_web, instagram, linkedin, facebook, partenaire, manuel, csv
  statut        text default 'nouveau' check (statut in ('nouveau','contacté','inscrit','abandonné')),
  notes         text,
  formation_interesse text,
  created_at    timestamptz default now(),
  converted_at  timestamptz,
  candidat_id   uuid references public.candidats(id) on delete set null
);

create table if not exists public.campagnes (
  id            uuid primary key default gen_random_uuid(),
  nom           text not null,
  type          text default 'email' check (type in ('email','social')),
  canal         text, -- brevo, instagram, linkedin, facebook
  statut        text default 'brouillon' check (statut in ('brouillon','planifiée','envoyée','terminée')),
  sujet         text,
  contenu       text,
  cible_metier  text[], -- filtres métiers ciblés
  cible_source  text[], -- filtres sources
  formation_id  uuid references public.formations(id) on delete set null,
  brevo_campaign_id text,
  nb_destinataires  integer default 0,
  nb_ouvertures     integer default 0,
  nb_clics          integer default 0,
  nb_conversions    integer default 0,
  scheduled_at  timestamptz,
  sent_at       timestamptz,
  created_at    timestamptz default now()
);

create table if not exists public.questionnaires_satisfaction (
  id            uuid primary key default gen_random_uuid(),
  candidat_id   uuid references public.candidats(id) on delete cascade,
  formation_id  uuid references public.formations(id) on delete set null,
  note_globale  integer check (note_globale between 1 and 10),
  note_contenu  integer check (note_contenu between 1 and 5),
  note_formateur integer check (note_formateur between 1 and 5),
  note_organisation integer check (note_organisation between 1 and 5),
  commentaire   text,
  recommande    boolean,
  brevo_sent_at timestamptz,
  repondu_at    timestamptz,
  created_at    timestamptz default now()
);

alter table public.prospects enable row level security;
alter table public.campagnes enable row level security;
alter table public.questionnaires_satisfaction enable row level security;

create policy "read prospects"   on public.prospects for select to authenticated using (true);
create policy "insert prospects" on public.prospects for insert to authenticated with check (true);
create policy "update prospects" on public.prospects for update to authenticated using (true);
create policy "delete prospects" on public.prospects for delete to authenticated using (true);
create policy "read campagnes"   on public.campagnes for select to authenticated using (true);
create policy "insert campagnes" on public.campagnes for insert to authenticated with check (true);
create policy "update campagnes" on public.campagnes for update to authenticated using (true);
create policy "read satisfaction" on public.questionnaires_satisfaction for select to authenticated using (true);
create policy "insert satisfaction" on public.questionnaires_satisfaction for insert to authenticated with check (true);
create policy "update satisfaction" on public.questionnaires_satisfaction for update to authenticated using (true);

create index if not exists prospects_statut_idx on public.prospects(statut);
create index if not exists prospects_source_idx on public.prospects(source);
create index if not exists campagnes_statut_idx on public.campagnes(statut);

-- Seed prospects démo
insert into public.prospects (prenom, nom, email, telephone, metier, source, statut, formation_interesse) values
  ('Sophie','Renard','sophie.renard@studio.fr','06 11 22 33 44','graphiste','instagram','nouveau','Colorimétrie ICC'),
  ('Marc','Guillot','m.guillot@agence.fr','06 22 33 44 55','agence','linkedin','contacté','Gestion projet Agile'),
  ('Julie','Moreau','julie.moreau@photo.fr',null,'photographe','site_web','nouveau','Photo mode'),
  ('Antoine','Petit','a.petit@imprim.fr','06 44 55 66 77','imprimeur','partenaire','inscrit','CMJN & impression'),
  ('Léa','Bernard','lea.bernard@free.fr',null,'illustrateur','facebook','abandonné','Colorimétrie ICC'),
  ('Thomas','Dumont','t.dumont@studio.fr','06 55 66 77 88','graphiste','instagram','contacté','Packshot')
on conflict (email) do nothing;

select 'prospects' as tbl, count(*) from public.prospects
union all select 'campagnes', count(*) from public.campagnes
union all select 'satisfaction', count(*) from public.questionnaires_satisfaction;
