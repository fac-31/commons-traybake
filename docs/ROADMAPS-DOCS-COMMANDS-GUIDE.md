# Roadmaps, Docs & Slash Commands Guide

This guide explains the three-part documentation and automation system in commons-traybake and how they work together to maintain project knowledge and streamline development workflows.

---

## Overview: The Three Pillars

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  ROADMAPS   │◄──────│   SLASH     │──────►│    DOCS     │
│             │       │  COMMANDS   │       │             │
│ Track MVPs  │       │  Automate   │       │ Explain     │
│ & tasks     │       │  updates    │       │ concepts    │
└─────────────┘       └─────────────┘       └─────────────┘
      ▲                      │                      ▲
      │                      │                      │
      └──────────────────────┴──────────────────────┘
              All sync with codebase state
```

### 1. **Roadmaps** (`docs/roadmap/*.md`)
Living documents that track progress on MVP milestones and tasks. They automatically update based on codebase state.

### 2. **Docs** (`docs/*.md`)
Reference guides explaining concepts, APIs, and architectural decisions. They provide context and onboarding material.

### 3. **Slash Commands** (`.claude/commands/*/*.md`)
Automated workflows that keep roadmaps and docs synchronized with the actual code. They're the glue that makes everything work together.

---

## Part 1: Roadmaps

### What Are Roadmaps?

Roadmaps are structured Markdown files that track MVP development progress. Each roadmap follows a standard template with four main sections:

```markdown
## 1. Tasks
### 1.1. Open Tasks
  #### 1.1.1. Due Tasks
  #### 1.1.2. Other Tasks
### 1.2. Blocked Tasks

## 2. MVP Milestones

## 3. Beyond MVP: Future Features

## 4. Work Record
### 4.1. Completed Milestones
### 4.2. Completed Tasks
  #### 4.2.1. Record of Past Deadlines
  #### 4.2.2. Record of Other Completed Tasks
```

### Current Roadmaps

Located in `docs/roadmap/`:

1. **`README.md`** - Aggregate view of all roadmap status
2. **`Agents-MVP.md`** - Slash commands, documentation automation, roadmap workflows
3. **`Gov-API-MVP.md`** - Parliament API integration, Hansard data ingestion
4. **`Chunking-MVP.md`** - Four RAG chunking strategies (semantic + late chunking)
5. **`Neo4j-MVP.md`** - Vector database, hybrid indexing, comparative search
6. **`Ui-MVP.md`** - SvelteKit frontend, comparative visualization

### Roadmap Lifecycle

```
┌──────────────┐
│  New Task    │
│  Added to    │
│  1.1.1/1.1.2 │
└──────┬───────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐
│ If blocked   │─────►│  Moved to    │
│              │      │  1.2         │
└──────┬───────┘      └──────────────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐
│ When done    │─────►│  Moved to    │
│              │      │  4.2.1/4.2.2 │
└──────────────┘      └──────────────┘

┌──────────────┐      ┌──────────────┐
│  Milestone   │─────►│  When done,  │
│  in Section  │      │  moved to    │
│  2           │      │  4.1         │
└──────────────┘      └──────────────┘
```

### Task Migration Rules

Slash commands automatically migrate tasks based on codebase state:

| From Section | To Section | Trigger Condition |
|--------------|------------|-------------------|
| 1.1.1 (Due) | 4.2.1 | Task completed |
| 1.1.2 (Other) | 4.2.2 | Task completed |
| 1.2 (Blocked) | 4.2.2 | Blocker resolved AND task completed |
| 1.2 (Blocked) | 1.1.2 | Blocker resolved BUT task not done |
| 2 (Milestones) | 4.1 | Milestone criteria met in code |

---

## Part 2: Documentation

### What Are Docs?

Documentation files explain concepts, provide guides, and help developers understand the system. Unlike roadmaps (which track progress), docs explain **how** and **why** things work.

### Current Documentation

| File | Purpose | Audience |
|------|---------|----------|
| `README.md` | Project overview, quick start | Everyone |
| `CLAUDE.md` | Instructions for Claude Code AI | Claude Code |
| `project-plan.md` | Overall project architecture | Technical team |
| `low-tech-project-description.md` | Non-technical explanation | Non-developers |
| `PARLIAMENT_API_GUIDE.md` | Parliament API endpoints & usage | Backend developers |
| `neo4j-setup-guide.md` | Vector database configuration | Data engineers |
| `api-testing-guide.md` | API testing with Bruno | QA/developers |
| `roadmap/README.md` | Aggregate roadmap status | Project managers |

### Documentation Principles

1. **Reference not redundancy** - Link to code examples instead of duplicating
2. **Context over commands** - Explain why, not just what
3. **Assume intelligence** - Target developers with 3+ years experience
4. **Stay current** - Use `/update:docs` to sync with code changes
5. **Show trade-offs** - Document the architectural choices and their implications

### When to Create New Docs

- New major feature with non-obvious architecture
- External API integration requiring authentication/setup
- Conceptual explanation (like this guide!)
- Onboarding material for new team members

**Don't create docs for:**
- Simple utility functions (use inline code comments)
- Standard npm commands (they're obvious)
- Implementation details that change frequently

---

## Part 3: Slash Commands

### What Are Slash Commands?

Slash commands are automated workflows stored in `.claude/commands/` that Claude Code can execute. They're written as Markdown files with YAML frontmatter defining their behavior.

### Command Structure

```markdown
---
description: What this command does
argument-hint: [param1] [param2]
model: claude-sonnet-4-5-20250929
disable-model-invocation: false
---

