<div align="center">

<img src="docs/readme/banner.webp" alt="ArtExtreme: agendamento e orçamento de tatuagem em 3D" width="100%">

<br>

![React](https://img.shields.io/badge/React_19-08070b?style=for-the-badge&logo=react&logoColor=BE38F3)
![TypeScript](https://img.shields.io/badge/TypeScript-08070b?style=for-the-badge&logo=typescript&logoColor=BE38F3)
![Three.js](https://img.shields.io/badge/Three.js-08070b?style=for-the-badge&logo=threedotjs&logoColor=FF4FD8)
![Tailwind](https://img.shields.io/badge/Tailwind_4-08070b?style=for-the-badge&logo=tailwindcss&logoColor=FF8A1F)
![Vite](https://img.shields.io/badge/Vite_8-08070b?style=for-the-badge&logo=vite&logoColor=FFD23F)
![Supabase](https://img.shields.io/badge/Supabase-08070b?style=for-the-badge&logo=supabase&logoColor=FF8A1F)
![PWA](https://img.shields.io/badge/PWA-08070b?style=for-the-badge&logo=pwa&logoColor=FFD23F)

<br>

### Tatuagem boa começa antes da agulha. ✦

O app da **ArtExtreme Tattoo Studio**: o cliente marca o local no **corpo 3D**, vê o **valor na hora**<br>
e reserva o horário com o **Mike**. Sem ficar perguntando "quanto fica?" no direct.

<br>

### 🌐 [**artextreme.vercel.app**](https://artextreme.vercel.app)

[**▶ Demo no computador**](#-no-computador) &nbsp;•&nbsp;
[**📱 Demo no celular**](#-no-celular) &nbsp;•&nbsp;
[**✦ @tattooartextremee**](https://instagram.com/tattooartextremee)

</div>

<br>

## 🎬 Veja rodando

<div align="center">
  <img src="docs/readme/simulador-3d.gif" alt="Marcando a frente e a parte de trás da coxa no corpo 3D" width="100%">
  <br>
  <sub>Marca a coxa pela frente, vira de costas, marca a posterior e gira o corpo. O valor soma sozinho.</sub>
</div>

> 🎥 Quer ver tudo? Os vídeos completos estão logo ali em [**Demos completas**](#-demos-completas).

<br>

## 🎥 Demos completas

### 💻 No computador

Tour completo: home, simulador 3D, agendamento e o **painel do Mike** (agenda, preços e configurações). ~2 min.

<!-- VIDEO-COMPUTADOR: o player do GitHub entra aqui -->

https://github.com/user-attachments/assets/8ffdfb22-60cb-4827-87fd-f620d36aefb8

⬇️ [Baixar o vídeo (MP4, 5,6 MB)](https://github.com/LeonHauck/ArtExtreme/raw/main/docs/media/ArtExtreme-demo-computador.mp4)


### 📱 No celular

Como o cliente usa: simulador, valor fixo na tela, agendamento e **instalar como app**. ~1 min.

<div align="center">
  <img src="docs/readme/simulador-celular.gif" alt="Prévia no celular: marcando a coxa no corpo 3D, escolhendo o estilo e vendo o valor fixo na tela" width="300">
  <br>
  <sub>Prévia de 19s · o vídeo completo está logo abaixo</sub>
</div>

⬇️ [Baixar o vídeo completo (MP4, 5 MB)](https://github.com/LeonHauck/ArtExtreme/raw/main/docs/media/ArtExtreme-demo-celular.mp4)

<br>

## ✦ A história

O **Mike** é carioca, tatua desde **2015** e fundou a ArtExtreme em **2017**. Hoje atende em **Juiz de Fora/MG** e é **6x premiado** em **Blackwork** e **Rastelado** 🥇🥇🥇🥇🥈🥉.

Ele é fascinado por tecnologia (os desenhos nascem no Photoshop, Concepts e ArtFlow antes de chegar na pele), então nada mais justo que o estúdio ter um app à altura. A ideia é simples: resolver as duas perguntas que mais chegam no WhatsApp de qualquer tatuador.

| 💬 "Quanto fica?" | 📅 "Tem horário?" |
| :--- | :--- |
| O cliente marca **um ou mais locais** no corpo 3D, escolhe tamanho, estilo e cor, e recebe uma **faixa de valor na hora**, calculada pela tabela do próprio Mike. | O cliente vê só os horários **realmente livres** (considerando quanto tempo a sessão leva) e o pedido sai **pronto no WhatsApp** do estúdio. |

<br>

## 🔥 O que tem dentro

### Para quem quer tatuar

- 🧍 **Corpo 3D interativo** com visual neon de holograma. Gira, dá zoom e tem atalhos de frente, lados e costas.
- 🎯 **Marcação precisa**: frente e trás são áreas diferentes (bíceps/tríceps, antebraço interno/externo, coxa/posterior, canela/panturrilha, pescoço/nuca).
- ➕ **Vários locais num pedido só**, cada um com seu tamanho. Valor e tempo de sessão somam automaticamente, com detalhamento por local.
- 💸 **Estimativa na hora**: faixa de valor, duração da sessão e sinal.
- 🖼️ **Portfólio em esteira infinita** de ponta a ponta da tela, com pausa/play e arraste. Cada foto abre o post no Instagram.
- 📅 **Agendamento** com dias e horários livres, de acordo com o expediente, as folgas e a duração de cada sessão.
- 💬 **WhatsApp**: o pedido vira uma mensagem prontinha para o estúdio.
- 🩹 **Guia de cuidados pós-tattoo**, com o passo a passo do próprio Mike.
- 📲 **Instala como app** no Android e no iPhone (PWA), com botão "Instalar app", tela cheia e navegação inferior.

### Para o Mike (`/admin`)

- 🔐 **Login com e-mail e senha**, com **"esqueci minha senha"** (link por e-mail que abre a tela de criar senha nova, mesmo em outro aparelho).
- 🗓️ **Agenda em tempo real**: o pedido do cliente aparece na hora, com status (pendente, confirmado, concluído, cancelado) e indicadores.
- 💬 **WhatsApp com 1 toque**: "pedir sinal" (com valor e chave Pix), e ao confirmar, cancelar ou concluir o app abre o WhatsApp do cliente com a mensagem certa pronta. Na de "concluído" vão o link dos cuidados e o @ do Instagram.
- 🏷️ **Tabela de preços 100% editável**:
  - **Tamanhos**: faixas em cm, valor base e duração da sessão
  - **Áreas do corpo**: ajuste em % por região (costela dói mais, cobra mais 😅)
  - **Estilos**: ajuste por complexidade e marcação das especialidades em destaque
  - **Regras gerais**: valor mínimo, adicional de cor, margem da estimativa e % do sinal, com **exemplo de cálculo ao vivo**
- ⚙️ **Configurações**: dados do estúdio, chave Pix, dias e horários, folgas, troca de senha e backup em JSON.
- 🖼️ **Portfólio gerenciável**: sobe fotos direto do celular (o app recorta no formato do carrossel e comprime: 8,9 MB viram ~230 KB), define título, estilo, link do post, ordem e o que aparece no site.
- ☁️ **Tudo salvo no banco automaticamente**, com aviso de "Salvando… / Salvo" no topo do painel.

<br>

## 🧮 Como o preço é calculado

```text
valor de cada local = base da faixa × ajuste da área × ajuste do estilo × (colorida ? ajuste de cor : 1)
                      └─ respeitando o valor mínimo por tattoo
total               = soma dos locais
o cliente vê        = total ± margem
```

Tudo isso mora em [`src/lib/pricing.ts`](src/lib/pricing.ts), coberto por testes. Ninguém quer orçamento errado. ✅

<br>

## 📸 Telas

| Simulador 3D | No celular |
| :---: | :---: |
| <img src="docs/screenshots/simulador.webp" alt="Simulador 3D com a posterior da coxa marcada"> | <img src="docs/screenshots/simulador-mobile.webp" alt="Simulador no celular" width="260"> |

| Página inicial | O artista |
| :---: | :---: |
| <img src="docs/screenshots/home.webp" alt="Página inicial"> | <img src="docs/screenshots/artista.webp" alt="Seção do artista"> |

| Portfólio em esteira infinita |
| :---: |
| <img src="docs/screenshots/portfolio.webp" alt="Portfólio"> |

| No tablet | Painel do Mike no celular |
| :---: | :---: |
| <img src="docs/screenshots/home-tablet.webp" alt="Home no tablet" width="380"> | <img src="docs/screenshots/painel-estilos-mobile.webp" alt="Painel de estilos no celular" width="300"> |

<sub>Testado em celular (360 e 390 px), tablet em pé e deitado (768, 820 e 1024 px) e desktop (1440 px), sem rolagem lateral em nenhum deles.</sub>

<br>

## 🎨 Identidade visual

Preto profundo com neon de **rave**: o roxo vem da marca, o laranja e o amarelo vêm do lettering oficial e o rosa vem do grafite.

<img src="docs/readme/palette.webp" alt="Paleta de cores: Ink, Violet, Pink, Flame, Sun e Bone" width="100%">

| Fonte | Onde |
| :--- | :--- |
| **Bebas Neue** | Títulos e botões |
| **Permanent Marker** | Detalhes com cara de grafite (anos, números) |
| **Inter** | Textos |

O corpo 3D é **gerado por código** (geometrias de revolução e cápsulas), sem modelo baixado. Fica leve, sem problema de licença, e cada região é uma malha clicável. O visual neon usa um **shader próprio**: contorno fresnel, faixa de "scanner" subindo pelo corpo e pulso na área escolhida.

<br>

## 🗄️ Banco e segurança

O backend é o **Supabase**, e a regra de ouro é: **o cliente nunca vê dados de outro cliente**.

| | Visitante | Mike |
| :--- | :---: | :---: |
| Ver preços, estúdio e portfólio | ✅ | ✅ |
| Enviar, editar e apagar fotos do portfólio | ❌ | ✅ |
| Criar pedido de horário | ✅ | ✅ |
| Ver horários ocupados (só data, hora e duração) | ✅ | ✅ |
| Ver nome e telefone dos clientes, confirmar e excluir pedidos | ❌ | ✅ |
| Alterar preços, horários e dados do estúdio | ❌ | ✅ |

- 🛡️ **Row Level Security** em todas as tabelas, com permissões liberadas uma a uma (nada fica exposto por padrão).
- ⛔ **Trava de horário no próprio banco**: dois clientes clicando no mesmo horário ao mesmo tempo? Só um leva; o outro vê "esse horário acabou de ser reservado".
- 🔑 Cadastro público desligado: só entra no painel quem está na tabela de administradores.

O script completo está em [`supabase/schema.sql`](supabase/schema.sql) e o passo a passo em [`supabase/README.md`](supabase/README.md).

<br>

## 🛠️ Stack

| Camada | Tecnologia |
| :--- | :--- |
| Interface | React 19 · TypeScript · Tailwind CSS 4 |
| 3D | Three.js · React Three Fiber · Drei · shader GLSL próprio |
| Estado | Zustand (persistido, com migração de versões) |
| Rotas | React Router 7, com páginas carregadas sob demanda |
| Backend | Supabase: Postgres, Auth, Row Level Security, Realtime e Storage |
| App | vite-plugin-pwa: instalável, cache offline e atalhos |
| Qualidade | Vitest · checagem de tipos no build |

<br>

## 🗂️ Estrutura

```text
src/
├── components/
│   ├── body3d/          🧍 corpo 3D: zonas, manequim, shader neon, câmera e palco
│   ├── layout/          🧱 layout do site e do painel
│   ├── ui/              🎛️ botões, campos, medalhas, ícones
│   ├── WorksCarousel    🖼️ esteira infinita do portfólio
│   └── InstallAppButton 📲 "instalar app" (Android e iPhone)
├── data/                📦 preços iniciais, textos do estúdio e portfólio
├── hooks/               🪝 useEstimate (estado derivado do simulador)
├── lib/                 🧮 regras puras: preço, agenda, WhatsApp, formatação
├── pages/               📄 home, simulador, agendamento e painel
├── store/               🗃️ estado global persistido
└── types/               🔤 tipos do domínio
```

<br>

## 🚀 Rodando na sua máquina

```bash
npm install
cp .env.example .env.local   # preencha com a URL e a chave pública do Supabase
npm run dev                  # http://localhost:5173
```

| Script | O que faz |
| :--- | :--- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checa os tipos e gera o build de produção |
| `npm run preview` | Serve o build localmente |
| `npm test` | Roda os testes |
| `npm run icons` | Gera favicon e ícones do app a partir do logo |

> 🔐 Painel do artista em `/admin`. **Sem o `.env.local`**, o app roda no **modo local** (dados no aparelho, PIN de demonstração **1234**): ótimo para testar sem criar projeto. **Com o Supabase configurado**, o painel pede e-mail e senha.

<br>

## 🗺️ Roadmap

- [x] Simulador 3D com vários locais e marcação frente/trás
- [x] Estimativa somada, agendamento e integração com WhatsApp
- [x] Painel: agenda, preços e configurações
- [x] Identidade visual da ArtExtreme, portfólio e guia de cuidados
- [x] PWA instalável no Android e no iPhone
- [x] **Supabase**: agenda compartilhada entre clientes e o Mike, em tempo real
- [x] **Login do Mike** por e-mail e senha, com **"esqueci minha senha"**
- [x] **WhatsApp com 1 toque** para pedir sinal, confirmar, cancelar e concluir
- [x] **Aba Portfólio** no painel: subir fotos pelo celular, escolher estilo e ordem
- [x] **No ar na Vercel**: [artextreme.vercel.app](https://artextreme.vercel.app), com deploy automático a cada push
- [ ] Domínio próprio (ex.: `artextreme.com.br`)
- [ ] **Notificação no celular do Mike** quando chegar pedido (push, Android e iPhone)
- [ ] E-mails de senha saindo do Gmail do estúdio (SMTP)
- [ ] WhatsApp 100% automático pela API oficial da Meta

<br>

## 🙌 Créditos

<div align="center">

**Arte, marca, fotos e tatuagens**: ArtExtreme Tattoo Studio · Mike ([@tattooartextremee](https://instagram.com/tattooartextremee))<br>
**Design e desenvolvimento**: [Leon Hauck](https://www.linkedin.com/in/leon-hauck/)

<sub>O código está aberto para fins de portfólio. Logo, fotos e trabalhos pertencem à ArtExtreme e não podem ser reutilizados.</sub>

<br><br>

<img src="public/brand/logo.webp" alt="ArtExtreme" width="220">

</div>
