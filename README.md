# Study Library ERP

A production-ready Study Library management system (ERP) with role-based access control.

## Stack
- **Backend**: Node.js, Express.js, TypeScript, MongoDB, JWT
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui patterns

## Quick Start

### 1. Configure Environment
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and Cloudinary credentials
```

### 2. Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Seed Database (First Run)
```bash
cd backend && npm run seed
```
Default admin: `admin@library.com` / `Admin@123456`

### 4. Start Development
```bash
# Terminal 1 — Backend (port 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

## Features (V1)
- ✅ Authentication (JWT with refresh tokens)
- ✅ Role-Based Access (Owner, Manager, Receptionist)
- ✅ Dashboard with charts
- ✅ Student Management (CRUD, photo upload)
- ✅ Seat Management (visual grid, assign/release)
- ✅ Payment Management (recording, receipts)
- ✅ Reports (revenue trends, occupancy, expiring)
- ✅ Settings (library profile, plans)
- ✅ User Management (Owner-only)

## API Endpoints
```
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/students       — paginated, searchable
POST   /api/students
GET    /api/students/:id
PUT    /api/students/:id
DELETE /api/students/:id   — owner/manager only

GET    /api/seats
POST   /api/seats
PUT    /api/seats/:id/assign
PUT    /api/seats/:id/release

GET    /api/payments
POST   /api/payments

GET    /api/reports/dashboard
GET    /api/reports/revenue-trend
GET    /api/reports/expiring
GET    /api/reports/occupancy

GET    /api/settings
PUT    /api/settings       — owner only
```

## Future Modules (Pluggable)
- SMS / WhatsApp notifications
- QR code attendance
- Online payments
- Multi-library support
- Mobile app
