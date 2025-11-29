# Common Patterns Library

Ready-to-use regex and glob patterns for skill triggers. Copy and customize for your skills.

---

## Intent Patterns (Regex)

### Feature/Endpoint Creation

```regex
(add|create|implement|build).*?(feature|endpoint|route|service|controller)
```

### Component Creation

```regex
(create|add|make|build).*?(component|UI|page|modal|dialog|form)
```

### Data Management

```regex
(add|create|modify|update).*?(data|cache|store|index)
(IndexedDB|cache|storage).*?(change|update|query)
```

### Error Handling

```regex
(fix|handle|catch|debug).*?(error|exception|bug)
(add|implement).*?(try|catch|error.*?handling)
```

### Explanation Requests

```regex
(how does|how do|explain|what is|describe|tell me about).*?
```

### Workflow Operations

```regex
(create|add|modify|update).*?(workflow|step|branch|condition)
(debug|troubleshoot|fix).*?workflow
```

### Testing

```regex
(write|create|add).*?(test|spec|unit.*?test)
```

---

## File Path Patterns (Glob)

### Frontend

```glob
src/**/*.vue                 # All Vue components
src/**/*.ts                  # All TypeScript files
src/components/**            # Only components directory
```

### Backend Services

```glob
form/src/**/*.ts            # Form service
email/src/**/*.ts           # Email service
users/src/**/*.ts           # Users service
projects/src/**/*.ts        # Projects service
```

### Data Layer

```glob
src/data/**/*.json           # Data JSON files
src/services/cacheService.ts # IndexedDB service
src/adapters/**/*.ts         # Data adapters
```

### Workflows

```glob
form/src/workflow/**/*.ts              # Workflow engine
form/src/workflow-definitions/**/*.json # Workflow definitions
```

### Test Files

```glob
tests/**/*.test.ts           # Unit tests in tests directory
tests/**/*.spec.ts           # Spec files in tests directory
src/**/*.test.ts             # Component-adjacent tests
```

---

## Content Patterns (Regex)

### IndexedDB/Data

```regex
import.*cache                    # Cache imports
cacheService                     # Cache service usage
cache\.                          # cache.something
\.toArray\(                      # Dexie query methods
\.where\(
\.put\(
\.delete\(
```

### Controllers/Routes

```regex
export class.*Controller         # Controller classes
router\.                         # Express router
app\.(get|post|put|delete|patch) # Express app routes
```

### Error Handling

```regex
try\s*\{                        # Try blocks
catch\s*\(                      # Catch blocks
throw new                        # Throw statements
```

### Vue/Components

```regex
<script setup                   # Vue script setup
defineProps                     # Vue props definition
defineEmits                     # Vue emits definition
ref\(|computed\(|watch\(        # Vue composition API
```

---

**Usage Example:**

```json
{
  "my-skill": {
    "promptTriggers": {
      "intentPatterns": ["(create|add|build).*?(component|UI|page)"]
    },
    "fileTriggers": {
      "pathPatterns": ["src/**/*.vue"],
      "contentPatterns": ["<script setup", "defineProps|defineEmits"]
    }
  }
}
```

---

**Related Files:**

- [SKILL.md](SKILL.md) - Main skill guide
- [TRIGGER_TYPES.md](TRIGGER_TYPES.md) - Detailed trigger documentation
- [SKILL_RULES_REFERENCE.md](SKILL_RULES_REFERENCE.md) - Complete schema
