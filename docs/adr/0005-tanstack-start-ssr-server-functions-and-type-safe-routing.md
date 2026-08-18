# ADR 005: TanStack Start SSR & Nitro Server Functions with Zod Contracts

## Status
**Accepted** (2026-08-18)

## Context & Problem Statement
MotionSlides requires a full-stack React framework that supports server-side rendering (SSR), high-performance client hydration, end-to-end type-safe routing, type-safe URL search parameter management, and secure server RPC functions without the bloat, vendor lock-in, or performance penalties of older frameworks.

We need a web application architecture that:
1. Provides 100% type-safe file-based routing and link generation.
2. Validates all URL search parameters against strict Zod schemas to treat query strings as first-class UI state.
3. Decouples data loading from client-side `useEffect` waterfalls using route loaders and Suspense.
4. Executes server logic (auth, database queries via Drizzle, AI generation) using type-safe Server Functions (`createServerFn`) running on Nitro.

## Decision Drivers
- **Type Safety**: Eliminate route typos, broken URL parameters, and runtime parameter mismatches across frontend and backend.
- **Modern React 19 Standards**: Embrace React 19 primitives (Actions, Server Components, `use` hook) and avoid deprecated patterns like `useEffect` data fetching or manual memoization.
- **Standardized Server RPC**: Avoid writing bespoke REST endpoints or manual fetch wrappers for internal app mutations.
- **Nitro Deployment Portability**: Run seamlessly on Node.js, Vercel, Docker, or edge runtimes.

## Decision Outcome
We adopted **TanStack Start** (`@tanstack/react-start`, `@tanstack/react-router`, Nitro, Vite, React 19):

1. **File-Based Type-Safe Routes**:
   - All routes in `apps/web/src/routes/` are declared via `createFileRoute('/path')`.
   - Route tree is automatically generated in `routeTree.gen.ts`.
2. **Search Parameters as Validated State**:
   - Routes managing search state use `validateSearch: (search) => zodSchema.parse(search)`.
3. **Route Loaders & Suspense**:
   - Page data requirements are resolved in route `loader` functions combined with TanStack Query.
   - `useEffect` is strictly forbidden for page-level data fetching.
4. **Type-Safe Server Functions (`createServerFn`)**:
   - Server mutations and backend logic are defined using `createServerFn({ method: 'POST' | 'GET' })`.
   - Inputs are validated using `.validator((data) => zodSchema.parse(data))`.
   - Authentication context is resolved securely on the server via `getRequest()` and `better-auth`.
5. **Type-Safe Navigation**:
   - All internal navigation uses `<Link>` or `useNavigate()` with strongly-typed `to`, `params`, and `search` props.

---

## Negative Space & Forbidden Alternatives

The following tools, paradigms, and patterns are **STRICTLY FORBIDDEN** in this repository:

| Forbidden Alternative | Reason for Rejection & Threat to Architecture |
| :--- | :--- |
| **Next.js App Router (`next/navigation`, `next/router`)** | This codebase is built on TanStack Start / Nitro. Importing Next.js routing or server modules will break compilation. |
| **`useEffect` for Data Fetching** | Causes client-side request waterfalls, layout shifts, stale data overwrites, and race condition bugs. |
| **Manual REST Endpoints for Internal RPC** | Writing unversioned raw Express routes in `apps/web` bypasses TanStack Start's type inference and input validation. |
| **Raw Unvalidated Search Params (`window.location.search`)** | Bypasses Zod schema validation, causing runtime type errors when parsing invalid or missing query values. |
| **Vanilla `<a>` Tags for Internal Navigation** | Triggers full page reloads, destroying the Zustand in-memory store and interrupting background video exports. |

---

## Agent Guardrails (Automated Enforcement Rules)

AI Agents modifying this codebase must adhere to the following strict guardrails:

1. **Route Declaration**:
   - Always declare routes using `createFileRoute('/path')({ component: ... })`. Never use older React Router `BrowserRouter` or `Routes` tags.
2. **Search Validation**:
   - If a route accepts query parameters, you MUST define `validateSearch` with a Zod schema.
3. **Data Loading in Loaders**:
   - ❌ `useEffect(() => { fetch('/api/project').then(...) }, [])`
   - ✅ `export const Route = createFileRoute('/p/$projectId')({ loader: async ({ params }) => fetchProject(params.projectId) })`
4. **Server Functions for Mutations**:
   - Use `createServerFn` with `.validator(zodSchema)` for backend operations. Verify user authorization headers via `getRequest()`.
5. **Navigation**:
   - Always import and use `<Link to="..." search={{ ... }} />` from `@tanstack/react-router`.

---

## Consequences & Trade-offs

### Positive
- **End-to-End Type Safety**: Renaming a route or search parameter immediately surfaces compile-time TypeScript errors across all callers.
- **Fast First Paint**: Route-level data loading and Nitro SSR ensure minimal hydration lag.
- **Zero Client Waterfall**: All required data is resolved before route rendering begins.

### Negative
- **Build Artifact Generation**: Modifying route files requires `routeTree.gen.ts` regeneration via Vite plugin.

---

## References & Code Artifacts
- Route Definitions: [apps/web/src/routes/](file:///c:/Users/c/Desktop/motionslides/apps/web/src/routes/)
- Router Configuration: [apps/web/src/router.tsx](file:///c:/Users/c/Desktop/motionslides/apps/web/src/router.tsx)
- Root Layout: [apps/web/src/routes/__root.tsx](file:///c:/Users/c/Desktop/motionslides/apps/web/src/routes/__root.tsx)
