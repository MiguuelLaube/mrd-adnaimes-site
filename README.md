# MRD Andaimes — site

Site de locação de andaimes da MRD Andaimes (Taubaté e região). Next.js, pensado primeiro para o celular.

- Catálogo de equipamentos
- Calculadora "Monte sua torre" com torre em 3D animada (Motion) que se monta conforme as peças
- Pedido de orçamento direto pelo WhatsApp
- Painel `/admin` (senha) para editar empresa, itens, fotos, regras e serviços

## Regras da calculadora (`lib/calculo.ts`, `lib/torre3d.ts`)

- Cada 2 painéis = 1 m de altura por torre; a altura sai da quantidade de painéis.
- Torre mista alterna 1 m e 1,5 m nível a nível; combinações impossíveis ficam bloqueadas.
- Base: 1 jogo (sapatas ou rodinhas) por torre. Travessas: 1 a 2 por metro.
- Escadas até cobrir a altura; plataformas só onde o vão comporta.
- Altura máxima por torre configurável no painel.

## Publicar na Cloudflare (Workers)

O projeto usa o [OpenNext](https://opennext.js.org/cloudflare) para rodar o Next.js nos Workers.
O painel guarda configurações e fotos no **Workers KV** (binding `DADOS`, criado automaticamente no primeiro deploy).

Pelo painel da Cloudflare (publica a cada push no GitHub):

1. **Workers & Pages → Create → Import a repository** e escolha este repositório.
2. **Build command:** `npx opennextjs-cloudflare build`
3. **Deploy command:** `npx opennextjs-cloudflare deploy`
4. Em **Settings → Variables and Secrets**, crie o segredo `ADMIN_PASSWORD` (senha do painel `/admin`).

Ou pelo terminal: `npm run deploy` (pede login no wrangler).

## Rodar local

```bash
npm install
ADMIN_PASSWORD=teste npm run dev
```
