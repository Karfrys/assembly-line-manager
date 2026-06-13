# Assembly Line Manager

A full-stack web application for managing assembly lines, workstations, and their allocations.

**Tech Stack:** Node.js/Express/TypeScript + Angular 19 + SQLite (Prisma ORM)

## Prerequisites

- **Node.js** 18+ and npm

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
npx prisma db push      # Create database schema
npx ts-node prisma/seed.ts  # Seed sample data (optional)
npm run dev              # Start API on http://localhost:3000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npx ng serve             # Start app on http://localhost:4200
```

### 3. Open the App

Navigate to **http://localhost:4200** in your browser.

**Default login:** `admin@demo.com` / `password123`

## Database

The app uses **SQLite** — no database server needed. The database file is auto-created at `backend/prisma/dev.db`.

### Recreate Database Schema

```bash
cd backend
npx prisma db push
```

### Reset Database (delete + recreate + seed)

```bash
cd backend
npm run db:reset
```

## Project Structure

```
assembly-line-manager/
├── backend/                 # Node.js + Express + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Sample data seeder
│   └── src/
│       ├── index.ts         # Express server entry point
│       ├── middleware/       # JWT auth middleware
│       ├── routes/          # REST API route handlers
│       └── lib/             # Prisma client singleton
├── frontend/                # Angular 19 SPA
│   └── src/app/
│       ├── components/      # UI components (login, dashboard, CRUD pages)
│       ├── services/        # HTTP API services
│       ├── guards/          # Auth route guard
│       ├── interceptors/    # JWT token interceptor
│       └── models/          # TypeScript interfaces
└── README.md
```

## API Endpoints

| Resource | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Products | `GET/POST /api/products`, `GET/PUT/DELETE /api/products/:id` |
| Assembly Lines | `GET/POST /api/assembly-lines`, `GET/PUT/DELETE /api/assembly-lines/:id` |
| Workstations | `GET/POST /api/workstations`, `GET/PUT/DELETE /api/workstations/:id` |
| Allocations | `GET/POST /api/assembly-lines/:id/allocations`, `PUT /api/.../allocations/reorder`, `DELETE /api/.../allocations/:wsId` |

## Features

- ✅ JWT Authentication (register + login)
- ✅ Products CRUD
- ✅ Assembly Lines CRUD with product filter
- ✅ Workstations CRUD with search
- ✅ Drag-and-drop workstation allocation & reordering
- ✅ Active/inactive assembly line toggle
- ✅ SQLite database with Prisma ORM
- ✅ Sample data seeding

## Sample Data

**Products:** 8DAB, 8DJH, Simosec, NXPlus C  
**Assembly Lines:** Convey line, Manual line, Final assembly line, Testing line  
**Workstations:** Laser welding, Manual welding, Drive assembly, Voltage drop test, Leakage test, HV/PD test, Final inspection, Frame assembly, Testing, Dispatch
