# FoodBridge - Brain & Context

This document serves as the global memory for the FoodBridge project. It tracks the context, architecture, decisions, and progress of each build phase.

## Current Project State (Phase 6 - Complete)

The project is a monorepo (pnpm workspaces) for a food donation matching platform, connecting donors with receivers. All 6 phases are complete.

### Tech Stack

- **Backend:** Express.js, Prisma, NeonDB (PostgreSQL), Cloudinary, Expo Push SDK
- **Mobile App:** React Native 0.81, Expo SDK 54, Expo Router 6, twrnc (Tailwind), Zustand, React Query, react-hook-form, Zod
- **Shared:** Zod schemas + TypeScript types used by both backend and frontend
- **Haptics:** expo-haptics for key success action feedback
- **Push:** expo-notifications for foreground/background/killed deep-linking

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

### Phase 5: Mobile Core Workflows - Receiver Flows (Completed)

- **Navigation Restructure:** Moved receiver screens into `(receiver)/(tabs)/` subfolder. `(receiver)/_layout.tsx` is a Stack containing `(tabs)` group + `listing/[id]` detail screen, allowing detail to push on top of tabs.
- **Browse/Discover Screen (`(tabs)/index.tsx`):** Infinite-scroll FlatList with listing cards (photo, foodType, qty+unit, distance, time-remaining countdown). Map/List view toggle (map falls back to text on web). Search with 400ms debounce. Filter modal (foodType multi-select chips, radius slider 1/5/10/25/50 km). Three empty states (location off, no results, no food nearby). Uses `Location.reverseGeocodeAsync()` to display city name (e.g., "Near New Delhi").
- **Browse Tab (`(tabs)/browse.tsx`):** Search-focused with list/grid toggle, same filter modal and API integration.
- **Listing Detail (`listing/[id].tsx`):** Photo gallery with pagination dots, foodType, qty, prep time, safe-until countdown, pickup area, donor org name. "Request this food" button with confirmation dialog + disabled after tap. 409 `LISTING_NOT_AVAILABLE` → Alert "just reserved by someone else" + refresh. Existing request status shown inline. ACCEPTED state reveals pickup address, donor contact (email/phone with tappable links), "Get Directions" deep link, "Mark as Collected" button. Collect flow: confirmation → API call → celebration overlay with impact message → navigate to My Requests.
- **My Requests (`(tabs)/my-requests.tsx`):** Tabbed view: Pending / Approved / Rejected / History (COLLECTED/CANCELLED). Each row: listing thumbnail, status badge, relative timestamp. Pending tab: "Cancel Request" with confirmation. Approved tab: pickup details, directions link, "Mark Collected". Distinct empty state per tab.
- **TypeScript & Lint:** Zero TS errors, zero ESLint errors across all receiver files. `(router as any).push()` pattern used for dynamic routes (Expo Router typed routes limitation).

### Phase 6: Shared Flows & Polish (Completed)

- **Profile Screen (shared, role-aware):** View/edit name, phone, orgName (donors). Change password with current/new validation matching registration rules. Verification status section showing PENDING/APPROVED/REJECTED with re-upload on rejection and document prompts on pending. Logout with confirmation dialog. Delete account with irreversible warning — calls `DELETE /users/me` which soft-deletes by anonymizing PII.
- **Backend Users Module:** Added `GET /users/me`, `PATCH /users/me`, `PUT /users/me/password`, `DELETE /users/me` (soft-delete). Added `GET /verification/documents`.
- **Notifications Screen (both roles):** Paginated FlatList from `GET /notifications`. Unread visual distinction, mark-all-read, deep-link on tap, pull-to-refresh. Skeleton/empty/error states.
- **Push Notification Registration:** Permissions requested after login (contextual, not app launch). Token registered via `POST /notifications/register-token`. `expo-notifications` added.
- **Deep Linking (3 app states):** Root `_layout.tsx` handles foreground (listener), background/killed (`getLastNotificationResponseAsync`). Unauthenticated deep links stored and replayed after auth redirect.
- **Unread Badge:** Red badge on tab bar icon; polls every 30s via `useUnreadCount`.
- **Impact Dashboard (both roles):** Personal stats (`/impact/me`: meals + kg) + platform stats (`/impact/platform`). Role-aware framing (donor sees "Meals Provided", receiver sees "Meals Collected"). Share button with native share sheet. Empty state for new users with encouraging copy.
- **Tab Layout Updates:** Added `(tabs)/notifications.tsx` and `(tabs)/impact.tsx` to both donor and receiver tab groups. Both layouts now have 6 tabs.
- **Reusable Upload Hook:** `src/hooks/useUpload.ts` — image picker + manipulator + Cloudinary upload with progress tracking and retry, used by both listing creation and verification document upload.
- **Haptics (expo-haptics):** Added to key success actions across all Phase 6 screens: profile save, password change, collect food, cancel request, request submission, share impact.
- **Global Polish Audit:** Screened all screens from Phases 3-5. Findings documented above (donor screens use spinners not skeletons; create.tsx has inline error not full ErrorState). Defensive data access confirmed via TypeScript strict mode across all new code.
- **TypeScript & Lint:** Zero errors in all Phase 6 files. 19 warnings (all acceptable: `any` casts per codebase pattern, hook deps).