<CommandName>
  <Task>High-level goal</Task>
  <Steps>Detailed workflow</Steps>
</CommandName>
```

### Available Commands by Category

#### Roadmap Management
- **`/update:roadmaps:all`** - Update all active roadmaps by checking codebase state
- **`/update:roadmaps:chain [child] [parent] [reason]`** - Update specific roadmap pair

#### Documentation
- **`/update:docs [reason]`** - Sync all documentation with current code

#### Task Planning
- **`/task:plan:create [outcome]`** - Generate detailed implementation plan
- **`/task:suggest:focussed-task [focus]`** - Suggest next logical task
- **`/task:execute:minima [outcome]`** - Minimalist approach to achieve goal

#### Git Helpers
- **`/git:pull-request [note]`** - Create PR for current branch
- **`/git:conventional-commit`** - Create conventional commit (not currently active)

#### Project Analysis
- **`/project:analyse:explain [focus]`** - Detailed codebase overview
- **`/project:analyse:critique [focus]`** - Find weaknesses and issues

#### Style Utilities
- **`/style:fix-layout [issues]`** - Fix CSS/layout problems
- **`/style:unify-style [component]`** - Match styling to project patterns

### How Slash Commands Work

1. **User invokes command**: `/update:roadmaps:all`
2. **Claude reads the command file**: `.claude/commands/update/roadmaps/all.md`
3. **XML workflow executes**: Steps defined in command file
4. **Tools are used**: Read/Edit/Bash/Grep as needed
5. **Report generated**: Summary of changes made

### Command Execution Flow

```
User types: /update:roadmaps:all
            │
            ▼
    ┌───────────────────┐
    │ Parse command     │
    │ Load all.md       │
    └────────┬──────────┘
             │
             ▼
    ┌───────────────────┐
    │ Read roadmap files│
    │ Check codebase    │
    └────────┬──────────┘
             │
             ▼
    ┌───────────────────┐
    │ Migrate tasks     │
    │ Update milestones │
    └────────┬──────────┘
             │
             ▼
    ┌───────────────────┐
    │ Update README.md  │
    │ Report changes    │
    └───────────────────┘
```

---

## How They Work Together

### Scenario 1: Feature Implementation

```
1. Developer: "I want to add authentication"

2. Use: /task:plan:create authentication system
   → Creates detailed plan
   → Identifies affected files
   → Suggests implementation order

3. Add task to roadmap: Open relevant MVP roadmap
   → Add to section 1.1.1 or 1.1.2

4. Implement feature: Write code

5. Use: /update:roadmaps:all
   → Scans codebase
   → Detects auth implementation
   → Moves task from 1.1.x to 4.2.x
   → Updates README.md with progress

6. Use: /update:docs
   → Checks if docs need updates
   → May prompt to create auth guide
```

### Scenario 2: MVP Milestone Completion

```
1. Work on chunking features
   → Tasks tracked in Chunking-MVP.md section 1.x

2. Complete all tasks for milestone
   → Code now implements all chunking strategies

3. Run: /update:roadmaps:all
   → Reads Chunking-MVP.md section 2 (Milestones)
   → Checks codebase for completion criteria
   → Finds all 4 strategies implemented
   → Moves milestone from section 2 to 4.1
   → Updates README.md "Recent Wins"

4. Run: /update:docs
   → Syncs CLAUDE.md with new capabilities
   → Updates project-plan.md if architecture changed
```

### Scenario 3: Documentation Drift

```
1. Someone adds new Parliament API endpoints
   → Code changes but docs don't

2. Week later: /update:docs Parliament API changes
   → Reads PARLIAMENT_API_GUIDE.md
   → Greps codebase for API calls
   → Finds new endpoints in code
   → Updates guide with new endpoints
   → Reports what changed

3. Alternatively: /project:analyse:explain Parliament API
   → Generates fresh explanation from code
   → Compare with existing guide
   → Identify gaps
```

### Scenario 4: Roadmap Chain Updates

When a parent roadmap depends on child roadmap:

```
1. Complete task in child roadmap (e.g., Chunking-MVP.md)

