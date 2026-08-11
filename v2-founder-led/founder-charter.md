# Founder Charter: Northstar Space Planner

## 1. Authority

This charter is the highest-authority product document for the run. The founder
defines the problem, intended customer experience, product boundaries, and
non-negotiable capabilities. Research may challenge assumptions with evidence
and agents may choose implementation details, but no agent may pivot to a
different product or weaken a non-negotiable without explicit founder approval.

When evidence conflicts with an assumption, record the conflict and choose the
most conservative implementation that still honours the vision. If a required
capability is genuinely infeasible, the Manager must produce an exception
report. It must not quietly substitute an easier product.

## 2. Product Thesis

Northstar is a fictional, accessible equipment retailer for Ireland and Europe.
Its product helps people plan a home gym or small studio through a comfortable
conversation instead of forcing them to understand every equipment standard,
clearance rule, and compatibility detail themselves.

The customer describes a room, training goals, experience, users, budget, and
existing equipment. Northstar recommends a coherent equipment plan, validates
fit and attachment compatibility, explains compromises, provides an itemised
quote, and visualises the proposed room. It demonstrates a product concept that
could later be offered to real gym-equipment retailers.

This is not merely a chat skin over a spreadsheet. The catalogue is live input;
deterministic planning and validation are the product intelligence; conversation
is the humane interface to that intelligence.

## 3. Primary Journeys

### New Space

A beginner or experienced customer plans a home gym, garage, spare room, shed,
or small commercial studio. The assistant gathers:

- room length, width, and height in metres;
- training goals or sports;
- experience level and intended users;
- existing equipment;
- mandatory budget in euro;
- priorities and constraints revealed through natural follow-up questions.

It recommends one validated plan and, when useful, one validated alternative.
It should not fill every available metre or overwhelm the customer.

### Upgrade Existing Equipment

The customer selects a Northstar catalogue item or describes manually entered
equipment. For catalogue items, Northstar can suggest validated upgrades and
attachments. Manually entered items may occupy measured floor space, but must
not receive compatibility claims without sufficient verified specifications.

## 4. Required Experience

- A friendly assistant with a visible human persona asks one simple question at
  a time and behaves like a collaborative equipment specialist.
- A persistent, editable plan shows room details, goals, equipment choices,
  constraints, and budget outside the conversation.
- Customers can ask free-form catalogue, comparison, fit, price, and upgrade
  questions.
- Recommendations explain trade-offs and distinguish sourced facts from
  planning judgement.
- The product generates an itemised quote including relevant equipment,
  flooring, bars, plates, accessories, and delivery assumptions.
- The plan has an accurate top-down view and a simplified recognisable 3D view
  driven by the same room and placement coordinates.
- The user can lock an item and recalculate the remaining layout. Invalid or
  colliding placements are visible and explained.
- Chat changes update the structured plan and visualisation.

## 5. Non-Negotiables

The pipeline must not remove or replace:

1. The conversational planning journey.
2. Deterministic room-fit and operating-clearance validation.
3. Deterministic attachment compatibility validation.
4. A live external product catalogue, initially Google Sheets.
5. An editable visual room plan.
6. A 3D representation. The authorised fallback is an accurate editable
   top-down planner plus a simplified, non-editable 3D view using the same data.
7. An itemised, budget-aware plan and quote.

## 6. Catalogue and Datasheets

The prototype uses fictional Northstar products based on realistic, cited
equipment specifications. It must not imply affiliation with source brands.
Missing specifications are stored and displayed as `not provided`; they are
never invented.

The initial catalogue should be small enough to govern well but broad enough to
demonstrate planning:

- compact squat stand, half rack, full power rack, and wall/folding rack;
- approximately ten rack attachments, including spotter arms, dip attachment,
  landmine, cable option, pull-up option, plate storage, jammer arms, and safety
  straps;
- flat/adjustable benches across approximately three levels;
- approximately three cardio machines;
- barbells, plates, fixed and adjustable dumbbells, kettlebells, bands, mats,
  flooring, and storage;
- multiple price and construction tiers.

Required fields include stable product ID, category, price, stock, physical
dimensions, product weight, operating clearances, relevant user-height range,
declared maximum load, steel gauge where applicable, upright dimensions, hole
diameter and spacing, attachment points, anchoring requirements, training uses,
experience suitability, compatibility evidence, source notes, and missing-field
status. Research may add fields but must not remove these without justification.

## 7. Compatibility Policy

Dimensional similarity is not approval. A compatibility relationship must exist
in governed catalogue data before the product calls a pairing compatible.

Allowed result states are:

- explicitly compatible;
- compatible with a named adapter or documented condition;
- dimensionally matching but not catalogue-approved;
- incompatible, with the exact failed constraint;
- insufficient information.

Failures should name the relevant cause, such as upright size, hole diameter,
hole spacing, pin size, product generation, obstruction, or missing evidence.
Validated alternatives, adapters, or stabilisers may be suggested.

## 8. Spatial and Recommendation Policy

The MVP models a rectangular room from length, width, and height. Every product
has a physical footprint and may have task-specific operating zones for plate
loading, rowing, doors/folding, access, and user movement. The planner must not
overlap prohibited zones. It favours versatile equipment in constrained rooms
and explains why an apparently suitable item does not fit.

The language model interprets goals, asks follow-ups, and explains choices.
Deterministic tools own geometry, compatibility, arithmetic, stock checks,
budget totals, and quote construction. A recommendation may be presented as
validated only after those tools pass it.

The assistant may exceed budget only after asking permission, and must show the
amount and reason. It must explain when the requested goals cannot all be met
within the room or budget.

## 9. Proposed Tool Boundary

The implementation should expose explicit tool contracts equivalent to:

- `update_customer_requirements`
- `search_equipment_catalogue`
- `compare_products`
- `check_room_fit`
- `check_attachment_compatibility`
- `generate_room_layout`
- `calculate_quote`

Research and design may refine names and schemas. They may not collapse factual
retrieval and deterministic validation into unconstrained model prose.

## 10. Safety and Claims Boundary

Northstar is not an installation or safety-certification system. It may report
documented dimensions, declared loads, anchoring requirements, operating
clearances, and manufacturer-style instructions. It must not certify that an
installation or exercise is safe. Steel gauge is discussed as a factor in
rigidity, durability, product weight, load design, and cost, not as proof of
safety. Support features such as spotter arms are described factually and users
are directed to product instructions and qualified help where appropriate.

## 11. Agent Autonomy

Agents may decide technical architecture, algorithms, data structures, test
strategy, interface details, and implementation sequencing when those decisions
remain consistent with this charter and accepted research. They must record
material decisions and their basis.

Agents may not:

- search for a different market opportunity;
- turn the product into a static catalogue or spreadsheet frontend;
- replace conversation with a fixed form or scripted menu;
- describe unvalidated compatibility as fact;
- invent missing product specifications;
- remove visual planning because it is difficult;
- publish externally unless `pipeline/run-config.md` explicitly authorises it.

## 12. Definition of Success

A successful prototype lets a customer complete both primary journeys and see
that changing room details, budget, goals, equipment, catalogue data, or locked
placements changes the resulting validated plan. It demonstrates live external
data, genuine model-led conversation, deterministic validation, transparent
uncertainty, an itemised quote, and coherent 2D/3D output. It should feel like a
credible product concept, not an assignment exhibit.
