---
description: Check all project documentation and update accordingly
argument-hint: [reason for update]
# allowed-tools:
# model: claude-sonnet-4-5-20250929
# disable-model-invocation: true
---
<UpdateDocsCommand>
  <Task>Check files referenced in `UpdateDocsCommand/Documents` and make sure they are up to date with the current state of the codebase</Task>
  <Documents>
    <Doc i="0" path="$ARGUMENTS" type="ignore if path==null" />
    <Doc i="1" path="README.md" type="user" />
    <Doc i="2" path="docs/About-Rhea.md" type="user" />
    <Doc i="3" path="docs/Executive-Summary.md" type="user" />
    <Doc i="4" path="docs/Getting-Started.md" type="user" />
    <Doc i="5" path="docs/dev/Technical-Overview.md" type="dev info" />
    <Doc i="6" path="docs/dev/Architecture-Decisions.md" type="" />
    <Doc i="7" path="docs/dev/ref/implementation/schema-validation.md" type="reference" />
  </Documents>
</UpdateDocsCommand>
