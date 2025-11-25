-- Esegui questo SQL nell'editor SQL di Supabase

create table tutorials (
  id uuid default gen_random_uuid() primary key,
  topic text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table steps (
  id uuid default gen_random_uuid() primary key,
  tutorial_id uuid references tutorials(id) on delete cascade,
  title text,
  content text,
  command text,
  step_order integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table messages (
  id uuid default gen_random_uuid() primary key,
  step_id uuid references steps(id) on delete cascade,
  role text check (role in ('user', 'assistant')),
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Abilita RLS (Row Level Security) se necessario, ma per ora lasciamo aperto visto che è per uso personale
alter table tutorials enable row level security;
alter table steps enable row level security;
alter table messages enable row level security;

-- Policy per permettere tutto a tutti (ATTENZIONE: Solo per uso personale/sviluppo locale senza auth)
create policy "Allow all access" on tutorials for all using (true) with check (true);
create policy "Allow all access" on steps for all using (true) with check (true);
create policy "Allow all access" on messages for all using (true) with check (true);