2. Use: /update:roadmaps:chain Chunking-MVP.md Agents-MVP.md "completed chunking validation"
   → Updates both roadmaps
   → Checks if child completion unblocks parent tasks
   → Moves completed tasks in both
   → Updates main README.md
```

---

## Best Practices

### For Roadmaps

✅ **DO:**
- Keep tasks specific and measurable
- Use roadmaps for tracking progress, not planning architecture
- Run `/update:roadmaps:all` after completing significant work
- Document completion criteria clearly in milestones
- Use "Blocked Tasks" section for dependencies

❌ **DON'T:**
- Put implementation details in roadmaps (use docs for that)
- Manually move tasks between sections (let slash commands do it)
- Create roadmaps for every tiny feature (MVP focus only)
- Let roadmaps drift - sync regularly

### For Documentation

✅ **DO:**
- Explain architectural decisions and trade-offs
- Link to specific code files with line numbers where relevant
- Update docs when you change related code
- Write for developers with 3+ years experience
- Include "why" not just "what"

❌ **DON'T:**
- Duplicate information that's already in code comments
- Over-document trivial functions
- Write docs that will be outdated in a week
- Forget to run `/update:docs` after major changes

### For Slash Commands

✅ **DO:**
- Use slash commands for repetitive workflows
- Create new commands for project-specific patterns
- Test commands on small changes first
- Review command output before committing
- Use `/project:analyse:explain` when onboarding to new areas

❌ **DON'T:**
- Blindly trust automated updates (review changes!)
- Use commands for one-off tasks
- Skip reading what the command actually does
- Forget to update command files when project structure changes

---

## Creating Your Own Slash Commands

### Command File Location

```
.claude/commands/
  ├── category/
  │   ├── subcategory/
  │   │   └── command-name.md
```

Example: `.claude/commands/test/run-validation.md`

### Basic Template

```markdown
---
description: One-line description (shows in command list)
argument-hint: [param1] [param2]
model: claude-sonnet-4-5-20250929
disable-model-invocation: false
---

<CommandName>
  <Task>
    High-level goal of this command
  </Task>

  <Steps>
    <Step i="0" name="preparation">
      Describe what happens first
    </Step>
    <Step i="1" name="execution">
      Main work happens here
    </Step>
    <Step i="2" name="reporting">
      Tell user what changed
    </Step>
  </Steps>

  <Rules>
    - Important constraint 1
    - Important constraint 2
  </Rules>
</CommandName>
```

### Advanced: Commands with Loops

For roadmap updates that process multiple files:

```markdown
<Steps>
  <Step i="0" name="loop through files">
    For each file in Files/File/@active="true",
    run Loop/@i="0"
  </Step>
</Steps>

<Files>
  <File i="0" active="true" path="docs/roadmap/First-MVP.md" />
  <File i="1" active="true" path="docs/roadmap/Second-MVP.md" />
</Files>

<Loops>
  <Loop i="0">
    <Task i="0" origin="1.1" target="4.2">
      Check for completed tasks, move to archive
    </Task>
  </Loop>
