-- ═══════════════════════════════════════════════════════════════════════
--  ArtExtreme · Agendamento feito pelo próprio artista (pelo painel)
--  O artista cria o agendamento de alguém direto na Agenda: qualquer data,
--  já confirmado, aguardando sinal ou até uma sessão que já aconteceu.
--  Pode rodar mais de uma vez. (Já está incluído no schema.sql.)
-- ═══════════════════════════════════════════════════════════════════════

-- De onde veio o pedido: do site (cliente) ou do painel (estúdio)
alter table public.bookings add column if not exists origin text not null default 'client';
alter table public.bookings drop constraint if exists bookings_origin_check;
alter table public.bookings add constraint bookings_origin_check check (origin in ('client', 'studio'));

-- Cliente: igual antes, e sempre como "client"
drop policy if exists "cliente cria pedido pendente" on public.bookings;
create policy "cliente cria pedido pendente" on public.bookings
  for insert to anon, authenticated
  with check (
    origin = 'client' and status = 'pending' and final_price is null and (
      (kind = 'session' and session_date > current_date)
      or (kind = 'evaluation' and session_date is null and start_time is null)
    )
  );

-- Artista: cria agendamentos livremente (a trava de horário duplicado continua valendo)
drop policy if exists "admin cria agendamentos" on public.bookings;
create policy "admin cria agendamentos" on public.bookings
  for insert to authenticated with check (public.is_admin());
