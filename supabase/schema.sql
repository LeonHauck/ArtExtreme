-- ═══════════════════════════════════════════════════════════════════════
--  ArtExtreme · banco de dados (Supabase / Postgres)
--
--  Como usar: Supabase → SQL Editor → New query → cole este arquivo → Run.
--  Pode rodar de novo sem medo: tudo usa "if not exists" / "or replace".
--
--  Quem pode o quê (Row Level Security):
--    • Visitante (cliente): lê preços/estúdio/portfólio, CRIA pedido de horário
--      e consulta só os horários ocupados — nunca vê nome ou telefone de ninguém.
--    • Administrador (Mike): lê e altera tudo.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Administradores ────────────────────────────────────────────────────
-- Uma linha por conta que pode entrar no painel. Contas são criadas em
-- Authentication → Users; depois a gente "promove" com o insert do final.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

drop policy if exists "admin vê o próprio registro" on public.admins;
create policy "admin vê o próprio registro" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- Usado pelas regras abaixo. "security definer" para poder ler a tabela admins.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ─── Configurações do estúdio (linha única) ─────────────────────────────
-- Preços, dados do estúdio e horários em JSON, no mesmo formato do app.
create table if not exists public.studio_settings (
  id         int primary key default 1 check (id = 1),
  pricing    jsonb not null,
  studio     jsonb not null,
  schedule   jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.studio_settings enable row level security;

drop policy if exists "todos leem as configurações" on public.studio_settings;
create policy "todos leem as configurações" on public.studio_settings
  for select to anon, authenticated using (true);

drop policy if exists "admin cria as configurações" on public.studio_settings;
create policy "admin cria as configurações" on public.studio_settings
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin altera as configurações" on public.studio_settings;
create policy "admin altera as configurações" on public.studio_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── Agendamentos ───────────────────────────────────────────────────────
create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  status           text not null default 'pending'
                   check (status in ('pending', 'confirmed', 'done', 'cancelled')),
  client_name      text not null check (char_length(client_name) between 2 and 120),
  client_phone     text not null check (client_phone ~ '^[0-9]{10,13}$'),
  client_instagram text check (client_instagram is null or char_length(client_instagram) <= 60),
  tattoo           jsonb not null,          -- locais, estilo, cor, ideia
  estimate         jsonb not null,          -- faixa de valor calculada no app
  session_date     date not null,
  start_time       time not null,
  hours            numeric(4, 2) not null check (hours > 0 and hours <= 24),
  notes            text check (notes is null or char_length(notes) <= 1000)
);
create index if not exists bookings_session_date_idx on public.bookings (session_date);
alter table public.bookings enable row level security;

drop policy if exists "cliente cria pedido pendente" on public.bookings;
create policy "cliente cria pedido pendente" on public.bookings
  for insert to anon, authenticated
  with check (status = 'pending' and session_date > current_date);

drop policy if exists "admin vê os pedidos" on public.bookings;
create policy "admin vê os pedidos" on public.bookings
  for select to authenticated using (public.is_admin());

drop policy if exists "admin altera os pedidos" on public.bookings;
create policy "admin altera os pedidos" on public.bookings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin exclui os pedidos" on public.bookings;
create policy "admin exclui os pedidos" on public.bookings
  for delete to authenticated using (public.is_admin());

-- Trava contra dois pedidos ativos no mesmo horário (mesmo se dois clientes
-- clicarem ao mesmo tempo).
create or replace function public.bookings_no_overlap()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status in ('pending', 'confirmed') and exists (
    select 1 from public.bookings b
    where b.session_date = new.session_date
      and b.id <> new.id
      and b.status in ('pending', 'confirmed')
      and (new.start_time, new.start_time + make_interval(mins => (new.hours * 60)::int))
          overlaps (b.start_time, b.start_time + make_interval(mins => (b.hours * 60)::int))
  ) then
    raise exception 'Horário indisponível' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_no_overlap on public.bookings;
create trigger bookings_no_overlap
  before insert or update of session_date, start_time, hours, status on public.bookings
  for each row execute function public.bookings_no_overlap();

-- Horários ocupados para o calendário do cliente: só data, hora e duração.
create or replace function public.busy_slots(from_date date, to_date date)
returns table (session_date date, start_time time, hours numeric)
language sql stable security definer set search_path = public
as $$
  select b.session_date, b.start_time, b.hours
  from public.bookings b
  where b.status in ('pending', 'confirmed')
    and b.session_date between from_date and to_date;
$$;
grant execute on function public.busy_slots(date, date) to anon, authenticated;

-- ─── Portfólio ──────────────────────────────────────────────────────────
create table if not exists public.portfolio_items (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  title         text not null check (char_length(title) between 1 and 80),
  tag           text check (tag is null or char_length(tag) <= 40),
  image_path    text not null,             -- caminho no bucket "portfolio"
  instagram_url text,
  position      int not null default 0,
  active        boolean not null default true
);
alter table public.portfolio_items enable row level security;

drop policy if exists "todos veem os trabalhos ativos" on public.portfolio_items;
create policy "todos veem os trabalhos ativos" on public.portfolio_items
  for select to anon, authenticated using (active or public.is_admin());

drop policy if exists "admin gerencia o portfólio" on public.portfolio_items;
create policy "admin gerencia o portfólio" on public.portfolio_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Fotos: bucket público para leitura; só o admin envia, troca e apaga.
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

drop policy if exists "fotos do portfólio são públicas" on storage.objects;
create policy "fotos do portfólio são públicas" on storage.objects
  for select to anon, authenticated using (bucket_id = 'portfolio');

drop policy if exists "admin envia fotos" on storage.objects;
create policy "admin envia fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists "admin altera fotos" on storage.objects;
create policy "admin altera fotos" on storage.objects
  for update to authenticated using (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists "admin apaga fotos" on storage.objects;
create policy "admin apaga fotos" on storage.objects
  for delete to authenticated using (bucket_id = 'portfolio' and public.is_admin());

-- ─── Permissões da API ──────────────────────────────────────────────────
-- O projeto foi criado com "Automatically expose new tables" DESLIGADO,
-- então cada acesso é liberado aqui, explicitamente. As regras (RLS) acima
-- continuam decidindo QUAIS linhas cada um pode ver ou alterar.
grant usage on schema public to anon, authenticated;

grant select                         on public.studio_settings to anon, authenticated;
grant insert, update                 on public.studio_settings to authenticated;

grant insert                         on public.bookings        to anon, authenticated;
grant select, update, delete         on public.bookings        to authenticated;

grant select                         on public.portfolio_items to anon, authenticated;
grant insert, update, delete         on public.portfolio_items to authenticated;

grant select                         on public.admins          to authenticated;

grant execute on function public.is_admin()                to anon, authenticated;
grant execute on function public.busy_slots(date, date)    to anon, authenticated;

-- ─── Tempo real ─────────────────────────────────────────────────────────
-- Faz a agenda do painel atualizar sozinha quando chega um pedido novo.
-- (O Realtime respeita o RLS: só o admin recebe os pedidos.)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bookings'
     ) then
    alter publication supabase_realtime add table public.bookings;
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════════
--  Promover uma conta a administrador (rode depois de criar o usuário em
--  Authentication → Users). Troque o e-mail e rode só este trecho:
--
--  insert into public.admins (user_id)
--  select id from auth.users where email = 'email@exemplo.com'
--  on conflict do nothing;
-- ═══════════════════════════════════════════════════════════════════════
