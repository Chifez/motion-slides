---
name: useeffect-refactor
description: Audit and refactor React `useEffect` usage in a codebase or file. Use this whenever the user asks to review, clean up, audit, "purge", or refactor useEffect calls, mentions effects being buggy/smelly/overused, asks whether an effect is "necessary" or "correct", or wants a general React code-quality pass that touches component files with hooks. Trigger even if they just paste a component and ask "does this look right?" or "can this be simplified?" Applies to .jsx/.tsx/.js/.ts files using React hooks, including Next.js client components.
---

# useEffect Refactor

Audits every `useEffect` call in scope, classifies each one as **legitimate** or **anti-pattern**, explains *why*, and — once the user confirms — rewrites the anti-patterns. Never silently rewrite; always flag and explain first, per the two-phase workflow below.

## Phase 1: Locate

If given a specific file or snippet, work with that directly.

If pointed at a repo/directory, find every effect first:

```bash
grep -rn "useEffect(" --include="*.{js,jsx,ts,tsx}" <path>
```

For each match, read enough surrounding context (the whole component, not just the effect) to judge intent — you need to see what triggers the effect and what it's syncing with.

## Phase 2: Classify each effect

Run every `useEffect` through this checklist, in order. Stop at the first match — that's its category.

### 🚩 Anti-pattern A — Deriving state from props/state
**Signature:** the effect's only job is `setX(...)` computed purely from other state/props already available during render, with no external interaction.
```jsx
// Before
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${first} ${last}`);
}, [first, last]);

// After — no effect, no extra state, no extra render
const fullName = `${first} ${last}`;
```
If the computation is expensive, wrap in `useMemo` instead of adding an effect — still not a `useEffect` case.

### 🚩 Anti-pattern B — Resetting state on prop change
**Signature:** effect watches a prop (often an `id`) purely to reset local state back to initial values.
```jsx
// Before
useEffect(() => {
  setComment('');
}, [userId]);

// After — remount instead of reset
<Profile key={userId} userId={userId} />
```
Only flag as anti-pattern if the *whole* component's local state should reset. If just one piece of state needs resetting alongside other persistent state, keep the effect but note the tradeoff — `key` remount can be heavier if the component has expensive mount cost.

### 🚩 Anti-pattern C — Event logic disguised as an effect
**Signature:** the effect fires in response to a state change that itself only ever happens because of one specific user action (click, submit, toggle) — i.e., it's really an event handler wearing an effect costume.
```jsx
// Before
useEffect(() => {
  if (justSubmitted) {
    showToast('Saved!');
    setJustSubmitted(false);
  }
}, [justSubmitted]);

// After — move into the handler that sets justSubmitted
function handleSubmit() {
  save();
  showToast('Saved!');
}
```

### 🚩 Anti-pattern D — Chained effects / cascading state
**Signature:** effect A sets state that triggers effect B that sets state that triggers effect C. Look for multiple effects in the same component (or parent/child) that form a state-update pipeline.
```jsx
// Before
useEffect(() => { setStep2Ready(step1Done); }, [step1Done]);
useEffect(() => { if (step2Ready) doStep2(); }, [step2Ready]);

// After — collapse into one place, usually the originating handler
function handleStep1Complete() {
  setStep1Done(true);
  doStep2();
}
```
This is the highest-value flag — cascades cause extra renders and are the hardest bugs to trace. Always call this out explicitly even if each individual effect looks locally fine.

### 🚩 Anti-pattern E — Manual data fetching
**Signature:** raw `fetch`/`axios` call inside `useEffect` with `useState` for data/loading/error, no cleanup/cancellation, no cache.
```jsx
// Before
useEffect(() => {
  fetch(`/api/user/${id}`).then(r => r.json()).then(setUser);
}, [id]);

// After — recommend React Query / SWR (check package.json for what's already installed; don't introduce a new dependency without asking)
const { data: user } = useQuery(['user', id], () => fetchUser(id));
```
If no data-fetching library is present and the user doesn't want to add one, at minimum add a cleanup/ignore flag to prevent race conditions:
```jsx
useEffect(() => {
  let ignore = false;
  fetch(`/api/user/${id}`).then(r => r.json()).then(data => {
    if (!ignore) setUser(data);
  });
  return () => { ignore = true; };
}, [id]);
```

### ✅ Legitimate — leave alone (but still report as "reviewed, OK")
- Subscribing to a browser API or external event source (resize, scroll, media query, `window`/`document` listeners) — real synchronization with the outside world.
- Setting up/tearing down connections with cleanup: WebSocket, WebRTC/mediasoup peer connections, intervals, timers.
- Integrating an imperative non-React library that needs a DOM node (charting libs, editors, map widgets).
- Syncing `document.title`, focus, scroll position, or other DOM-only state React doesn't own.
- Logging/analytics fired once on mount.
- Syncing to an external store where `useSyncExternalStore` isn't already in use — flag as an *upgrade opportunity*, not a bug: `useSyncExternalStore` is more correct (handles tearing/concurrent rendering) than `useEffect` + `useState` for this case, but the existing code isn't broken.

If genuinely unsure which bucket an effect falls in, say so explicitly rather than forcing a classification — false-positive refactors are worse than an unflagged effect.

## Phase 3: Report

Present findings grouped by file, each effect labeled with its category and a one-line reason. Use this shape:

```
src/components/UserPanel.tsx
  L23  🚩 Anti-pattern A (derived state) — fullName computed from first/last, no need for state+effect
  L41  ✅ Legitimate — WebSocket subscription with cleanup, correctly synchronized
  L58  🚩 Anti-pattern D (chained effects) — feeds into effect at L67, forms a 2-step cascade
```

Don't rewrite anything yet. End the report by asking which flagged effects (all / some / none) to refactor.

## Phase 4: Refactor

Only after the user confirms scope. For each approved effect:
1. Apply the specific fix pattern from Phase 2.
2. Show the diff (before/after), not just the after — the user is reviewing a change, not receiving a rewrite.
3. If the fix introduces a new dependency (e.g., React Query), check `package.json` first and flag it rather than assuming it's fine to add.
4. Preserve existing behavior exactly — this is a structural refactor, not a feature change. If a fix would alter behavior (e.g., removing a cleanup that was actually load-bearing), stop and flag instead of guessing.

## Notes
- A file with zero anti-patterns is a valid outcome — say so plainly, don't manufacture a finding to seem thorough.
- Context-specific nuance: WebRTC/mediasoup connection setup, video/audio element refs, and canvas/animation-frame loops are almost always legitimate Anti-pattern-looking-but-isn't cases — read the whole effect body before flagging, since "external system" here often means media devices/streams, not just network/DOM.