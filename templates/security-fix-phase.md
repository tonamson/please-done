# Fix Phase {PHASE_NUMBER}: {VULNERABILITY_NAME}

## Evidence goc

| Finding | File | Dong | Severity | Category |
|---------|------|------|----------|----------|
| {FINDING_NAME} | {FILE_PATH} | {LINE} | {SEVERITY} | {CATEGORY} |

> {EVIDENCE_QUOTE}

## Gadget Chain (neu co)

Chain: {CHAIN_NAME}
Vi tri trong chain: {CHAIN_POSITION}
Fix finding nay se: {CHAIN_IMPACT}

## Huong sua

{FIX_DESCRIPTION}

### Code pattern truoc (nguy hiem)

```
{UNSAFE_CODE}
```

### Code pattern sau (an toan)

```
{SAFE_CODE}
```

## Files can sua

| # | File | Ham | Dong | Hanh dong |
|---|------|-----|------|-----------|
| 1 | {FILE_PATH} | {FUNCTION_NAME} | {LINE} | {ACTION} |

## Tieu chi hoan thanh

- [ ] {CRITERION_1}
- [ ] {CRITERION_2}
- [ ] Chay scanner category {CATEGORY} tren files da sua -> verdict PASS
