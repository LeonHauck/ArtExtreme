-- ═══════════════════════════════════════════════════════════════════════
--  ArtExtreme · Relatórios: valor cobrado em cada sessão
--  O artista informa quanto cobrou ao concluir; os relatórios usam esse valor
--  (ou a estimativa, quando ele não foi informado). Pode rodar mais de uma vez.
--  (Já está incluído no schema.sql.)
-- ═══════════════════════════════════════════════════════════════════════

alter table public.bookings add column if not exists final_price numeric(10, 2)
  check (final_price is null or final_price >= 0);

-- O cliente não escolhe o valor cobrado: pedido novo sempre chega sem ele
drop policy if exists "cliente cria pedido pendente" on public.bookings;
create policy "cliente cria pedido pendente" on public.bookings
  for insert to anon, authenticated
  with check (status = 'pending' and session_date > current_date and final_price is null);
