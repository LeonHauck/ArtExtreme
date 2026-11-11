-- ═══════════════════════════════════════════════════════════════════════
--  ArtExtreme · Registro de erros do app
--  Quando o app quebra no celular de alguém (cliente ou artista), o erro fica
--  gravado aqui para entender o que aconteceu. Sem dados pessoais: só a
--  mensagem, a página, o tipo de aparelho e se é o app instalado.
--  Ver em: Table Editor → app_errors. Pode rodar mais de uma vez.
--  (Já está incluído no schema.sql.)
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.app_errors (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  message    text not null check (char_length(message) <= 500),
  detail     text check (detail is null or char_length(detail) <= 2000),
  path       text check (path is null or char_length(path) <= 200),
  user_agent text check (user_agent is null or char_length(user_agent) <= 300),
  standalone boolean
);
create index if not exists app_errors_created_idx on public.app_errors (created_at desc);
alter table public.app_errors enable row level security;

-- Qualquer pessoa usando o app registra (só inserir); só o artista lê e apaga
drop policy if exists "app registra erros" on public.app_errors;
create policy "app registra erros" on public.app_errors
  for insert to anon, authenticated with check (true);

drop policy if exists "admin vê erros" on public.app_errors;
create policy "admin vê erros" on public.app_errors
  for select to authenticated using (public.is_admin());

drop policy if exists "admin apaga erros" on public.app_errors;
create policy "admin apaga erros" on public.app_errors
  for delete to authenticated using (public.is_admin());

grant insert on public.app_errors to anon, authenticated;
grant select, delete on public.app_errors to authenticated;
