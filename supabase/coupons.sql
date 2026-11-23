-- ═══════════════════════════════════════════════════════════════════════
--  ArtExtreme · Cupons de desconto
--  O artista cria cupons (ex.: ART40 = 40%) na aba Promoções. O cliente usa
--  no final do agendamento. Regras garantidas pelo banco:
--   • código sempre em maiúsculas; inválido, pausado ou fora da data é recusado
--   • cada WhatsApp usa cada cupom uma vez só (pedido cancelado libera de novo)
--   • o % gravado no pedido vem sempre da tabela de cupons
--  Pode rodar mais de uma vez. (Já está incluído no schema.sql.)
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.coupons (
  code       text primary key check (code ~ '^[A-Z0-9_-]{3,20}$'),
  percent    integer not null check (percent between 1 and 90),
  active     boolean not null default true,
  starts_on  date,
  ends_on    date,
  note       text check (note is null or char_length(note) <= 120),
  created_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
alter table public.coupons enable row level security;

-- Só o artista vê e mexe na lista (o cliente só valida um código por vez)
drop policy if exists "admin gerencia cupons" on public.coupons;
create policy "admin gerencia cupons" on public.coupons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.coupons to authenticated;

-- Cupom usado no pedido
alter table public.bookings add column if not exists coupon_code text;
alter table public.bookings add column if not exists coupon_percent integer;
alter table public.bookings drop constraint if exists bookings_coupon_percent_check;
alter table public.bookings add constraint bookings_coupon_percent_check
  check (coupon_percent is null or coupon_percent between 1 and 90);
create index if not exists bookings_coupon_idx on public.bookings (coupon_code) where coupon_code is not null;

-- Mesmo cliente = mesmos 10 últimos dígitos do telefone (com ou sem 55)
create or replace function public.phone_key(p text) returns text
language sql immutable as $$ select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 10) $$;

-- Valida um código (e, se vier o telefone, se essa pessoa já usou)
create or replace function public.check_coupon(p_code text, p_phone text default null)
returns table (valid boolean, percent integer, reason text)
language plpgsql stable security definer set search_path = public as $$
declare
  c public.coupons;
  today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select * into c from public.coupons where code = upper(trim(coalesce(p_code, '')));
  if not found or not c.active then
    return query select false, null::integer, 'Cupom inválido'::text; return;
  end if;
  if c.starts_on is not null and today < c.starts_on then
    return query select false, null::integer, 'Este cupom ainda não começou'::text; return;
  end if;
  if c.ends_on is not null and today > c.ends_on then
    return query select false, null::integer, 'Este cupom expirou'::text; return;
  end if;
  if length(public.phone_key(p_phone)) >= 10 and exists (
    select 1 from public.bookings b
    where b.coupon_code = c.code and b.status <> 'cancelled'
      and public.phone_key(b.client_phone) = public.phone_key(p_phone)
  ) then
    return query select false, c.percent, 'Você já usou este cupom'::text; return;
  end if;
  return query select true, c.percent, null::text;
end $$;

revoke all on function public.check_coupon(text, text) from public;
grant execute on function public.check_coupon(text, text) to anon, authenticated;

-- Ao criar o pedido: confere o cupom de novo e grava o % oficial
create or replace function public.bookings_coupon() returns trigger
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.coupon_code is null or trim(new.coupon_code) = '' then
    new.coupon_code := null;
    new.coupon_percent := null;
    return new;
  end if;
  new.coupon_code := upper(trim(new.coupon_code));
  select * into r from public.check_coupon(new.coupon_code, new.client_phone);
  if not r.valid then
    raise exception '%', coalesce(r.reason, 'Cupom inválido') using errcode = 'P0002';
  end if;
  new.coupon_percent := r.percent;
  return new;
end $$;

drop trigger if exists bookings_coupon on public.bookings;
create trigger bookings_coupon before insert on public.bookings
  for each row execute function public.bookings_coupon();
