# Commit Message Guidelines

## Always Provide Comprehensive Commit Messages

After any code session or group of code changes for a feature, **always provide a detailed commit message** that includes:

### Required Elements

1. **Clear Summary Line** (50 chars or less)
   - Use conventional commit format: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
   - Be specific about what was accomplished

2. **Detailed Description**
   - Explain what was changed and why
   - List major components or files modified
   - Include any breaking changes or important notes

3. **Impact Statement**
   - Describe the result or benefit of the changes
   - Mention any user-facing improvements

### Format Template

```
<type>: <brief description>

## <Section Name>
- Bullet point of changes
- Another change made

## <Another Section>
- More detailed explanations
- Technical details if relevant

## Files Modified
- file1.ext: Description of changes
- file2.ext: What was updated

Result: Brief summary of the overall impact and outcome.
```

### Examples of Good Commit Messages

```
feat: Implement automated PDF generation and enhance CV content

## PDF Generation System
- Add Node.js-based PDF generation using Playwright
- Create comprehensive GitHub Actions workflow
- Implement robust error handling and debugging

## CV Content Enhancements  
- Upgrade Career Profile to executive-level positioning
- Enhance skills section with professional naming
- Fix typos and improve descriptions

## Files Modified
- _data/data.yml: Enhanced CV content
- .github/workflows/generate-pdf.yml: PDF automation
- scripts/generate-pdf.js: PDF generation logic

Result: Professional CV with automated PDF generation and enhanced content.
```

### When to Provide Commit Messages

- **End of coding session** - Always summarize what was accomplished
- **Feature completion** - Comprehensive overview of the entire feature
- **Bug fix resolution** - Explain the problem and solution
- **Refactoring work** - Detail what was improved and why
- **Configuration changes** - Explain new settings and their purpose

### Commit Message Best Practices

- **Be specific** - Avoid vague messages like "updates" or "fixes"
- **Use present tense** - "Add feature" not "Added feature"
- **Include context** - Why the change was needed
- **Reference issues** - Link to tickets or discussions when relevant
- **Group related changes** - Don't make separate commits for tiny related changes

This ensures clear project history and makes it easy to understand what was accomplished in each development session.