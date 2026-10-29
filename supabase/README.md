# 🗄️ Supabase · configuração

Passo a passo para ligar o app ao Supabase (banco, login do artista e fotos do portfólio).

## 1. Criar o projeto

1. Em [supabase.com/dashboard](https://supabase.com/dashboard), clique em **New project**.
2. Nome: `artextreme` · Região: **South America (São Paulo)**.
3. Crie uma senha forte para o banco e guarde num gerenciador de senhas (não vai no código).

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

O serviço de e-mail padrão do Supabase só envia para membros da equipe do projeto e tem limite baixo. Para o artista receber o link de redefinição:

1. Crie uma conta grátis num serviço de envio (ex.: [Resend](https://resend.com)).
2. **Authentication → Emails → SMTP Settings**: ative o SMTP personalizado com os dados do serviço.
3. Em **Emails → Reset Password**, deixe o texto em português.

## O que cada um pode fazer

| | Visitante | Administrador |
| :--- | :---: | :---: |
| Ver preços, estúdio e portfólio | ✅ | ✅ |
| Criar pedido de horário | ✅ | ✅ |
| Ver horários ocupados (sem nome/telefone) | ✅ | ✅ |
| Ver, confirmar e excluir pedidos | ❌ | ✅ |
| Alterar preços, estúdio e horários | ❌ | ✅ |
| Enviar e apagar fotos do portfólio | ❌ | ✅ |

Dois pedidos ativos no mesmo horário são bloqueados pelo próprio banco.
