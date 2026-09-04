# WIXOSS Team Match

WIXOSS チーム戦向けのマッチング Web アプリです。Next.js + Prisma + PostgreSQL で、Railway へのデプロイを想定しています。

## できること

- **管理者**: 大会の作成・編集（人数上限・受付状態など）
- **ユーザー**: 登録/ログイン、プロフィール（ルリグ・実績）、大会への参加予定登録
- **マッチング**: 同じ大会の参加者からおすすめ表示 → いいね → 相互いいねでマッチ
- **チーム**: 2人以上でチーム結成。募集中チームのメンバーと相互いいねで加入。大会の人数上限で募集終了

## ローカル起動

1. PostgreSQL を用意し、`.env` を作成

```bash
cp .env.example .env
# DATABASE_URL / SESSION_SECRET を設定
```

2. 依存関係・マイグレーション・シード

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

3. http://localhost:3000 を開く

シード後のアカウント例:

| 役割 | メール | パスワード |
|------|--------|------------|
| 管理者 | admin@example.com | adminpass123 |
| デモ | alice@example.com など | password123 |

## Railway デプロイ

1. GitHub に push し、Railway で New Project → リポジトリを選択
2. **PostgreSQL** プラグインを追加（`DATABASE_URL` が自動注入されます）
3. 変数を追加:
   - `SESSION_SECRET`（16文字以上のランダム文字列）
   - 任意: `ADMIN_EMAIL` / `ADMIN_PASSWORD`（シード用）
4. Deploy。`railway.toml` の build / start で migrate → 起動します
5. 初回だけシードする場合:

```bash
railway run npm run db:seed
```

## 技術スタック

- Next.js (App Router) + TypeScript
- Prisma + PostgreSQL
- セッション: JWT Cookie (`jose`)
- スタイル: Tailwind CSS
