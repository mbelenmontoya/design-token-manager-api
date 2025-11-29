---
name: code-comment-standards
description: Enforces code comment quality standards. Comments document current functionality in approachable format. No phase/task/step references. Focus on "what" not lengthy "why". Use TSDoc for public APIs. Link to docs for architecture details.
---

# 📝 Code Comment Standards

## Overview

Ensures code comments are clear, current, and maintainable. Comments should be human-readable and approachable for junior engineers while remaining terse. This skill enforces removal of stale temporal references, plan-related comments, and guides proper documentation practices.

**Core Principle:** Document what code does, not historical context or plan progress.

## When to Use

**ALWAYS activate this skill when:**

- Writing new functions, classes, or modules
- Refactoring existing code with comments
- Reviewing pull requests with comment changes
- Creating public APIs or exported functions
- Adding TODOs or workaround comments
- About to commit code (pre-commit review)

## The 10 Rules

### Rule 1: Document Current Functionality ONLY

Comments explain what code **currently does**, not what it used to do or might do in the future.

```typescript
// ✅ GOOD - Documents current behavior
/**
 * Format timestamp as relative time (e.g., "2 hours ago", "Yesterday")
 * Falls back to abbreviated date for older timestamps
 */
function formatRelative(timestamp: string | Date): string {
```

```typescript
// ❌ BAD - Documents removed functionality
/**
 * Format timestamp as relative time
 * Previously used moment.js but we migrated to date-fns
 * Old implementation stored in git history
 */
function formatRelative(timestamp: string | Date): string {
```

### Rule 2: Remove ALL Comments When Logic is Removed

When code is deleted, ALL related comments must be removed. No "removed" annotations.

```typescript
// ❌ BAD - Commenting out code and leaving note
// function oldFormatDate() {
//   // Removed - see Phase 7 migration
// }

// ✅ GOOD - Just delete it (git history preserves it)
// [nothing here]
```

### Rule 3: NO Phase/Task/Step References

Plan progress numbers don't belong in code. Link to plan documents instead.

```typescript
// ❌ BAD - Phase reference without context
// Phase 7: Moved to controller pattern
const contacts = useContacts();

// ❌ BAD - Task reference
// Task 35: Added cache invalidation
invalidateCache(contactId);

// ✅ GOOD - Brief explanation + doc link
/**
 * Cache-first pattern with LRU eviction
 * @see docs/architecture/controller-pattern.md
 */
const contacts = useContacts();
```

### Rule 4: TODOs for Product Debt

TODOs track deferred work. Must include brief description and link to plan/issue.

```typescript
// ✅ GOOD - Clear TODO with context
// TODO: Implement pagination for 10,000+ contacts
// Currently loads all contacts into memory (150MB with 10k contacts)
// @see docs/plans/contact-pagination-plan.md

// ✅ GOOD - TODO with issue link
// TODO: Add retry logic for failed IndexedDB transactions
// Known issue: Safari occasionally fails on large bulk writes
// https://github.com/your-org/beacon/issues/234

// ❌ BAD - Vague TODO without context
// TODO: Fix this later

// ❌ BAD - TODO with phase reference
// TODO: Phase 12 - optimize this
```

**When to Use TODOs:**

- Feature planned but not yet built
- Known limitations or bugs
- Performance improvements identified but deferred
- Workarounds that should eventually be removed

**When NOT to Use TODOs:**

- High-priority issues (create GitHub issue instead)
- Breaking changes (handle immediately)
- Security vulnerabilities (fix now)

### Rule 5: Focus on "What" - Move "Why" to Docs

Comments explain **what** code does. Lengthy architectural **why** goes in docs/ folder.

```typescript
// ✅ GOOD - Terse "what" comment
/**
 * LRU cache size optimized for memory vs hit rate balance
 * @see docs/architecture/cache-strategy.md
 */
const MAX_CACHE_SIZE = 200;

// ❌ BAD - Lengthy "why" in code
/**
 * We use LRU cache because we benchmarked memory usage with 10,000 contacts
 * and found that keeping all contacts in memory used 150MB. The LRU approach
 * keeps only 200 most-used contacts (~3MB) while maintaining 90% hit rate.
 * We chose 200 based on user behavior analysis showing average users interact
 * with 50-80 contacts per session. See performance testing results in
 * docs/performance/cache-sizing-analysis.md
 */
const MAX_CACHE_SIZE = 200;
```

