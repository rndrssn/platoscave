# HANDOFF.md

## Ready for Claude Code

### SPIKE-organised-anarchy-scoring — Scoring Implementation
- Doc: `docs/SPIKE-organised-anarchy-scoring.md`
- Spec: `docs/PRINCIPLE-organised-anarchy-questions.md`
- Task: Read both docs. Implement the scoring logic defined in the spec
  as a single file `gc-scoring.js` at the repo root. Expose one function:
  `scoreResponses(responses)` as defined in the spike doc. Write a test
  script `tests/test-gc-scoring.js` that validates the three archetypes
  (university, startup, manufacturing firm) produce the expected parameter
  sets. Run the test in Node and confirm all three pass.
- Branch: `experiment/organised-anarchy-mapper`

## Notes
- All new files must follow `docs/DOC-CONVENTIONS.md`
- Stay on `experiment/organised-anarchy-mapper`
- The only deliverables are `gc-scoring.js` and `tests/test-gc-scoring.js`
- Do not begin any other spike
- Nothing else until this spike is resolved
