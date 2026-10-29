-- ═══════════════════════════════════════════════════════════════════════
--  ArtExtreme · Notificações no celular (push)
--  Guarda os aparelhos do artista que querem receber aviso de pedido novo.
--  Pode rodar mais de uma vez sem problema. (Já está incluído no schema.sql.)
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.push_subscriptions (
  endpoint   text primary key check (endpoint like 'https://%' and char_length(endpoint) <= 1000),
  user_id    uuid not null references auth.users (id) on delete cascade,
  p256dh     text not null check (char_length(p256dh) <= 200),
  auth       text not null check (char_length(auth) <= 100),
  device     text check (device is null or char_length(device) <= 120),
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;

drop policy if exists "admin vê os próprios aparelhos" on public.push_subscriptions;
create policy "admin vê os próprios aparelhos" on public.push_subscriptions
  for select to authenticated using (user_id = auth.uid() and public.is_admin());

drop policy if exists "admin remove os próprios aparelhos" on public.push_subscriptions;
create policy "admin remove os próprios aparelhos" on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid() and public.is_admin());

-- Salvar pelo app: se o aparelho já era de outra conta (ex.: Leon testou no
-- celular do Mike), ele passa para quem está logado agora.
create or replace function public.save_push_subscription(
  p_endpoint text, p_p256dh text, p_auth text, p_device text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas o artista pode ativar notificações' using errcode = '42501';
  end if;
  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth, device)
  values (p_endpoint, auth.uid(), p_p256dh, p_auth, left(p_device, 120))
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
        device = excluded.device, created_at = now();
end $$;

revoke all on function public.save_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;
grant select, delete on public.push_subscriptions to authenticated;

-- A Edge Function notify-booking usa a chave interna (service_role): ela lê
-- quem é admin e os aparelhos, e apaga os que não existem mais.
grant usage on schema public to service_role;
grant select on public.admins to service_role;
grant select, delete on public.push_subscriptions to service_role;
