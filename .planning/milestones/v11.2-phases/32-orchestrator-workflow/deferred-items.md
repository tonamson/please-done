# Deferred Items — Phase 32

## Pre-existing Test Failures (from Plan 01 rewrite)

4 integration tests fail because they check for v1.5 patterns no longer in the rewritten workflow:

1. **inlineWorkflow xu ly duoc moi command co workflow** — workflow format changed from v1.5 to orchestrator
2. **fix-bug workflow co effort routing tu bug classification** — effort routing removed per v2.1 design (agents have fixed models)
3. **executor workflows co backward compat default sonnet** — old pattern not applicable in multi-agent orchestrator
4. **workflows co tham chieu context7-pipeline** — context7 reference not in new orchestrator format

**Recommended fix:** Update these tests in Phase 33 (Resilience & Backward Compatibility) to match new orchestrator workflow structure.