**The Boundary:**

- **"What" stays in code**: Function purpose, parameters, return values, operation flow
- **"Why" goes to docs**: Architecture decisions, trade-offs, historical context, benchmarks

### Rule 6: Use TSDoc Format for Public APIs

TypeScript files use TSDoc (extends JSDoc) with `@param`, `@returns`, `@see`, `@example`, `@deprecated`.

```typescript
// ✅ GOOD - Complete TSDoc for public API
/**
 * Load multiple contacts by IDs (batch operation)
 * Cache-first with fallback to IndexedDB for cache misses
 *
 * @param contactIds - Array of contact UUIDs to load
 * @returns Array of Contact objects (empty if none found)
 * @see docs/architecture/controller-pattern.md
 */
async function loadContacts(contactIds: string[]): Promise<Contact[]> {
```

```typescript
// ✅ GOOD - TSDoc with example
/**
 * Format timestamp as relative time
 *
 * @param timestamp - ISO string or Date object
 * @returns Human-readable relative time string
 * @example
 * formatRelative('2024-01-15T10:00:00Z') // "2 hours ago"
 * formatRelative(new Date()) // "Just now"
 */
function formatRelative(timestamp: string | Date): string {
```

**Single-line comments** are fine for inline explanations:

```typescript
const MAX_CACHE_SIZE = 200; // LRU eviction threshold
```

### Rule 7: Inline Comments for Non-Obvious Logic

Add inline comments when logic isn't self-evident: workarounds, edge cases, performance choices.

**Workarounds:**

```typescript
// Workaround: Vue 3 doesn't track Map.set() reactivity
// Using ref({...map}) forces re-render when map changes
// TODO: Remove when Vue 3.5 adds native Map reactivity
// @see docs/issues/vue-map-reactivity.md
const reactiveMap = ref({ ...originalMap });
```

**Edge Cases:**

```typescript
/**
 * Handle user switch navigation
 * Edge case: If viewing conversation user doesn't have access to,
 * redirect to inbox to prevent 404
 */
async function handlePostSwitchNavigation() {
```

**Performance Notes:**

```typescript
// Performance: Batch IndexedDB reads reduce overhead from 100ms to 5ms
// for 50+ contact lookups. Don't split into individual gets.
const contacts = await cache.contacts.where('id').anyOf(contactIds).toArray();
```

**Security Considerations:**

```typescript
/**
 * Sanitize user input before indexing
 * Security: Prevents XSS via stored search queries
 * Strips HTML tags and limits length to 500 chars
 */
function sanitizeSearchQuery(query: string): string {
```

**Type Safety:**

```typescript
// TypeScript limitation: Dexie returns 'any' for .get()
// Explicit cast ensures type safety for downstream code
const contact = (await cache.contacts.get(id)) as Contact;
```

### Rule 8: Architecture Comments - Brief + Link

Architecture comments provide overview, then link to detailed docs.

**RECOMMENDED: Hybrid Approach**

```typescript
/**
 * Contacts Controller
 *
 * Cache-first pattern for fast contact lookups with LRU eviction.
 * Cross-tab sync via BroadcastService for real-time updates.
 *
 * @see docs/architecture/data-system-overview.md - Complete data flow
 * @see docs/architecture/conversation-index-architecture.md - Index pattern
 */
```

**Design Pattern Comments:**

```typescript
// Singleton pattern: All useContacts() instances share same reactive state
const contacts = ref<Contact[]>([]);

// Observer pattern: Broadcast service notifies all tabs of changes
broadcast.notify('contact', contactId, 'update');
```

**Convention Deviation Comments:**

