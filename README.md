# MidwayTicket — Frontend

> Digital ticketing platform for India's local fairs, melas, and amusement rides.

## Tech Stack

| Layer         | Technology                         |
|---------------|------------------------------------|
| Framework     | Next.js 14 (App Router)            |
| Language      | TypeScript (strict)                |
| Styling       | Tailwind CSS                       |
| UI Components | shadcn/ui-style + custom           |
| Icons         | Lucide React                       |
| State         | Zustand                            |
| Server State  | TanStack Query                     |
| Forms         | React Hook Form + Zod              |
| Charts        | Recharts                           |

## Quick Start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Routes

### Customer
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/fairs` | Fair discovery |
| `/fairs/[id]` | Fair detail + rides |
| `/rides/[id]` | Ride detail + booking |
| `/checkout` | Payment |
| `/tickets` | My tickets |
| `/tickets/[id]` | Individual ticket + QR |

### Operator
| Route | Description |
|-------|-------------|
| `/operator/login` | Operator authentication |
| `/operator/dashboard` | KPIs, charts, transactions |
| `/operator/rides` | Ride management |
| `/operator/staff` | Staff management |
| `/operator/staff/new` | Create staff account |
| `/operator/analytics` | Full analytics |
| `/operator/settings` | Account settings |

### Staff (Restricted)
| Route | Description |
|-------|-------------|
| `/staff/login` | Staff authentication |
| `/staff/scanner` | Ride-specific QR scanner |

## Architecture

```
UI Components
      ↓
Feature Hooks / Pages
      ↓
API Service Layer  (src/lib/api/)
      ↓
Mock Data          (src/lib/mock/)  ← swap for real API
      ↓
Future: NestJS Backend
```

## Mock Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Operator | rajesh@grandcitymela.in | password123 |
| Scanner Staff | rahul.s@midwayticket.in | staffpass123 |

## Environment Variables

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_USE_MOCK_API=true
```

## Connecting the Real Backend

1. Set `NEXT_PUBLIC_USE_MOCK_API=false` in `.env.local`
2. Set `NEXT_PUBLIC_API_URL` to your NestJS API URL
3. Replace mock implementations in `src/lib/api/*.ts` with real `fetch()` calls
4. The UI does not need to change — only the service layer

## Security Note

Frontend role checks are **UI restrictions only**. The NestJS backend must independently
enforce all authorization rules. Scanner staff cannot be trusted to self-report their
assigned ride — the backend validates every scan request against the database.
