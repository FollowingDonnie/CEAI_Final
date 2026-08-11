# Deep Research Prompt

Conduct a rigorous implementation study for **Northstar Space Planner**, a
fictional Ireland/Europe-focused gym-equipment retailer and product demonstrator.
This is not open-ended market-opportunity research. The product direction below
is fixed. Your task is to determine the most credible, evidence-based way to
design and build it, expose risks and unknowns, and supply governed source
material to a later Researcher agent.

## Fixed Product Direction

Northstar helps beginners and experienced users design a home gym, garage,
spare room, shed, or small studio, or upgrade equipment they already own. A
friendly conversational assistant gathers room length/width/height, goals,
experience, intended users, existing equipment, priorities, and mandatory
budget. It recommends a coherent equipment set, validates spatial fit and rack
attachment compatibility with deterministic tools, explains compromises,
produces an itemised quote, and displays an editable top-down plan plus a
simplified 3D representation driven by the same coordinates.

The initial live catalogue will be held in Google Sheets and contain fictional
Northstar products based on realistic, cited specifications. Missing values must
remain unknown. Compatibility approval must be data-governed; matching dimensions
alone are not proof. The language model handles natural-language interpretation
and explanation, while code owns geometry, compatibility, stock, arithmetic,
budget, and quote validation.

The required product includes chat, persistent editable requirements, a shortlist
or plan, an itemised budget, live catalogue data, deterministic validation, and
2D/3D room visualisation. Do not recommend replacing it with a static catalogue,
form-only wizard, or generic chatbot.

## Research Questions

### A. Customer Planning Conversation

Research how knowledgeable gym designers or retailers elicit requirements for a
new home gym and for equipment upgrades. Identify the minimum questions, useful
conditional follow-ups by goal (strength, bodybuilding, cardio, calisthenics,
general fitness), and ways to adapt language for beginners versus experienced
users without creating a long questionnaire. Recommend a conversational state
model that asks one clear question at a time while keeping collected details
editable outside chat.

### B. Catalogue Scope and Datasheet Schema

Using current official manufacturer product pages, manuals, and datasheets,
research representative specifications for racks, squat stands, folding racks,
benches, rack attachments, rowers/cardio machines, barbells, plates, dumbbells,
kettlebells, flooring, and storage. Focus on Ireland, UK, and European products
where possible. Do not bulk-copy proprietary descriptions.

Propose a normalised schema that can support:

- physical footprint and orientation;
- separate operating/access clearances;
- ceiling or user-height constraints;
- price in euro, stock, delivery assumptions, and quote components;
- declared load, product weight, anchoring, materials, and steel gauge;
- rack upright size, hole diameter, hole spacing, pin size, attachment side,
  generation/version, obstructions, adapters, and approved relationships;
- training uses, skill suitability, and evidence provenance;
- explicit unknown/not-provided values and confidence.

Explain which fields belong in product, variant, compatibility, clearance,
source, and stock/price tables. Supply a representative fictional catalogue
blueprint, not fabricated manufacturer claims: product categories, tiers,
necessary records, and realistic value ranges with sources.

### C. Rack and Attachment Compatibility

Research how rack ecosystems differ and why nominal measurements can mislead.
Cover upright cross-section, actual versus marketed dimensions, metric/imperial
tolerances, hole diameter, hole spacing patterns, pin size, attachment orientation,
rack depth, bracing, product generations, anchoring, stabilisers, and physical
obstruction. Propose a deterministic compatibility model and evidence hierarchy.

Use these output states: explicitly compatible; compatible with a named adapter
or condition; dimensionally matching but unapproved; incompatible with exact
failed constraints; insufficient information. Explain what evidence is required
before each state can be shown to a customer.

### D. Spatial Planning and Clearances

Research practical room-planning rules for gym equipment. Distinguish equipment
footprint from dynamic operating envelopes, loading/service access, circulation,
folding/door paths, and ceiling movement. Identify which rules are defensible
from official manuals and which require conservative product-design assumptions.

Recommend a deterministic 2D layout approach for a rectangular room that can:

- place and rotate rectangular or compound footprints;
- reject wall, height, collision, and prohibited-zone violations;
- preserve user-locked items and recompute remaining placements;
- rank valid layouts for access, goal coverage, multipurpose value, and budget;
- produce human-readable failure reasons;
- keep all dimensions and coordinates suitable for a shared 2D/3D scene.

