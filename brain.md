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

*(Add new phases below as they are completed...)*
