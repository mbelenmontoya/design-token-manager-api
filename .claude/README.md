# Claude Code Skills for Design Token Manager API

This directory contains Claude Code skills that auto-activate based on context to help maintain code quality and enforce best practices.

## 🎯 Available Skills

### **api-development-standards** ⭐ (Custom)
**Purpose:** Enforces Express/Prisma/multi-tenant patterns specific to this API

**Auto-activates when:**
- Creating/modifying controllers, routes, or middleware
- Working with database operations (Prisma/DAL)
- Implementing authentication or authorization
- Multi-tenant data operations

**Key enforcements:**
- Multi-tenant data isolation (CRITICAL)
- DAL usage (never direct Prisma in controllers)
- Controller structure and error handling
- Middleware ordering (auth → tenant context → authorization → validation)
- Consistent API responses

---

### **code-comment-standards**
**Purpose:** Maintains clean, maintainable code comments

**Auto-activates when:**
- Writing comments or documentation
- Adding JSDoc/TSDoc
- Code contains temporal references (Phase X, Task Y)

**Key rules:**
- Document current functionality only
- Remove "Phase/Task/Step" references
- Focus on "what" not lengthy "why"
- Use JSDoc for public APIs
- Link to docs for architecture details

---

### **project-planning**
**Purpose:** Creates standardized project plan documents

**Auto-activates when:**
- User mentions "plan" or "planning"
- Creating feature specifications
- Breaking down complex tasks

**Creates plans in:** `/docs/plans/`

**Format:**
- Sequential numbering (no decimals: 1.1, 1.2)
- Phase completion summaries
- Success criteria and constraints
- Clear, scannable structure

---

### **step-by-step-execution**
**Purpose:** Methodical implementation to prevent breaking changes

**Auto-activates when:**
- User mentions "step by step", "carefully", "methodically"
- Implementing features with dependencies
- Refactoring or fixing bugs

**Workflow:**
1. Plan → Present plan
2. Propose → Show pros/cons
3. Execute → One step at a time
4. Test → Verify before continuing

**User controls:**
- "Proceed" - next step only
- "Proceed with all" - batch execution
- "Stop at X" - partial batch

---

### **skill-developer** (Meta-Skill)
**Purpose:** Helps create and manage Claude Code skills

**Auto-activates when:**
- Working with skill system
- Modifying skill-rules.json
- Creating new skills

**Use this to:**
- Learn skill structure
- Understand trigger patterns
- Debug skill activation

---

## 📁 Directory Structure

```
.claude/
├── skills/
│   ├── api-development-standards/   # Custom for this API
│   ├── code-comment-standards/
│   ├── project-planning/
│   ├── step-by-step-execution/
│   ├── skill-developer/
│   └── skill-rules.json             # Trigger configuration
├── hooks/
│   ├── skill-activation-prompt.ts   # Auto-suggests skills
│   ├── package.json
│   └── state/                       # Session tracking
├── settings.json                    # Hook registration
└── README.md                        # This file

docs/
└── plans/                           # Plan documents go here
```

## 🚀 How Skills Work

### Automatic Activation

Skills automatically suggest themselves based on:

1. **Keywords** in your prompts ("controller", "database", "plan")
2. **Intent patterns** (regex matching actions like "create route")
3. **File paths** you're editing (src/controllers/, src/routes/)
4. **Code content** (import statements, function patterns)

### Skill Activation Hook

The `skill-activation-prompt.ts` hook runs **before** Claude sees your prompt and injects context about relevant skills.

**Example:**
```
You: "Create a new token controller"
↓ (Hook runs)
Hook: "⚠️ Skills available: api-development-standards, step-by-step-execution"
↓
Claude receives: Your prompt + skill suggestions
```

### Enforcement Levels

- **suggest**: Advisory only - Claude is aware of the skill
- **block**: Must use skill before proceeding (not currently used)

## 🛠️ Configuration

### skill-rules.json

Controls when skills activate. Each skill has:

```json
{
  "skill-name": {
    "type": "domain" | "guardrail",
    "enforcement": "suggest" | "block",
    "priority": "critical" | "high" | "medium" | "low",
    "promptTriggers": {
      "keywords": ["list", "of", "keywords"],
      "intentPatterns": ["regex patterns"]
    },
    "fileTriggers": {
      "pathPatterns": ["src/**/*.js"],
      "contentPatterns": ["import.*?databaseService"]
    }
  }
}
```

### Customizing Triggers

To make skills more/less sensitive:

**More sensitive** (activate more often):
- Add more keywords
- Broaden intent patterns
- Widen path patterns

**Less sensitive** (activate less often):
- Remove keywords
- Make patterns more specific
- Narrow path patterns

## 📝 Creating Custom Skills

Use the **skill-developer** skill to create new skills:

1. Create directory: `.claude/skills/your-skill-name/`
2. Create `SKILL.md` with frontmatter:
```markdown
---
name: your-skill-name
description: Brief description with trigger keywords
---

# Your Skill

## Purpose
What this skill does

## When to Use
Auto-activation scenarios
```

3. Add entry to `skill-rules.json`
4. Test activation

## 🧪 Testing Skills

### Manual Hook Test

```bash
# Test if hook works
echo '{"session_id":"test","prompt":"create a controller"}' | \
  npx tsx .claude/hooks/skill-activation-prompt.ts
```

### Verify Installation

```bash
# Check structure
ls -la .claude/skills/

# Validate skill-rules.json
cat .claude/skills/skill-rules.json | jq .

# Check hooks
ls -la .claude/hooks/
```

### Debug Skill Activation

If a skill isn't activating:
1. Check `skill-rules.json` syntax (use `jq` to validate)
2. Verify skill directory exists in `.claude/skills/`
3. Check keywords match your prompts
4. Verify file path patterns match your files
5. Check hooks are registered in `.claude/settings.json`

## 💡 Tips for Effective Use

### For api-development-standards
- Activates automatically when working with controllers/routes
- **Critical**: Always enforces multi-tenant isolation
- Reference it when unsure about controller structure

### For code-comment-standards
- Helps during code reviews
- Catches temporal references before commit
- Use when documenting complex logic

### For project-planning
- Say "create a plan" to activate
- Plans saved in `/docs/plans/`
- Follow template structure

### For step-by-step-execution
- Say "let's do this step by step"
- Great for complex refactoring
- Prevents breaking changes with incremental testing

## 🔧 Maintenance

### Updating Skills

1. Edit skill's `SKILL.md` file
2. Update triggers in `skill-rules.json` if needed
3. Test activation

### Disabling Skills Temporarily

Edit `.claude/settings.json`:
```json
{
  "hooks": {
    "userPromptSubmit": [
      {
        "enabled": false  // ← Set to false
      }
    ]
  }
}
```

Or set environment variable:
```bash
export SKIP_SKILL_GUARDRAILS=true
```

### Removing Skills

1. Delete skill directory: `.claude/skills/skill-name/`
2. Remove entry from `skill-rules.json`

## 📚 Further Reading

- `.claude/skills/skill-developer/SKILL.md` - Complete skill development guide
- `.claude/skills/skill-developer/TRIGGER_TYPES.md` - All trigger types
- `.claude/skills/skill-developer/TROUBLESHOOTING.md` - Debug guide

---

**Skills Status:** ✅ Installed and configured for Design Token Manager API
**Last Updated:** November 2025
