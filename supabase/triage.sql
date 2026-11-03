-- ═══════════════════════════════════════════════════════════════════════
--  ArtExtreme · Triagem: primeira tattoo, cobertura/reforma e avaliação
--  Pedidos de cobertura, reforma e fechamento viram "pedido de avaliação":
--  chegam com foto, sem data, e o artista agenda depois de avaliar.
--  Pode rodar mais de uma vez. (Já está incluído no schema.sql.)
-- ═══════════════════════════════════════════════════════════════════════

alter table public.bookings add column if not exists kind text not null default 'session';
alter table public.bookings add column if not exists first_tattoo boolean;
alter table public.bookings add column if not exists cover text;
alter table public.bookings add column if not exists reference_path text;

-- Avaliação ainda não tem data nem horário
alter table public.bookings alter column session_date drop not null;
alter table public.bookings alter column start_time drop not null;

alter table public.bookings drop constraint if exists bookings_kind_check;
alter table public.bookings add constraint bookings_kind_check check (
  (kind = 'session' and session_date is not null and start_time is not null)
  or kind = 'evaluation'
);
alter table public.bookings drop constraint if exists bookings_cover_check;
alter table public.bookings add constraint bookings_cover_check check (cover is null or cover in ('cover', 'rework'));
alter table public.bookings drop constraint if exists bookings_reference_path_check;
alter table public.bookings add constraint bookings_reference_path_check
  check (reference_path is null or reference_path ~ '^pending/[0-9a-f-]{36}\.jpg$');

-- Cliente: sessão com data futura, ou avaliação sem data. Nunca já com valor cobrado.
drop policy if exists "cliente cria pedido pendente" on public.bookings;
create policy "cliente cria pedido pendente" on public.bookings
  for insert to anon, authenticated
  with check (
    status = 'pending' and final_price is null and (
      (kind = 'session' and session_date > current_date)
      or (kind = 'evaluation' and session_date is null and start_time is null)
    )
  );

-- Fotos de referência: privadas. O cliente só envia (não vê nem lista);
-- o artista vê, e apaga junto com o pedido.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('references', 'references', false, 3145728, array['image/jpeg'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cliente envia foto de referência" on storage.objects;
create policy "cliente envia foto de referência" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'references' and name ~ '^pending/[0-9a-f-]{36}\.jpg$');

drop policy if exists "admin vê fotos de referência" on storage.objects;
create policy "admin vê fotos de referência" on storage.objects
  for select to authenticated using (bucket_id = 'references' and public.is_admin());

drop policy if exists "admin apaga fotos de referência" on storage.objects;
create policy "admin apaga fotos de referência" on storage.objects
  for delete to authenticated using (bucket_id = 'references' and public.is_admin());
