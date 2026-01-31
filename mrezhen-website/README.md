# Mrezhen Website

## Local Setup (Windows / PowerShell)

### 1) Create env file

```powershell
Copy-Item example.env .env
notepad .env
```

Required variables:

- `DATABASE_URL` (PostgreSQL connection string)
- `AUTH_SECRET` (required for Auth.js / NextAuth)

Generate a secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2) Install dependencies

If PowerShell blocks `npm`, use `npm.cmd` instead.

```powershell
npm.cmd install
```

### 3) Prisma

```powershell
npx.cmd prisma generate
npx.cmd prisma migrate deploy
```

### 4) Run the dev server

```powershell
npm.cmd run dev
```

Open http://localhost:3000
