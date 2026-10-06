# TrekSync - Trek Expedition & Mountain Trail Management System

A full-stack Trek Management System built with Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, and Prisma ORM.

## Tech Stack
- Frontend: Next.js App Router, React, Tailwind CSS, Leaflet Maps
- Backend: Next.js Route Handlers, JWT Authentication, Prisma ORM
- Database: PostgreSQL
- Authentication: Role-based (USER, GUIDE, ADMIN)

## Quick Start

1. Install dependencies
```bash
npm install
```

2. Configure environment
Set `DATABASE_URL` and `JWT_SECRET` in `.env`.

3. Push schema & seed database
```bash
npx prisma db push
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

4. Run development server
```bash
npm run dev
```

## Demo Credentials
- Admin: admin@trek.com / admin123
- Guide: ramesh@trek.com / guide123
- User: rahul@gmail.com / user123
