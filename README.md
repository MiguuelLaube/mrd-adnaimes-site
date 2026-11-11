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

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Nome | Para quê |
| --- | --- |
| `ADMIN_PASSWORD` | Senha do painel `/admin` |
| `BLOB_READ_WRITE_TOKEN` | Criada ao conectar um **Blob Store** (Storage → Blob). Guarda configurações e fotos. |

Sem o Blob, o site usa os dados padrão de `lib/site.ts` (e, rodando local, salva em `.data/`).

## Rodar local

```bash
npm install
ADMIN_PASSWORD=teste npm run dev
```