</Loops>
```

---

## Troubleshooting

### "Roadmap out of sync with code"

**Solution:** Run `/update:roadmaps:all`

This scans the codebase and migrates tasks based on actual implementation status.

### "Documentation mentions old API endpoints"

**Solution:** Run `/update:docs Parliament API changes`

This checks docs against current code and suggests updates.

### "Don't know what to work on next"

**Solutions:**
1. Check `docs/roadmap/README.md` for incomplete milestones
2. Run `/task:suggest:focussed-task` for AI suggestions
3. Look in individual roadmaps section 1.1.1 (Due Tasks)

### "Slash command not working"

**Check:**
1. Command file exists in `.claude/commands/`
2. YAML frontmatter is valid
3. XML structure is well-formed
4. You're using the correct argument syntax

### "Want to understand a complex part of codebase"

**Solution:** Run `/project:analyse:explain chunking strategies`

This generates a detailed explanation based on actual code.

---

## Quick Reference

### Common Workflows

| Task | Commands to Run |
|------|----------------|
| Just completed a feature | `/update:roadmaps:all` |
| About to start new feature | `/task:plan:create [feature name]` |
| Changed API implementation | `/update:docs [API name]` |
| Onboarding to new area | `/project:analyse:explain [area]` |
| Creating PR | `/git:pull-request [context note]` |
| Need next task | `/task:suggest:focussed-task` |
| Major refactor done | `/update:roadmaps:all` then `/update:docs` |

### File Locations

```
commons-traybake/
├── .claude/
│   ├── CLAUDE.md                  # Project context for Claude
│   └── commands/                  # Slash commands
│       ├── git/
│       ├── project/analyse/
│       ├── style/
│       ├── task/
│       └── update/
├── docs/
│   ├── roadmap/
│   │   ├── README.md             # Aggregate status
│   │   ├── Agents-MVP.md
│   │   ├── Chunking-MVP.md
│   │   ├── Gov-API-MVP.md
│   │   ├── Neo4j-MVP.md
│   │   └── Ui-MVP.md
│   ├── templates/
│   │   └── Roadmap-MVP.md        # Template for new roadmaps
│   ├── PARLIAMENT_API_GUIDE.md
│   ├── neo4j-setup-guide.md
│   ├── api-testing-guide.md
│   └── project-plan.md
└── README.md                      # Main project readme
```

### Section Numbers Quick Reference

**Roadmap Sections:**
- `1.1.1` - Open tasks (due)
- `1.1.2` - Open tasks (other)
- `1.2` - Blocked tasks
- `2` - MVP milestones
- `3` - Future features
- `4.1` - Completed milestones
- `4.2.1` - Completed tasks (previously due)
- `4.2.2` - Completed tasks (other)

---

## Philosophy

This system embodies three key principles:

### 1. **Code is Truth**
Roadmaps and docs should reflect what's actually implemented, not wishful thinking. Slash commands enforce this by checking codebase state.

### 2. **Automation Reduces Drift**
Manual synchronization fails. Automated workflows (`/update:*` commands) keep documentation honest.

### 3. **Context for AI, Clarity for Humans**
`.claude/CLAUDE.md` gives Claude Code project context. Roadmaps give Claude progress tracking. Together they enable AI to work more effectively while keeping humans informed.

---

## Examples from This Project

### Example 1: Chunking MVP Completion

**Before:**
```markdown
## 2. MVP Milestones
- [ ] Implement semantic chunking (1024 and 256 token variants)
- [ ] Implement late chunking (1024 and 256 token variants)
- [ ] Create validation suite
```

**After `/update:roadmaps:all`:**
```markdown
## 2. MVP Milestones
All MVP milestones complete! 🎉

## 4.1. Completed Milestones
- **Semantic Chunking** ✅ - Both 1024 and 256 token variants...
- **Late Chunking** ✅ - Both variants with 70/30 blending...
- **Validation Suite** ✅ - 6-metric validation system...
```

### Example 2: Documentation Update

**Command:** `/update:docs Neo4j schema changes`

**Result:**
- Updated `neo4j-setup-guide.md` with dual-label system
- Added explanation of strategy-specific indexes
- Updated `CLAUDE.md` schema section
- Generated list of changed sections

### Example 3: Task Planning

**Command:** `/task:plan:create implement late chunking with contextual embeddings`

**Result:**
```markdown
## Implementation Plan: Late Chunking

### Phase 1: Core Implementation
1. Create late-chunking.ts in src/lib/processing/pipelines/
2. Implement full-debate embedding
3. Add 70/30 blending function

### Phase 2: Integration
4. Update pipeline-runner.ts
5. Add to Neo4j schema
6. Create strategy-specific vector index

### Phase 3: Validation
7. Add test suite
8. Compare with semantic strategies
9. Document in Chunking-MVP.md
```

---

## Extending the System

### Adding a New Roadmap

1. Copy `docs/templates/Roadmap-MVP.md`
2. Rename to `docs/roadmap/YourFeature-MVP.md`
3. Fill in milestones and tasks
4. Add to `.claude/commands/update/roadmaps/all.md` in `<Roadmaps>` section
5. Run `/update:roadmaps:all` to generate README entry

### Adding a New Doc Category

1. Create `docs/your-category/`
2. Add index.md or guide.md
3. Add to `/update:docs` command in `<Documents>` section
4. Link from main README.md

### Creating a Domain-Specific Command

For this project's parliamentary focus:

```markdown
---
description: Validate Hansard reference formatting
argument-hint: [file-to-check]
---

<ValidateHansard>
  <Task>Check all Hansard references match format</Task>
  <Steps>
    <Step i="0">Grep for hansard references in file</Step>
    <Step i="1">Validate format: HC Deb DD MMM YYYY vol NNN cNN</Step>
    <Step i="2">Report any malformed references</Step>
  </Steps>
</ValidateHansard>
```

---

## Conclusion

The roadmap-docs-commands trinity creates a **self-documenting, self-updating project**:

- **Roadmaps** track where you are
- **Docs** explain how things work
- **Slash commands** keep both synchronized with reality

This system is particularly valuable for:
- AI-assisted development (Claude Code stays context-aware)
- Onboarding new developers (clear project state + explanations)
- Avoiding documentation drift (automation enforces truth)
- Managing complex MVP milestones (structured progress tracking)

**Remember:** The system works best when you:
1. Commit code first
2. Run `/update:roadmaps:all`
3. Then run `/update:docs` if you changed architecture
4. Review the changes before committing docs

This ensures documentation always reflects implemented reality, not aspirational plans.
