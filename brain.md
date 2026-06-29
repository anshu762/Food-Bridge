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

### Phase 2: Backend Business Logic (Completed)

- **Database Schema Updates:** Added `pickupLat`, `pickupLng`, `foodType`, `safeUntil` to `FoodListing` and `expoPushToken` to `User`. Added `COLLECTED` to `ListingStatus`.
- **Listings Module:** Implemented `GET` (with Haversine geo-distance filtering and pagination), `POST`, `PATCH`, and `DELETE` (soft-cancel). Added Cloudinary signature endpoint for image uploads.
- **Requests Module (Critical):** Implemented transaction logic using `$queryRaw` `SELECT ... FOR UPDATE` to strictly prevent concurrent approval races. Added approve, reject, cancel, and collect lifecycle endpoints.
- **Notifications Module:** Integrated Expo server SDK for push notifications on listing updates, request approvals, and cron jobs.
- **Cron Jobs:** Added `node-cron` job running every 5 minutes to expire listings safely and notify users of overdue pickups.
- **Impact & Verification:** Implemented aggregated views (`GET /impact/me`, `GET /impact/platform`) and ID verification document upload and approval endpoints.
- **Zod & Types:** Fully exported schemas across the monorepo. Typechecked and verified.

### Phase 3: Mobile App Foundation (Completed)

- **Dependencies:** Setup React Native with Expo Router, NativeWind (Tailwind CSS), React Query, Zustand (for Auth), Expo Secure Store, and React Hook Form with Zod validation.
- **Design System:** Created standardized, highly reusable components (`Button`, `Input`, `Badge`, `Card`, `Skeleton`, `EmptyState`, `ErrorState`, `Toast`) utilizing consistent NativeWind brand colors.
- **API & Networking:** Configured a resilient Axios client with a 401 response interceptor. It gracefully handles queueing concurrent requests, attempting a single background refresh, and cleanly re-executing queued requests without logging the user out. Integrated `@react-native-community/netinfo` to provide global offline mode banners.
- **Navigation Shell:** Built Expo Router groups and Tab layouts for `(auth)`, `(donor)`, `(receiver)`, and `(admin)`. Implemented global hydration redirects to enforce strict role-based navigation.
- **Auth Flow:** Built full E2E UI screens for Onboarding (persisted check), Login, dynamic Role-based Registration, and Password Recovery, strictly mapping to the backend Phase 1 endpoints with comprehensive validation.

### Phase 4: Mobile Core Workflows - Donor Flows (Completed)

- **State Management & API:** Configured comprehensive API clients and React Query hooks (`useListings`, `useRequests`, `useImpact`) for the donor features. Added a Zustand store (`useDraftStore`) for persisting multi-step form data locally.
- **Create Listing Flow:** Built a robust, resilient 5-step form. Integrated `expo-image-manipulator` for client-side image compression and direct Cloudinary uploads with retry mechanisms. Added `expo-location` and `react-native-maps` for GPS pickup pin-drops.
- **My Listings:** Implemented a scalable, segmented listing view with `FlatList` and infinite scrolling. Includes real-time relative expiry badges (e.g., "Expires in 2h").
- **Listing Detail & Race Conditions:** Built the donor view to manage incoming `FoodRequest`s. Explicitly handles 409 Conflict race conditions when approving requests, immediately invalidating and refetching to ensure the UI represents the strict backend transactional state.
- **Donor Dashboard:** Completed the donor home screen displaying dynamic impact metrics (`GET /impact/me`) and quick links to pending requests needing a decision.
