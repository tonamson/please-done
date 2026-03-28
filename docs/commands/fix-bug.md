# Command `pd fix-bug`

## Purpose
Fix bugs systematically and in a controlled manner. Never fix a bug without a plan.

## PD's 4-Step Process
1. **Reproduction:** AI writes a small script or test case to prove the bug exists. If it cannot be reproduced, AI will not fix it.
2. **Root Cause Analysis:** Investigate the underlying cause (e.g., logic error, type mismatch, missing context).
3. **Fix Plan:** Propose a fix solution and list the files that need intervention.
4. **Execute & Verify:** Apply changes and re-run the reproduction script from Step 1 to ensure the bug is gone.

## Why is this process effective?
- **Prevents recurring bugs:** By having a reproduction script, you can re-run it later to ensure the bug doesn't come back.
- **Transparency:** Every fix step is documented in `CHANGELOG.md` or a bug fix report.

## Output
- Bug fix code in the codebase.
- Bug reproduction script/test.
- Updated `CHANGELOG.md`.

## Usage Tips
- Provide error logs or describe the user steps that lead to the bug so AI can reproduce it faster.

---
**Next step:** [pd test](test.md) or [pd what-next](what-next.md).
