# web-clipboard

网络剪切板 — 基于 Cloudflare Workers + D1 的文本分享工具。

输入文本，生成短链接和二维码。支持密码保护、过期时间、历史记录。

## Tech Stack

- Cloudflare Workers (Hono)
- Cloudflare D1 (SQLite)
- Vanilla HTML/CSS/JS

## Quick Start

```bash
# Install dependencies
npm install

# Create D1 database
npx wrangler d1 create web-clipboard-db

# Update wrangler.toml with the database_id

# Run migrations
npx wrangler d1 migrations apply web-clipboard-db --local

# Start dev server
npm run dev
```

## Deploy

```bash
npm run deploy
```

Then bind your custom domain in the Cloudflare dashboard.
