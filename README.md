# Founter

Internal tools application for the Fountn.design team.

## Features

- **Newsletter Image Generator**: Create beautiful mockups for newsletter content
- **Settings**: Manage API keys (BaseRow, OpenAI, Anthropic, GLM)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Shadcn UI
- Prisma + SQLite

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Authentication
SITE_PASSWORD=your_password_here

# Database
DATABASE_URL="file:./dev.db"
```

### 3. Initialize Database

```bash
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Production Deployment (Plesk/VPS)

### 1. Environment Variables

Set these in your production `.env`:

```env
SITE_PASSWORD=your_secure_password
DATABASE_URL="file:./prod.db"
```

### 2. Build the Application

```bash
npm run build
```

### 3. Initialize Production Database

Run this command once after deploying:

```bash
npx prisma db push
```

This creates the SQLite database file and tables.

### 4. Directory Permissions

Ensure the `prisma/` folder is writable so SQLite can create and modify the database file.

### 5. Start the Application

```bash
npm start
```

## Database Management

### View Database (Prisma Studio)

```bash
npx prisma studio
```

### Using Migrations (Recommended for Production)

Instead of `db push`, use migrations for better control:

```bash
# Generate migration (local)
npx prisma migrate dev --name init

# Apply migrations (production)
npx prisma migrate deploy
```

### Backup

The SQLite database is stored at `prisma/prod.db`. Back up this file periodically as it contains your API keys.

## Project Structure

```
founter/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── app/
│   │   ├── api/settings/   # Settings API
│   │   ├── generator/      # Newsletter Generator page
│   │   ├── login/          # Login page
│   │   └── settings/       # Settings page
│   ├── components/
│   │   ├── generator/      # Generator components
│   │   ├── settings/       # Settings components
│   │   ├── shared/         # Shared components (Header)
│   │   └── ui/             # Shadcn UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities (prisma, utils, colors)
│   └── types/              # TypeScript interfaces
└── package.json
```
