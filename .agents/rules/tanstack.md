# TanStack Router & TanStack Start Rules

1. **Type-Safe File-Based Routing**: Define all routes strictly using `createFileRoute('/path')`.
2. **Search Parameters as UI State**: Search parameters must ALWAYS be validated with a Zod schema via the `validateSearch` function to guarantee type safety and provide default values.
3. **Decoupled Data Fetching**: Do NOT use `useEffect` for page-level data fetching. All critical page data must be loaded using the route `loader` (combined with Suspense and TanStack Query).
4. **Server Functions (`createServerFn`)**: For TanStack Start backend operations, use `createServerFn` for all data mutations and remote queries. 
   - These functions MUST validate input using Zod (`inputValidator`).
   - These functions MUST verify authorization headers securely using `getRequest()`.
5. **Link Component**: Always use the imported `<Link>` component from `@tanstack/react-router` for internal navigation. Use strongly-typed `to`, `params`, and `search` props.
