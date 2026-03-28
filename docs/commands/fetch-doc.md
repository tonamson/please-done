# Command `pd fetch-doc`

## Purpose
Help the AI Agent retrieve the latest information and documentation from external libraries or services (via Context7).

## How It Works
1. **Analyze the request:** AI determines which library or API needs to be researched.
2. **Query Context7:** Call the `mcp__context7` tool to find official documentation and code examples.
3. **Filter information:** Select the most important parts (such as installation guides, main API functions).
4. **Store:** Results are saved to the `RESEARCH.md` file in the current Milestone.

## Why is this command important?
It helps AI always work with the most up-to-date knowledge, rather than relying solely on old training data. This is especially important with rapidly changing libraries like Next.js, Flutter, or Solidity.

## Output
- List of researched libraries.
- Code examples saved to the `milestones` directory.
- Research report (RESEARCH.md) that supports better planning (`pd plan`).

## Usage Tips
- If AI is struggling with a new library, tell it to "run pd fetch-doc for library X".

---
**Next step:** [pd plan](plan.md)
