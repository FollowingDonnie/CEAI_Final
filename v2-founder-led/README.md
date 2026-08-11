# Northstar Space Planner: Founder-Led Agent Pipeline

This folder contains the second, founder-led product pipeline. It preserves the
completed exploratory v1 and replaces strategic agent autonomy with a clear
authority model:

- The founder owns the product vision, boundaries, and definition of value.
- Research investigates how to realise that vision and where its assumptions
  need evidence.
- Agents have high execution autonomy and low strategic autonomy.
- The Manager may return weak work to an agent, but may not silently pivot,
  remove the chat, or replace the visual planner with a catalogue browser.

## Contents

- `founder-charter.md`: immutable product direction and authority contract.
- `research-inputs/deep-research-prompt.md`: prompt to run in Deep Research.
- `research-inputs/README.md`: where to place the returned research dossier.
- `agents/`: detailed contracts for the five required organisational roles.
- `pipeline/manager-pipeline.md`: uninterrupted end-to-end orchestration.
- `pipeline/run-config.md`: approvals and run-specific settings.
- `handoffs/README.md`: required handoff filenames and provenance rules.
- `evidence/decision-log.md`: template for traceable decisions.

## Intended Run Order

1. Run the supplied Deep Research prompt.
2. Place the result in `research-inputs/deep-research-report.docx` or `.md`.
3. Complete `pipeline/run-config.md` before execution.
4. Give the Manager the pipeline prompt and permission to run.
5. The Manager runs Researcher, Designer, Maker, and Communicator in order,
   applying the documented gates without pausing for ordinary implementation
   choices.

This pipeline builds the product. Assignment packaging and report writing are
separate activities and are not part of the agents' product responsibilities.
