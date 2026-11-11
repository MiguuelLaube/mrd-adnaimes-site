# Site de locação de andaimes

Next.js + Vercel. Página única com calculadora de torre e pedido pelo WhatsApp, e painel em `/admin`.

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Nome | Para quê |
| --- | --- |
| `ADMIN_PASSWORD` | Senha do painel `/admin` |
| `BLOB_READ_WRITE_TOKEN` | Criada sozinha ao conectar um **Blob Store** ao projeto (Storage → Blob). Guarda as configurações e as fotos. |

Sem o Blob, o site usa os dados padrão de `lib/site.ts` (e, rodando local, salva em `.data/`).

## Rodar local

```bash
npm install
ADMIN_PASSWORD=teste npm run dev
```
