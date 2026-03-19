---
id: PRINCIPLE-organised-anarchy-diagnosis
type: PRINCIPLE
title: Organised Anarchy — Diagnosis Clusters
status: ACTIVE
created: 2026-03-15
updated: 2026-03-19
owner: Robert Andersson
relates_to: [REFERENCE-gc-model-semantics, PRINCIPLE-organised-anarchy-questions, VISION-product]
tags: [garbage-can, diagnosis, content, lookup]
---

# Organised Anarchy — Diagnosis Clusters

Five diagnosis clusters correspond to combinations of `decisionStructure` and `accessStructure`.

Runtime interpolation contract:

- `getDiagnosis(decisionStructure, accessStructure, unresolvedShare)`
- `unresolvedShare` is a problem-level proportion in [0, 1]
- diagnosis copy may use `{unresolved}` and `{resolved}` placeholders

## Cluster 1 — The Coherent Traditional Organisation

**Key:** `hierarchical/hierarchical`

Your organisation is what it believes itself to be. Problems usually reach the choice opportunities designed for them. Decisions are typically made by the people with the authority to make them. The instruments of traditional management (governance structures, reporting lines, sanctioned decision forums) are reasonably well matched to the work being done. The Garbage Can Model has limited explanatory power here. If this diagnosis surprises you, ask whether the questions captured the full complexity of your environment, or whether parts of your organisation are operating under different conditions than the ones you described. In organisations like yours, roughly {resolved}% of problems are genuinely resolved.

## Cluster 2 — The Complexity-Informed Organisation

**Key:** `unsegmented/unsegmented`

Your organisation has rejected the decomposable worldview, at least in practice. Problems surface wherever they can find a choice opportunity. Participation is fluid and expertise-driven rather than seniority-driven. Decisions emerge from whoever is present and engaged rather than from sanctioned authority. This is not disorder; it is a different kind of order, one that the Garbage Can Model describes well. The risk is not anarchy but invisibility: when everything is permeable, it becomes difficult to know which decisions were actually made, by whom, and whether underlying problems were resolved or merely displaced. In organisations like yours, roughly {unresolved}% of problems remain unresolved.

## Cluster 3 — The Mix

**Key:** `hierarchical/unsegmented`

Your organisation has inherited the instruments of a decomposable worldview: governance structures, reporting lines, sanctioned decision forums, capital allocation processes designed around predictable throughput. It applies them to a system that does not behave decomposably. Problems surface everywhere because the work itself is emergent; complex interactions between people, technology, and context that cannot be predicted from their parts. But decisions are made hierarchically, because the management frame requires it. The result is a permanent structural gap: problems live where the work is, decisions are made where the authority is, and the two rarely occupy the same room at the same time. This is not a communication problem. It is two incompatible beliefs about the nature of the system, operating simultaneously on the same organisation. In organisations like yours, roughly {unresolved}% of problems remain unresolved, not because of incompetence, but because the instruments were designed for a different kind of system.

## Cluster 4 — The Inverse Mix

**Key:** `unsegmented/hierarchical`

Your organisation has open, fluid decision-making: in principle, anyone can weigh in, and participation is not strictly governed by seniority. But the problems that reach choice opportunities are filtered before they arrive. Important issues that originate at the edges of the organisation (where the work actually happens) travel slowly or not at all toward the places where they could be addressed. The people in the room are willing to decide. The problems that most need deciding rarely make it through the door. In organisations like yours, roughly {unresolved}% of problems remain unresolved. The choice opportunity was open, but the problem was elsewhere.

## Cluster 5 — The Siloed Organisation

**Key:** `specialized/specialized`

Your organisation has partitioned itself: problems are assigned to designated channels, and people are assigned to designated choice opportunities. On paper this looks like clarity. In practice it means that problems that do not fit their designated channel have nowhere to go. The work that falls between silos (integrations, dependencies, emergent cross-functional issues) has no legitimate choice opportunity. It either disappears from view or creates informal decision-making the organisation cannot see or govern. In organisations like yours, roughly {unresolved}% of problems remain unresolved. The problems most likely to go unresolved are the ones the structure was never designed to see.

## Lookup Structure

The key is `decisionStructure/accessStructure`. All nine combinations are handled through five primary clusters and four intentional fallbacks.

### Fallback Rules

- Cluster 3 fallback: `hierarchical/specialized`, `specialized/hierarchical`
- Cluster 4 fallback: `unsegmented/specialized`, `specialized/unsegmented`

## Source of Truth

Canonical implementation lives in `gc-diagnosis.js`.

Do not duplicate a full inline JS object in this document; update the code file and this principle doc together when semantics change.
