# General Software Engineering Rules

These rules apply universally to all TypeScript/JavaScript code in this repository.

### 1. Early Returns & Structure
Prioritize guard clauses and early exits in functions. Never use deep `if/else` nesting.
```typescript
// ❌ Avoid deep nesting
function process(data: Data | null) {
  if (data) {
    if (data.isValid) {
      return data.value;
    }
  }
}

// ✅ Do this: Fail fast
function process(data: Data | null) {
  if (!data || !data.isValid) return;
  return data.value;
}
```

### 2. Logic Separation (Pure Functions)
Separate reactive state (UI) from pure computational logic (business logic) to enable unit testing and reusability. Do not write massive data transformations directly inside React components or hooks.
```typescript
// ✅ Extract complex math or transformations into pure, testable functions outside the component
export function calculateTotals(items: Item[]): number { ... }
```

### 3. Meaningful & Intent-Revealing Names
Variables, functions, and files must be named explicitly to represent their intent, contents, and behavior. Avoid abbreviations.
- ❌ Bad: `const d = new Date();`, `function process(x: any) {}`, `e`, `res`, `data`
- ✅ Good: `const currentDate = new Date();`, `function processPayment(paymentPayload: PaymentPayload) {}`, `event`, `response`, `userProfile`

### 4. Strict Fallbacks (?? vs ||)
Prefer using Nullish Coalescing (`??`) when defining fallback values to protect valid falsy variables like `0` or empty strings `""` from being incorrectly overwritten.
```typescript
// ❌ Dangerous (overwrites valid 0 score)
const score = response.score || 10; 

// ✅ Safe (only falls back on null or undefined)
const score = response.score ?? 10;
```

### 5. Documentation and Comments
Do not write comments that simply restate the code. Comments must explain the *why*, not the *what*.
- Exceptions are made for files using **JSDoc/TSDoc**, which must adhere to the standard type definition syntax to expose clear method signatures and parameters for external modules.

### 6. Strict Type Safety
- **Never use `any`**. Use `unknown` if a type is truly dynamic, and narrow it down using type guards or Zod schemas.
- Use explicit return types for critical functions.
