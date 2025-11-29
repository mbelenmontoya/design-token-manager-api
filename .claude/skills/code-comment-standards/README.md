# Code Comment Standards - Quick Reference

## Overview

This skill enforces comment quality standards to keep code comments current, clear, and maintainable.

## Pre-commit Hook

The pre-commit hook (`scripts/checkCommentQuality.js`) runs automatically before every commit and blocks commits with:

### Detected Violations

1. **Phase/Task/Step References** - Plan progress numbers without doc links

   ```typescript
   // ❌ Phase 7: Moved to controller pattern
   // ✅ Cache-first pattern @see docs/architecture/controller-pattern.md
   ```

2. **Temporal References** - Date-based comments without context

   ```typescript
   // ❌ Added in Q4 2024 for bug fix
   // ✅ Workaround for Safari bug @see docs/bugs/safari-issue.md
   ```

3. **Vague References** - "Recently added", "will be removed soon"

   ```typescript
   // ❌ Recently added for optimization
   // ✅ Performance: Batch reads reduce overhead from 100ms to 5ms
   ```

4. **TODOs Without Links** - No connection to docs or issues
   ```typescript
   // ❌ TODO: Fix this later
   // ✅ TODO: Implement pagination @see docs/plans/pagination-plan.md
   ```

### Exceptions (Allowed)

These patterns bypass the checks:

- Comments with `@see docs/...`
- Comments with `@see https://...`
- Comments with GitHub issue links (`github.com`)
- Doc paths themselves (`docs/plans/`, `docs/phase-`)

## Manual Check

Run the checker manually on staged files:

```bash
node scripts/checkCommentQuality.js
```

## Testing

Test with violations:

```bash
# Create test file with violations
cat > test.ts << 'EOF'
// Phase 7: Test violation
// TODO: Fix later
function test() {}
EOF

# Stage and check
git add test.ts
node scripts/checkCommentQuality.js

# Clean up
git reset HEAD test.ts && rm test.ts
```

## Hook Execution Order

Pre-commit checks run in this order:

1. `checkSchemaVersion.js` - IndexedDB schema versioning
2. `checkSchemaFields.js` - Schema field justifications
3. `checkNoisyLogs.js` - Debug log signal-to-noise
4. **`checkCommentQuality.js`** - Comment standards (NEW)
5. `lint-staged` - ESLint + Prettier

## Fixing Violations

When the hook fails:

```bash
❌ Pre-commit check failed: Stale comment patterns detected

  src/example.ts:45
  Issue: Phase reference without documentation link
  Found: // Phase 7: Moved to controller pattern
  Fix: Add @see docs/architecture/... or remove phase reference
```

**Options:**

1. Remove the phase/task/step reference entirely
2. Add `@see docs/path/to/plan.md` after the comment
3. Move detailed explanation to docs and add brief "what" comment

## Comment Rules Summary

### ✅ GOOD Comments

```typescript
/**
 * Load contacts via cache-first pattern
 * @param contactIds - Array of contact UUIDs
 * @returns Array of Contact objects
 * @see docs/architecture/controller-pattern.md
 */
async function loadContacts(contactIds: string[]): Promise<Contact[]>;

// Performance: Batch reads reduce overhead from 100ms to 5ms
const contacts = await cache.contacts.where('id').anyOf(contactIds).toArray();

// TODO: Implement pagination for 10,000+ contacts
// @see docs/plans/contact-pagination-plan.md
function loadAllContacts() {}
```

### ❌ BAD Comments

```typescript
// Phase 7: Moved to controller pattern
// Task 35: Added cache invalidation
// Step 5.2: Initialize cache
// Added in Q4 2024 for bug fix
// Recently added for optimization
// TODO: Fix this later
// Temporary fix for Safari
```

## Integration with Claude

The skill automatically triggers when Claude:

- Edits files with comments
- Uses keywords: "comment", "TODO", "Phase", "Task"
- Detects plan references in code

Claude will be reminded of these standards before making changes.

## Files

- **Skill Definition**: `.claude/skills/code-comment-standards/SKILL.md`
- **Pre-commit Script**: `scripts/checkCommentQuality.js`
- **Hook Integration**: `.husky/pre-commit`
- **Skill Triggers**: `.claude/skills/skill-rules.json`

## See Also

- `.claude/skills/code-comment-standards/SKILL.md` - Complete rules
- `.claude/skills/debug-logger-enforcer/` - Debug logging standards
- `.claude/skills/log-signal-analyzer/` - Log noise detection
