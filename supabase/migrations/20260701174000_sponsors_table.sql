-- Reconstructed from live schema (Supabase MCP) — original file was never committed.
-- Live and used: netlify/functions/sponsors.js, wired at /api/sponsors(/*) in netlify.toml.

create table if not exists public.sponsors (
  id integer generated always as identity primary key,
  name varchar not null,
  logo_url text not null,
  website_url text,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sponsors enable row level security;

drop policy if exists "Anyone can read active sponsors" on public.sponsors;
create policy "Anyone can read active sponsors" on public.sponsors
  for select using (is_active = true);