Compare suitable algorithms and libraries, including pragmatic heuristics for a
small prototype. Do not imply that a geometric pass certifies installation safety.

### E. 2D and 3D Technical Approach

Recommend a browser architecture for an editable top-down planner and simplified
recognisable 3D equipment. Evaluate Three.js and suitable supporting libraries
using current official documentation. Address one shared coordinate model,
units, origins, rotation, collision overlays, camera controls, wall visibility,
responsive rendering, performance, accessibility fallback, and testing for blank
or incorrectly framed canvas output.

Recommend the smallest credible modelling approach for a rack, bench, dumbbell
area, and rower/cardio machine without depending on copyrighted commercial 3D
models. Distinguish the target experience from the authorised fallback of an
editable 2D plan plus a non-editable 3D view.

### F. Conversational AI and Deterministic Tools

Using current official OpenAI documentation, recommend a tool-calling architecture
for natural conversation plus structured state. Define likely JSON inputs,
outputs, validation errors, and sequencing for tools equivalent to:

- update customer requirements;
- search the live catalogue;
- compare products;
- check room fit;
- check attachment compatibility;
- generate a room layout;
- calculate an itemised quote.

Explain how to prevent the model from claiming that an unvalidated plan fits,
inventing a missing specification, silently exceeding budget, or treating a tool
failure as evidence. Recommend techniques for state consistency between chat,
visible controls, the quote, and visualisation.

### G. Live Data and Governance

Recommend a practical Google Sheets workbook structure and server-side access
pattern for the prototype. Cover validation, identifiers, typed parsing, cache
policy versus freshness, source timestamps, schema changes, bad rows, duplicate
records, unavailable Sheets, and customer-friendly failures. Compare the role of
Sheets with a future database without changing the prototype requirement.

Define a provenance method that records source URL, document type, accessed date,
field-level or record-level evidence, conflicts, assumptions, and confidence.

### H. Safety, Consumer Trust, and Claims

Research relevant Ireland/EU consumer-facing considerations for a prototype that
reports equipment dimensions, loads, anchoring requirements, prices, stock, and
planning clearances. This is not a request for legal advice. Recommend wording
and interface boundaries that avoid certifying installation or exercise safety,
misrepresenting source brands, or turning inferred values into facts.

### I. Evaluation and Delivery

Propose an implementation sequence and test strategy covering unit, contract,
integration, adversarial conversation, geometry, compatibility, budget, live-data
freshness, accessibility, desktop/mobile interface, and WebGL/canvas rendering.
Include concrete acceptance scenarios for both the new-space and upgrade journeys,
including impossible rooms, inadequate budgets, missing specifications, stale or
unavailable data, unapproved attachments, and conflicting user edits.

## Required Output

Produce one structured evidence dossier with:

1. Executive implementation findings.
2. Customer discovery and conversation model.
3. Recommended MVP boundary and justified later enhancements.
4. Initial catalogue blueprint and category/tier coverage.
5. Normalised datasheet and Google Sheets schema, with field definitions.
6. Compatibility ontology, decision table, and evidence hierarchy.
7. Spatial model, clearance taxonomy, layout algorithm recommendation, and
   human-readable validation reasons.
8. Shared 2D/3D architecture and modelling recommendation.
9. AI/tool architecture with example schemas and validation sequence.
10. UX architecture for chat, editable state, plan, quote, and visual planner.
11. Safety/claims boundary and customer-facing uncertainty language.
12. Phased implementation and comprehensive evaluation plan.
13. Risk, assumption, conflict, and unknown register.
14. Source register linking each decisive recommendation to evidence.

For every major claim, label it as **verified fact**, **inference**,
**recommendation**, or **unknown**. Cite sources inline and favour current primary
sources: official product pages/manuals, official technical documentation,
standards or government sources, and peer-reviewed research where relevant.
Record publication/access dates. Use EUR, kilograms, millimetres, and metres,
noting conversions and tolerances. Highlight disagreement between sources.

Compare implementation options where useful, but finish each comparison with a
clear recommendation for this product. Do not propose a different product,
rebrand the concept, or conduct broad market ideation. The goal is to give a
Researcher agent reliable evidence for building the founder's stated vision.
