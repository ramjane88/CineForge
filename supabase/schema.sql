-- CineForge schema. Run once in the Supabase SQL editor.

create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role text not null default '',
  bio text not null default '',
  skills text not null default '',
  reels jsonb not null default '[]'::jsonb,
  updated bigint not null default 0
);

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  by_name text not null default 'Member',
  title text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  by_name text not null default 'Anonymous',
  week text not null,
  title text not null,
  url text not null default '',
  logline text not null default '',
  tools text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists entries_week_idx on public.entries (week);

create table if not exists public.votes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  picks jsonb not null default '{}'::jsonb,
  wins jsonb not null default '{}'::jsonb
);

alter table public.user_state enable row level security;
alter table public.profiles enable row level security;
alter table public.prompts enable row level security;
alter table public.entries enable row level security;
alter table public.votes enable row level security;

-- Private per member.
create policy "own state" on public.user_state for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public to read, owner to write.
create policy "read profiles" on public.profiles for select using (true);
create policy "write own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "read prompts" on public.prompts for select using (true);
create policy "add own prompt" on public.prompts for insert with check (auth.uid() = user_id);
create policy "remove own prompt" on public.prompts for delete using (auth.uid() = user_id);

create policy "read entries" on public.entries for select using (true);
create policy "add own entry" on public.entries for insert with check (auth.uid() = user_id);
create policy "remove own entry" on public.entries for delete using (auth.uid() = user_id);

create policy "read votes" on public.votes for select using (true);
create policy "add own votes" on public.votes for insert with check (auth.uid() = user_id);
create policy "update own votes" on public.votes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
