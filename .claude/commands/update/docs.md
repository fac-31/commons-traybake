---
description: Check all project documentation and update accordingly
argument-hint: [reason for update]
# allowed-tools:
# model: claude-sonnet-4-5-20250929
disable-model-invocation: false
---
<UpdateDocsCommand>
  <Task>Check files referenced in `UpdateDocsCommand/Documents` and make sure they are up to date with the current state of the codebase</Task>
  <Documents>
    <Doc i="0" path="$ARGUMENTS" type="ignore if path==null" />
    <Doc i="1" path="README.md" type="user" />
    <Doc i="2" path="docs/project-plan.md" type="user" />
    <Doc i="3" path="docs/low-tech-project-description.md" type="user" />
    <Doc i="4" path="docs/api-testing-guide.md" type="user" />
    <Doc i="5" path="docs/PARLIAMENT_API_GUIDE.md" />
  </Documents>
</UpdateDocsCommand>
