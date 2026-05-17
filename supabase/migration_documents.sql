
-- Migration Documents & Import CSV
alter table public.candidats
  add column if not exists statut text default 'prospect' check (statut in ('prospect','inscrit','alumni','inactif')),
  add column if not exists notes  text,
  add column if not exists metier text;

alter table public.documents
  add column if not exists formation_id uuid references public.formations(id) on delete set null,
  add column if not exists candidat_id  uuid references public.candidats(id) on delete cascade,
  add column if not exists storage_path text,
  add column if not exists genere       boolean default false,
  add column if not exists envoye       boolean default false,
  add column if not exists envoye_at    timestamptz;

create table if not exists public.imports_csv (
  id          uuid primary key default gen_random_uuid(),
  nom_fichier text,
  nb_lignes   integer,
  nb_importes integer,
  nb_erreurs  integer,
  created_at  timestamptz default now()
);

alter table public.imports_csv enable row level security;
create policy "read imports" on public.imports_csv for select to authenticated using (true);
create policy "insert imports" on public.imports_csv for insert to authenticated with check (true);

select 'candidats' as tbl, count(*) from public.candidats
union all select 'documents', count(*) from public.documents;
