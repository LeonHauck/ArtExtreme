# 🗄️ Supabase · configuração

Passo a passo para ligar o app ao Supabase (banco, login do artista e fotos do portfólio).

## 1. Criar o projeto

1. Em [supabase.com/dashboard](https://supabase.com/dashboard), clique em **New project**.
2. Nome: `artextreme` · Região: **South America (São Paulo)**.
3. **Database password**: use "Generate a password" e guarde num gerenciador de senhas (o app não usa essa senha).
4. **GitHub (optional)**: deixe em branco (o schema é aplicado pelo SQL Editor, não por migrations).
5. **Security**:
   - ✅ **Enable Data API** (o app usa)
   - ⬜ **Automatically expose new tables**: desligado; o `schema.sql` libera cada tabela explicitamente
   - ✅ **Enable automatic RLS** (camada extra de segurança)

## 2. Criar as tabelas e as regras de segurança

1. Menu **SQL Editor** → **New query**.
2. Cole todo o conteúdo de [`schema.sql`](schema.sql) e clique em **Run**.
3. Deve aparecer `Success. No rows returned`.

## 3. Login (só o artista entra)

Em **Authentication**:

- **Sign In / Providers → Email**: deixe ativado e **desligue "Allow new users to sign up"**. Assim ninguém cria conta sozinho.
- **URL Configuration**:
  - **Site URL**: `http://localhost:5173` (depois troca pelo endereço da Vercel)
  - **Redirect URLs**: adicione `http://localhost:5173/admin/nova-senha` (é para onde o link de "esqueci minha senha" leva)

## 4. Criar a conta de administrador

1. **Authentication → Users → Add user → Create new user**: e-mail, senha e marque **Auto Confirm User**.
2. No **SQL Editor**, promova a conta (troque o e-mail):

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'email@exemplo.com'
on conflict do nothing;
```

> Para testar, use o seu e-mail. Quando a conta definitiva chegar, repita o passo 4 com ela.

## 5. Ligar o app

1. **Project Settings → API**: copie a **Project URL** e a chave pública (**anon public** ou **publishable**, `sb_publishable_...`).
2. Copie `.env.example` para `.env.local` e preencha.
3. Rode `npm run dev`.

> ⚠️ A chave **service_role / secret** nunca vai para o app nem para o GitHub. A chave pública é segura porque todas as tabelas têm Row Level Security.

## 6. E-mails de "esqueci minha senha" (antes de ir para produção)

O serviço de e-mail padrão do Supabase só envia para membros da equipe do projeto e tem limite baixo. O app usa o **Gmail do próprio estúdio** como remetente (SMTP do Google com senha de app):

**Na conta Google do estúdio**
1. [myaccount.google.com/security](https://myaccount.google.com/security) → ative a **Verificação em duas etapas**.
2. [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) → nome `ArtExtreme Supabase` → **Criar** → copie o código de 16 letras.

**No Supabase → Authentication → Emails → SMTP Settings** → **Enable custom SMTP**

| Campo | Valor |
| :--- | :--- |
| Sender email | o Gmail do estúdio |
| Sender name | `ArtExtreme Tattoo Studio` |
| Host | `smtp.gmail.com` |
| Port | `465` |
| Username | o Gmail do estúdio |
| Password | a senha de app (16 letras, sem espaços) |

**E-mail em português**: em **Emails → Templates → Reset Password**, assunto `Crie sua nova senha · ArtExtreme` e corpo com o conteúdo de [`email-reset-password.html`](email-reset-password.html).

> 🔐 A senha de app fica só no painel do Supabase. Se ela vazar, basta revogá-la em myaccount.google.com/apppasswords.

## 7. Notificações no celular do artista

Quando um cliente pede horário, o banco chama a função `notify-booking`, que manda a notificação para os aparelhos onde o artista ativou os avisos.

```text
cliente agenda ──► tabela bookings ──► Database Webhook ──► Edge Function ──► celular do Mike 🔔
```

As chaves ficam no arquivo **`push-secrets.local`** na raiz do projeto (fora do Git). Para gerar novas: `npx web-push generate-vapid-keys`. Se trocar, atualize também `VAPID_PUBLIC_KEY` em `src/lib/push.ts`.

**7.1 Tabela dos aparelhos**: SQL Editor → cole e rode [`push.sql`](push.sql).

**7.2 Função**: Edge Functions → **Deploy a new function** → **Via Editor**
- Nome: `notify-booking`
- Apague o exemplo, cole o conteúdo de [`functions/notify-booking/index.ts`](functions/notify-booking/index.ts) e clique em **Deploy**.
- Na função → **Details** (ou Settings) → desligue **Verify JWT** e salve. A função confere sozinha quem está chamando (segredo do webhook ou login do artista).

> Pela linha de comando: `npx supabase functions deploy notify-booking --no-verify-jwt --project-ref <ref>`.

**7.3 Secrets**: Edge Functions → **Secrets** → adicione os 3 valores do `push-secrets.local`:

| Name | Valor |
| :--- | :--- |
| `VAPID_PUBLIC_KEY` | linha VAPID_PUBLIC_KEY |
| `VAPID_PRIVATE_KEY` | linha VAPID_PRIVATE_KEY |
| `WEBHOOK_SECRET` | linha WEBHOOK_SECRET |

**7.4 Webhook**: Database → **Webhooks** → **Create a new hook** (se pedir, clique antes em *Enable webhooks*)
- Name: `avisar_pedido_novo` · Table: `bookings` · Events: só **Insert**
- Type: **Supabase Edge Functions** → `notify-booking` · Method `POST` · Timeout `5000`
- HTTP Headers → **Add a new header**: `x-webhook-secret` = o valor de WEBHOOK_SECRET
- **Create webhook**

**7.5 Ativar no celular**: abra o painel no app instalado → **Ativar notificações** (aparece na Agenda e em Configurações). Já chega uma notificação de teste.

> 📱 **iPhone**: precisa do iOS 16.4 ou mais novo e do app instalado pelo Safari (Compartilhar → Adicionar à Tela de Início). **Android**: funciona no Chrome, instalado ou não.

## 8. Relatórios (valor cobrado)

SQL Editor → cole e rode [`reports.sql`](reports.sql). Ele cria o campo do **valor cobrado** em cada sessão, que o artista informa ao concluir na Agenda, e impede que o cliente preencha esse campo ao agendar. Sem ele, o painel continua funcionando e os relatórios usam a estimativa.

## O que cada um pode fazer

| | Visitante | Administrador |
| :--- | :---: | :---: |
| Ver preços, estúdio e portfólio | ✅ | ✅ |
| Criar pedido de horário | ✅ | ✅ |
| Ver horários ocupados (sem nome/telefone) | ✅ | ✅ |
| Ver, confirmar e excluir pedidos | ❌ | ✅ |
| Alterar preços, estúdio e horários | ❌ | ✅ |
| Enviar e apagar fotos do portfólio | ❌ | ✅ |
| Ativar notificações no próprio aparelho | ❌ | ✅ |
| Ver relatórios e informar o valor cobrado | ❌ | ✅ |

Dois pedidos ativos no mesmo horário são bloqueados pelo próprio banco.