```typescript
// Deviation: Using Map instead of reactive ref for performance
// Standard pattern uses ref([]), but Map.get() is O(1) vs array O(n)
// Trade-off: Manual reactivity tracking required
const cache = new Map<string, Contact>();
```

### Rule 9: External Links - Context + Summary

External links (Stack Overflow, GitHub, RFCs) are acceptable if they provide context. Include summary in case link breaks.

```typescript
// ✅ GOOD - Link with context
/**
 * Parse timezone offset from UTC string
 * Uses regex instead of Intl.DateTimeFormat due to Safari 15 bug
 * @see https://bugs.webkit.org/show_bug.cgi?id=236168
 * Fallback: returns 0 for invalid input
 */
function parseTimezoneOffset(timeZone: string): number {
```

```typescript
// ✅ GOOD - GitHub issue with summary
// Workaround for Dexie transaction deadlock in Safari
// TODO: Remove when https://github.com/dexie/Dexie.js/issues/1234 is fixed
// Issue: Nested transactions fail in Safari 15-16
```

**When External Links are Acceptable:**

- Stack Overflow: Include summary of solution
- GitHub issues: YOUR project issues with brief context
- RFCs/Standards: W3C, TC39, ECMAScript specs
- Library docs: For limitations or workarounds

```typescript
// ❌ BAD - Link without context
// @see https://stackoverflow.com/questions/12345678
function parseDate(input: string): Date {
```

### Rule 10: Pre-commit Hook Validation

A pre-commit hook validates comments against temporal/plan references before commits.

**Detected Patterns:**

- Phase/Task/Step numbers without doc links
- Date references without context ("as of Q4 2024")
- Vague temporal references ("recently added", "will be removed soon")
- "Temporary fix" without TODO + issue link

**Hook Output Example:**

```bash
❌ Pre-commit check failed: Stale comment patterns detected

  src/composables/useExample.ts:45
  Issue: Phase/Task reference without documentation link
  Found: // Phase 7: Moved to controller pattern
  Fix: Add @see docs/architecture/phase-7-migration.md

  src/utils/helpers.ts:123
  Issue: Temporal reference without context
  Found: // Added in Q4 2024 for bug fix
  Fix: Explain WHY or link to issue/bug report
```

## File Organization Comments

### Section Dividers

Use clear visual separation for large files:

```typescript
// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserOption {
  label: string;
  value: string;
}

// ============================================================================
// MAIN COMPOSABLE
// ============================================================================

export function useUserSelection() {
```

### File-Level Documentation

Every module starts with purpose explanation:

```typescript
/**
 * Timestamp formatting utilities
 * Converts ISO timestamps and Date objects to human-readable formats
 * Supports relative time (e.g., "2 hours ago"), absolute dates, and timezone-aware displays
 */

import { format, parseISO } from 'date-fns';
```

## Examples from Codebase

### ✅ Excellent Examples

**useTimestampFormat.ts** - Perfect function documentation:

```typescript
/**
 * Format timestamp as relative time (e.g., "2 hours ago", "Yesterday")
 * Falls back to abbreviated date for older timestamps
 * @param timestamp - ISO string or Date object
 * @returns Human-readable relative time string
 */
function formatRelative(timestamp: string | Date): string {
```

**useContacts.ts** - Perfect architecture overview:

```typescript
/**
 * Contacts Controller
 *
 * Manages contact profiles and metadata for universal search and lookup operations.
 * Contacts are a separate aggregate root containing user profile information.
 *
 * Architecture:
 * - Cache-first pattern for fast reads
 * - IndexedDB for persistence
 * - Sync events for cross-tab updates
 * - Reactive state with Vue 3 composition API
 */
```

**useUserSelection.ts** - Clear section dividers:

```typescript
// ============================================================================
// DEPENDENCIES
// ============================================================================

const router = useRouter();
const userStore = useUserStore();
```

### ❌ Violations to Fix

**Phase/Task References:**

```typescript
// ❌ BAD
// Phase 7: Moved from Pinia to controller pattern
const contacts = useContacts();

// ✅ FIXED
/**
 * Load contacts via controller (cache-first pattern)
 * @see docs/architecture/controller-migration.md
 */
const contacts = useContacts();
```

