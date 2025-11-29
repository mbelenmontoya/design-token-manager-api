# Trigger Types - Complete Guide

Complete reference for configuring skill triggers in Claude Code's skill auto-activation system.

## Table of Contents

- [Keyword Triggers (Explicit)](#keyword-triggers-explicit)
- [Intent Pattern Triggers (Implicit)](#intent-pattern-triggers-implicit)
- [File Path Triggers](#file-path-triggers)
- [Content Pattern Triggers](#content-pattern-triggers)
- [Best Practices Summary](#best-practices-summary)

---

## Keyword Triggers (Explicit)

### How It Works

Case-insensitive substring matching in user's prompt.

### Use For

Topic-based activation where user explicitly mentions the subject.

### Configuration

```json
"promptTriggers": {
  "keywords": ["layout", "grid", "toolbar", "submission"]
}
```

### Example

- User prompt: "how does the **layout** system work?"
- Matches: "layout" keyword
- Activates: `project-catalog-developer`

### Best Practices

- Use specific, unambiguous terms
- Include common variations ("layout", "layout system", "grid layout")
- Avoid overly generic words ("system", "work", "create")
- Test with real prompts

---

## Intent Pattern Triggers (Implicit)

### How It Works

Regex pattern matching to detect user's intent even when they don't mention the topic explicitly.

### Use For

Action-based activation where user describes what they want to do rather than the specific topic.

### Configuration

```json
"promptTriggers": {
  "intentPatterns": [
    "(create|add|implement).*?(feature|endpoint)",
    "(how does|explain).*?(layout|workflow)"
  ]
}
```

### Examples

**Data Management:**

- User prompt: "add user tracking feature"
- Matches: `(add).*?(feature)`
- Activates: `data-validation`, `error-tracking`

**Component Creation:**

- User prompt: "create a dashboard widget"
- Matches: `(create).*?(component)` (if component in pattern)
- Activates: `frontend-dev-guidelines`

### Best Practices

- Capture common action verbs: `(create|add|modify|build|implement)`
- Include domain-specific nouns: `(feature|endpoint|component|workflow)`
- Use non-greedy matching: `.*?` instead of `.*`
- Test patterns thoroughly with regex tester (https://regex101.com/)
- Don't make patterns too broad (causes false positives)
- Don't make patterns too specific (causes false negatives)

### Common Pattern Examples

```regex
# Database Work
(add|create|implement).*?(user|login|auth|feature)

# Explanations
(how does|explain|what is|describe).*?

# Frontend Work
(create|add|make|build).*?(component|UI|page|modal|dialog)

# Error Handling
(fix|handle|catch|debug).*?(error|exception|bug)

# Workflow Operations
(create|add|modify).*?(workflow|step|branch|condition)
```

---

## File Path Triggers

### How It Works

Glob pattern matching against the file path being edited.

### Use For

Domain/area-specific activation based on file location in the project.

### Configuration

```json
"fileTriggers": {
  "pathPatterns": [
    "src/**/*.vue",
    "src/**/*.ts"
  ],
  "pathExclusions": [
    "tests/**/*.test.ts",
    "tests/**/*.spec.ts"
  ]
}
```

### Glob Pattern Syntax

- `**` = Any number of directories (including zero)
- `*` = Any characters within a directory name
- Examples:
  - `src/**/*.vue` = All .vue files in src and subdirs
  - `**/cacheService.ts` = cacheService.ts anywhere in project
  - `src/components/**/*.vue` = All .vue files in components subdirs

### Example

- File being edited: `src/components/Dashboard.vue`
- Matches: `src/**/*.vue`
- Activates: `frontend-dev-guidelines`

### Best Practices

- Be specific to avoid false positives
- Use exclusions for test files: `**/*.test.ts`
- Consider subdirectory structure
- Test patterns with actual file paths
- Use narrower patterns when possible: `form/src/services/**` not `form/**`

### Common Path Patterns

```glob
# Frontend
src/**/*.vue                 # All Vue components
src/**/*.ts                  # All TypeScript files
src/components/**            # Only components directory

# Backend Services
form/src/**/*.ts            # Form service
email/src/**/*.ts           # Email service
users/src/**/*.ts           # Users service

# Data Layer
src/data/**/*.json          # Data JSON files
src/services/cacheService.ts # IndexedDB service
src/adapters/**/*.ts        # Data adapters

# Workflows
form/src/workflow/**/*.ts              # Workflow engine
form/src/workflow-definitions/**/*.json # Workflow definitions

# Test Files
tests/**/*.test.ts          # Unit tests in tests directory
tests/**/*.spec.ts          # Spec files in tests directory
src/**/*.test.ts            # Component-adjacent tests
```

---

## Content Pattern Triggers

### How It Works

Regex pattern matching against the file's actual content (what's inside the file).

### Use For

Technology-specific activation based on what the code imports or uses (Vue components, data services, specific libraries).

### Configuration

```json
"fileTriggers": {
  "contentPatterns": [
    "import.*cache",
    "cacheService",
    "\\.toArray\\(",
    "\\.where\\("
  ]
}
```

### Examples

**IndexedDB Detection:**

- File contains: `import { cacheService } from '@/services/cacheService'`
- Matches: `import.*cache`
- Activates: `data-validation`

**Controller Detection:**

- File contains: `export class UserController {`
- Matches: `export class.*Controller`
- Activates: `error-tracking`

### Best Practices

- Match imports: `import.*cache` (match common patterns)
- Escape special regex chars: `\\.toArray\\(` not `.toArray(`
- Patterns use case-insensitive flag
- Test against real file content
- Make patterns specific enough to avoid false matches

### Common Content Patterns

```regex
# IndexedDB/Data
import.*cache                    # Cache imports
cacheService                     # Cache service usage
cache\.                          # cache.something
\.toArray\(                      # Dexie query methods
\.where\(
\.put\(
\.delete\(

# Controllers/Routes
export class.*Controller         # Controller classes
router\.                         # Express router
app\.(get|post|put|delete|patch) # Express app routes

# Error Handling
try\s*\{                        # Try blocks
catch\s*\(                      # Catch blocks
throw new                        # Throw statements

# Vue/Components
<script setup                   # Vue script setup
defineProps                     # Vue props definition
defineEmits                     # Vue emits definition
ref\(|computed\(|watch\(        # Vue composition API
```

---

## Best Practices Summary

### DO:

✅ Use specific, unambiguous keywords
✅ Test all patterns with real examples
✅ Include common variations
✅ Use non-greedy regex: `.*?`
✅ Escape special characters in content patterns
✅ Add exclusions for test files
✅ Make file path patterns narrow and specific

### DON'T:

❌ Use overly generic keywords ("system", "work")
❌ Make intent patterns too broad (false positives)
❌ Make patterns too specific (false negatives)
❌ Forget to test with regex tester (https://regex101.com/)
❌ Use greedy regex: `.*` instead of `.*?`
❌ Match too broadly in file paths

### Testing Your Triggers

**Test keyword/intent triggers:**

```bash
echo '{"session_id":"test","prompt":"your test prompt"}' | \
  npx tsx .claude/hooks/skill-activation-prompt.ts
```

**Test file path/content triggers:**

```bash
cat <<'EOF' | npx tsx .claude/hooks/error-handling-reminder.ts
{
  "session_id": "test",
  "files_edited": ["/path/to/test/file.vue"]
}
EOF
```

---

**Related Files:**

- [SKILL.md](SKILL.md) - Main skill guide
- [SKILL_RULES_REFERENCE.md](SKILL_RULES_REFERENCE.md) - Complete skill-rules.json schema
- [PATTERNS_LIBRARY.md](PATTERNS_LIBRARY.md) - Ready-to-use pattern library
