# Phase 122: Data Files - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Create wordlists and reference data files for reconnaissance and pentesting. These are static data files used by the reconnaissance modules.

</domain>

<decisions>
## Implementation Decisions

### Data Files
- **DATA-01:** references/wordlists/common-paths.txt - Common path wordlist
- **DATA-02:** references/wordlists/parameters.txt - Parameter names wordlist
- **DATA-03:** references/wordlists/dorks.txt - Google dorks wordlist
- **DATA-04:** references/wordlists/waf-bypass.txt - WAF bypass patterns
- **DATA-05:** references/wordlists/encodings.txt - Encoding patterns
- **DATA-06:** references/mitremap/techniques.yaml - MITRE ATT&CK technique mappings

### Format
- .txt files: one entry per line
- .yaml files: structured key-value format

</decisions>

<canonical_refs>
## Canonical References

- Existing data files in references/
- MITRE ATT&CK v14.0 mappings
- OWASP Testing Guide v4.2

</canonical_refs>

<deferred>
## Deferred Ideas

None — scope is well-defined by requirements.

</deferred>

---

*Phase: 122-data-files*
*Context gathered: 2026-04-05*
