# FoodBridge - Brain & Context

This document serves as the global memory for the FoodBridge project. It tracks the context, architecture, decisions, and progress of each build phase.

## Current Project State (Phase 0 - Initialization)

The project is a monorepo (pnpm workspaces) for a food donation matching platform, connecting donors with receivers.

### Tech Stack

- **Backend:** Express.js, Prisma, NeonDB (PostgreSQL)
- **Mobile App:** React Native, Expo, NativeWind, Expo Router
- **Shared:** Zod, TypeScript

### Project Structure

- `apps/backend`: Minimal Express server setup. Prisma is initialized but has no models in the schema yet. Health route `/health` is available.
- `apps/mobile`: Expo Router setup with route groups for different user roles: `(admin)`, `(auth)`, `(donor)`, `(receiver)`.
- `packages/shared`: Setup for shared Zod schemas and TypeScript types.

---

## Phase Log

### Phase 1: Setup and Architecture Understanding (Current)

- Analyzed the root configuration, `apps/backend`, `apps/mobile`, and `packages/shared`.
- Discovered an empty Prisma schema and a basic Express server in the backend.
- Discovered an Expo router structure catering to 3 distinct user types (Donors, Receivers, Admins) plus Auth flows.
- **Next Steps:** Define Prisma models (Users, Donations, Organizations/Receivers) and implement authentication flows on both backend and mobile.

### Phase 1: Database & Backend Core / Auth (Completed)

- **Database Schema:** Defined `User`, `FoodListing`, `FoodRequest`, `Notification`, and `VerificationDocument` models in `prisma/schema.prisma`.
- **Shared Zod Schemas:** Created `registerSchema` (discriminated union for Role), `loginSchema`, `forgotPasswordSchema`, and `resetPasswordSchema` in `packages/shared/src/schemas/auth.ts`.
- **Auth Core:** Implemented secure authentication with `bcrypt` (12 rounds) and `jsonwebtoken`. Added endpoints for register, login, refresh, logout, forgot-password, and reset-password.
- **Middleware:** Implemented a robust `errorHandler` (catching Zod and Prisma errors), generic `validate` schema parser, `rateLimiter`, and JWT `authMiddleware` (with `authenticate` and `authorize` aliases).
- **Verification:** Postman collection created at the root (`food-bridge-phase1.postman_collection.json`).

_(Add new phases below as they are completed...)_
