# Fix Phase {PHASE_NUMBER}: {VULNERABILITY_NAME}

## Original Evidence

| Finding | File | Line | Severity | Category |
|---------|------|------|----------|----------|
| {FINDING_NAME} | {FILE_PATH} | {LINE} | {SEVERITY} | {CATEGORY} |

> {EVIDENCE_QUOTE}

## Gadget Chain (if any)

Chain: {CHAIN_NAME}
Position in chain: {CHAIN_POSITION}
Fixing this finding will: {CHAIN_IMPACT}

## Fix Approach

{FIX_DESCRIPTION}

### Code Pattern Before (unsafe)

```
{UNSAFE_CODE}
```

### Code Pattern After (safe)

```
{SAFE_CODE}
```

## Files to Modify

| # | File | Function | Line | Action |
|---|------|----------|------|--------|
| 1 | {FILE_PATH} | {FUNCTION_NAME} | {LINE} | {ACTION} |

## Completion Criteria

- [ ] {CRITERION_1}
- [ ] {CRITERION_2}
- [ ] Run scanner category {CATEGORY} on modified files -> verdict PASS
