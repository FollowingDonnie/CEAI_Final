# Manager Pipeline: Northstar Founder-Led Product Build

## Invocation

You are the Manager defined in `agents/manager.md`. Run this pipeline as one
continuous product-development operation. The founder has already supplied the
vision. Your job is to organise specialist execution, not reopen product ideation.

## Immutable Rules

1. Read `founder-charter.md` before any other product document.
2. Preserve the existing exploratory v1; all new work belongs to the founder-led
   v2 scope selected by the repository structure.
3. Use exactly four specialist agents in sequence: Researcher, Designer, Maker,
   Communicator. You are the fifth role.
4. Agents have high execution autonomy and low strategic autonomy.
5. Chat, live catalogue data, deterministic fit, deterministic compatibility,
   editable visual planning, an itemised quote, and 3D representation are
   non-negotiable.
6. Do not pause for routine choices. Apply the charter, accepted research, codebase
   conventions, and conservative engineering judgement.
7. Return failed work to its owning agent until it passes or meets the strategic
   exception rule.
8. Obey all external-action flags in `pipeline/run-config.md`.
9. Maintain `evidence/decision-log.md` throughout.
10. Build the product only. Submission packaging and reflective assessment work
    happen later and outside this pipeline.

## Stage 0: Preflight

Read:

- `founder-charter.md`
- `pipeline/run-config.md`
- all five files in `agents/`
- `handoffs/README.md`
- the Deep Research report named by the run configuration

Verify that the report exists and that permissions are explicit. Create a charter
traceability checklist for gate reviews. If a required input is missing, stop with
an exception report. Do not run generic research as a substitute for a report the
founder intends to supply.

## Stage 1: Researcher

Instruct the Researcher:

> Execute `agents/researcher.md`. Treat the founder charter as fixed product
> authority and the Deep Research dossier as evidence to verify and translate,
> not permission to pivot. Produce the required handoff and update the decision
> log. Do not design or build the interface.

Apply the Research Gate from `agents/manager.md`. Return specific failed criteria
to the Researcher and require a corrected file. Continue only after acceptance.

## Stage 2: Designer

Instruct the Designer:

> Execute `agents/designer.md` using the founder charter and accepted research
> handoff. Produce one coherent, buildable product specification for both journeys.
> Do not offer alternative products or simplify away any non-negotiable. Update
> the decision log.

Apply the Design Gate. Return failures to the Designer until corrected or the
exception rule applies.

## Stage 3: Maker

Instruct the Maker:

> Execute `agents/maker.md` using the founder charter and both accepted handoffs.
> Build incrementally through all six phases, running each phase gate before
> continuing. Implement deterministic domain engines, a live catalogue boundary,
> model tool orchestration, the full planner interface, and shared 2D/3D state.
> Obey the run configuration for external actions and update the decision log.

Apply the Build Gate by inspecting code, tests, running behaviour, screenshots,
and canvas evidence. A visually attractive mock-up does not pass. A working chat
over a Sheet without planning engines does not pass. Return failures to the Maker
until corrected or the exception rule applies.

## Stage 4: Communicator

Instruct the Communicator:

> Execute `agents/communicator.md` using only accepted requirements and validated
> build evidence. Produce honest customer and retailer-facing communication.
> Never invent traction, capability, compatibility, or safety assurance. Update
> the decision log.

Apply the Communication Gate and return failures until corrected.

## Stage 5: Manager Synthesis

Perform an end-to-end audit:

- trace each founder requirement to research, design, implementation, test, and
  communication evidence;
- run the two primary journeys and the high-risk failure scenarios;
- confirm visible state, quote, 2D, 3D, and assistant responses remain consistent;
- confirm all external actions match authorisation;
- confirm the existing v1 remains intact;
- classify every remaining gap as accepted limitation, repairable defect, pending
  authorised action, or strategic exception.

Return repairable defects to the relevant specialist. When all gates pass, write
the Manager executive summary and declare completion. Do not confuse elapsed time,
token limits, or the presence of a polished interface with completion.

## Completion Condition

The pipeline is complete only when:

- all five handoffs exist and are internally consistent;
- all four specialist gates pass;
- both customer journeys function;
- live data and model calls are genuine;
- deterministic engines govern fit, compatibility, stock, arithmetic, and budget;
- the editable 2D planner and 3D representation share placement state;
- uncertainty and failure are customer-friendly and technically observable;
- tests and visual evidence support the claims;
- no unauthorised external action or silent product pivot occurred.
