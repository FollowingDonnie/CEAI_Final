# Agent System

This project adapts the useful structure of Octopus without copying its venture assumptions or Claude-specific workflow code.

## Organisation

| Order | Agent | Responsibility | Primary artefact |
|---|---|---|---|
| 1 | Researcher | Identify and validate the opportunity | `handoffs/01-opportunity-brief.md` |
| 2 | Designer | Define the evidence-backed solution | `handoffs/02-solution-design.md` |
| 3 | Maker | Build and verify the product | `handoffs/03-build-handoff.md` |
| 4 | Communicator | Prepare messaging and customer acquisition | `handoffs/04-communication-plan.md` |
| 5 | Manager | Orchestrate, gate, and make the final decision | `handoffs/05-manager-executive-summary.md` |

The Manager is both the continuous orchestrator and the final producing role. It is not a sixth layer outside the organisation.

## Starting point

`founder-brief.md` contains founder observations and constraints. It deliberately treats Mirafit and the home-gym product concept as hypotheses. The Researcher must independently validate the market and may recommend a different company, data source, audience, or product direction.

An optional founder-supplied Deep Research dossier can be placed at `research-inputs/deep-research-report.md`. It is supporting evidence for the Researcher to audit, not a substitute for the Researcher's investigation or official handoff.

## Execution

Use `pipeline/manager-pipeline.md` as the master orchestration prompt. Each specialist reads its role definition and the accepted handoff from the previous stage.

## Octopus adaptations

- `Marketer` becomes the broader customer-facing `Communicator` function.
- The Octopus cold Verifier is omitted so quality control remains with the Manager rather than introducing another organisational role.
- Octopus-specific Stripe, Cloudflare, revenue-kill, and model-routing assumptions are removed.
- Handoffs and Manager gates are retained because they support coherent cross-functional work and prevent unsupported downstream decisions.
- The pipeline is product-neutral until the Researcher completes independent research.