**Temporal References:**

```typescript
// ❌ BAD
// Added in Q4 2024 to fix sync bug
function syncContacts() {

// ✅ FIXED
/**
 * Sync contacts across tabs via BroadcastChannel
 * Workaround: Safari requires manual invalidation
 * @see docs/bugs/safari-broadcast-issue.md
 */
function syncContacts() {
```

**Removed Logic Comments:**

```typescript
// ❌ BAD
// Old Pinia implementation (removed Phase 7)
// const contactsData = dataStore.contactsData;

// ✅ FIXED
// [delete the comment entirely]
```

## Pre-commit Hook Integration

Add to `.husky/pre-commit` or similar:

```bash
# Check for stale comment patterns
node scripts/checkCommentQuality.js
if [ $? -ne 0 ]; then
  echo "❌ Comment quality check failed"
  exit 1
fi
```

**Script Example:**

```javascript
// scripts/checkCommentQuality.js
const patterns = [
  /Phase \d+/gi,
  /Task \d+/gi,
  /Step \d+\.?\d*/gi,
  /as of \w+ \d{4}/gi,
  /added in \w+ \d{4}/gi,
  /recently added/gi,
];

// Allow if comment has @see or TODO with link
const hasProperReference = line => {
  return /@see docs\//.test(line) || /TODO:.*docs\//.test(line) || /TODO:.*https:\/\//.test(line);
};
```

## Comment Anti-Patterns

### ❌ Commenting Out Code

```typescript
// ❌ BAD - Don't comment out code
// function oldImplementation() {
//   return 'deprecated';
// }

// ✅ GOOD - Just delete it (git preserves history)
```

### ❌ Obvious Comments

```typescript
// ❌ BAD - Comment restates code
// Set user ID to newValue
userId.value = newValue;

// ✅ GOOD - No comment needed (self-evident)
userId.value = newValue;
```

### ❌ Plan Progress Comments

```typescript
// ❌ BAD - Leaves breadcrumbs about implementation order
// Step 1: Load contacts from IndexedDB
const contacts = await loadContacts();
// Step 2: Filter active contacts
const active = contacts.filter(c => c.status === 'active');

// ✅ GOOD - Just explain the "what" if not obvious
// Load all contacts, then filter to active status only
const contacts = await loadContacts();
const active = contacts.filter(c => c.status === 'active');
```

### ❌ Lengthy Architecture Essays

```typescript
// ❌ BAD - Multi-paragraph explanation belongs in docs
/**
 * Contacts Controller
 *
 * We originally used Pinia for all contact data, but in Phase 7 we migrated
 * to a cache-first controller pattern because Pinia had performance issues
 * with large datasets (10,000+ contacts). The controller uses an LRU cache
 * which we sized to 200 entries based on extensive performance testing across
 * multiple user scenarios. We benchmarked memory usage and found that...
 * [20 more lines of historical context]
 */

// ✅ GOOD - Terse overview + doc link
/**
 * Contacts Controller - Cache-first pattern with LRU eviction
 * @see docs/architecture/controller-pattern.md
 */
```

## Quick Reference

**Comment Placement:**

- File-level: Module purpose and overview
- Public APIs: Complete TSDoc with @param/@returns/@see
- Internal functions: Brief single-line or multi-line
- Inline: Only for non-obvious logic

**Required Tags:**

- `@param` - All public function parameters
- `@returns` - All public function return values
- `@see` - Links to docs for architecture/design details
- `@deprecated` - Mark deprecated code with migration path

**Optional Tags:**

- `@example` - Show usage examples for complex APIs
- `@throws` - Document exceptions/errors thrown

**Comment Length:**

- Single-line: `// Brief explanation`
- Multi-line: `/** Purpose + details */`
- Section dividers: `// ===== SECTION NAME =====`
- Move to docs if: >5 lines, historical context, benchmarks, decisions

---

**Remember**: Comments document current state, not history. Plan progress belongs in docs/plans/, not code. Use pre-commit hooks to catch stale references before they enter the codebase.
