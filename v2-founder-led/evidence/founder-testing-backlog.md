# Founder Testing Backlog

Use this file to collect founder feedback between batch updates. Do not implement individual entries until the founder requests the batch.

## Completed Final Sweep

### B-001 - Offer explicit consent for a small budget overrun

- **Observed:** After building a EUR 2,250 plan, adding compatible spotter arms produced a projected total of EUR 2,319. Mara refused the addition and left no direct path forward.
- **Desired experience:** State the exact EUR 69 overrun and ask whether the customer wants to authorise it.
- **Suggested actions:** `Add anyway - EUR 69 over` and `Keep current plan`.
- **Behaviour rule:** The budget remains a hard cap unless the customer explicitly authorises the exact displayed overrun. Acceptance should add the item immediately, update the quote and room, and record the authorised amount. Declining should preserve the checked plan and continue naturally.
- **Avoid:** Silent overspending, quietly changing the budget, generic confirmation loops, or forcing the customer to re-enter the full budget.
- **Status:** Implemented and regression-tested in the final sweep.

### B-002 - Add governed J-hooks as required rack equipment

- **Observed:** Mara explained that J-hooks were not in the catalogue and the 3D bar position was illustrative.
- **Desired experience:** A recommended rack-and-barbell package should be usable and complete. J-hooks should exist in the governed catalogue and appear on the rack, in compatibility checks and in the quote.
- **Implementation direction:** Add a J-hook product with price, dimensions, rack interface and evidence; define explicit rack compatibility; render it on compatible racks; include it automatically as required setup rather than presenting it as an optional afterthought.
- **Behaviour rule:** Ask the customer only when there is a meaningful choice between J-hook models. Spotter arms remain a separate optional safety refinement.
- **Status:** Implemented and regression-tested in the final sweep.

### B-003 - Preserve the requested product through budget consent

- **Observed:** The customer asked for a rower. Mara switched to pricing a compact bike, increased the budget for that bike after consent, and then asked whether to add the bike or the rower. Nothing was added during the supposedly completed action.
- **Desired experience:** Keep the requested rower as the active intent. Report the rower's exact projected total and exact overrun, then offer direct actions such as `Add rower - EUR X over` and `Keep current plan`. A cheaper bike may be shown as a clearly labelled alternative, never silently substituted.
- **Behaviour rule:** If the customer explicitly approves the rower overrun, atomically authorise the exact amount, add the rower, validate room fit, update the budget/quote/layout and confirm the result. Do not ask again which product to add.
- **Failure handling:** If the rower cannot fit after budget consent, preserve the current plan and explain the fit problem; only then offer compatible alternatives.
- **Avoid:** Product substitution without consent, changing the budget for a different product, saying `Done` before the requested mutation occurs, and repeated confirmation loops.
- **Status:** Implemented and regression-tested in the final sweep.

### B-004 - Make Start over visible and easy to discover

- **Observed:** The reset action exists only inside the small chevron menu in the top-right corner, so the founder could not readily find it during testing.
- **Desired experience:** Provide a clearly labelled `Start over` command in the persistent interface while keeping it visually secondary to planning actions.
- **Implementation direction:** Use a restart icon with `Start over` text in the desktop header or plan controls; expose the same command in an obvious mobile menu or plan control. Retain a short confirmation to prevent accidental loss.
- **Behaviour rule:** Starting over creates a clean anonymous plan and resets the conversation, room, quote and selections together.
- **Avoid:** Hiding this core demo action behind an unlabeled chevron or making it look like refresh/recalculate.
- **Status:** Implemented and regression-tested in the final sweep.


# B-005 - Make owned-equipment capture work through the upgrade conversation

- **Observed:** Mara asks the customer to list brands/models or provide photos, but the current chat tools cannot add owned equipment to canonical plan state. The customer must separately use `Plan` > `Equipment you own` to choose a Northstar rack or enter a manual footprint. Photo input is not implemented.
- **Impact:** The conversation appears ready to continue but cannot clear the `existingEquipment` requirement from the customer's reply. This creates a hidden handoff to the form and overpromises photo support.
- **Desired experience:** A customer should be able to identify owned equipment naturally in chat or through the visible form, with both routes updating the same canonical state. Mara should explain what identification is sufficient and immediately continue to the desired upgrade.
- **Known-catalogue behaviour:** Exact Northstar models may receive governed attachment compatibility checks and recommendations.
- **Unknown-equipment behaviour:** Capture brand/model plus measured interface details as available, but do not approve attachments from footprint dimensions alone. Explain what evidence is missing and offer room-only planning or replacement options.
- **Implementation direction:** Add a strict `add_existing_equipment` conversation tool for exact catalogue variants and manual equipment; expose clear model choices when matching is ambiguous; remove the unsupported request for photos until image intake is implemented; make the Plan-panel selector an equivalent shortcut rather than a required hidden step.
- **Next question:** Once equipment is identified, ask what the customer wants to improve or add before collecting goal, experience and budget only where those facts affect the recommendation.
- **Status:** Implemented and regression-tested in the final sweep.


# B-006 - Tailor the Plan panel to the upgrade journey

- **Observed:** After selecting the upgrade journey, the Plan panel still resembles the new-gym intake. It shows broad training categories, experience and a `Build plan` action before the owned rack has been identified.
- **Desired flow:** Mara should direct the customer to `Plan` > `Equipment you own` and ask them to choose the exact rack or enter another item. This visible handoff is acceptable when explained clearly.
- **Keep:** Room dimensions, because upgrades still require spatial and clearance checks; owned-equipment identification; budget where the requested upgrade has a price trade-off.
- **Replace:** The broad `Training` section with an upgrade-focused prompt such as `What would you like to add or improve?`, offering relevant intents including safety supports, cable training, plate storage, dip or pull-up options, landmine work and another free-text request.
- **Defer or hide:** Experience and general training-focus controls unless a specific upgrade decision genuinely depends on them. Do not require irrelevant new-gym fields merely to run a compatibility check.
- **Action label:** Use `Find upgrades` or `Check upgrades`, not `Build plan`.
- **Conversation behaviour:** After the rack is chosen, Mara should acknowledge it and ask the customer's desired improvement. The form and chat must update the same canonical state.
- **Unknown equipment:** Permit manual identification, but clearly limit results to room planning until governed compatibility evidence is available.
- **Status:** Implemented and regression-tested in the final sweep.


# B-007 - Visually guide the customer to the required Plan control

- **Observed:** Mara may direct the customer to the right-hand `Equipment you own` control, but the customer still has to locate it among several visually equal sections.
- **Desired experience:** When Mara requests an owned-equipment selection, automatically open the Plan tab if needed, scroll the `Equipment you own` section into view and give that section a temporary visual spotlight.
- **Visual treatment:** Use a restrained accent border or background, a short `Choose your equipment here` marker and a brief transition. Remove the emphasis after selection or once the customer moves on.
- **Accessibility:** Move keyboard focus to the section or its selector where appropriate, announce the guidance through a polite live region, and include text/icon cues so meaning never depends on colour alone.
- **Responsive behaviour:** On mobile, switch to the Plan tab before focusing the control. Provide an easy route back to chat after selection, where Mara should immediately acknowledge the chosen equipment and continue.
- **Avoid:** Permanent warning styling, flashing animation, aggressive overlays, or highlighting several controls simultaneously.
- **Status:** Implemented and regression-tested in the final sweep.


# B-008 - Complete the upgrade journey as a compatibility-first consultation

- **Entry:** After `Upgrade equipment`, collect room dimensions for later fit checks, then guide the customer to identify one primary owned item. Explain why this is needed.
- **Immediate continuation:** As soon as an item is selected, return attention to Mara. She should name the chosen item and ask one useful question: `What would you like to add or improve?`
- **Intent choices:** Show context-sensitive shortcuts such as safety supports, cable training, dip handles, pull-up options, landmine work, plate storage or `Something else`. Always retain free-text input.
- **Compatibility before questionnaire:** Allow a direct compatibility answer without requiring experience, goals or budget. These fields become relevant only when comparing multiple suitable products or creating a priced package.
- **Filter early:** Once an exact catalogue host is known, show only attachments with a governed relationship to that host. Keep incompatible or unapproved products available only in a clearly labelled explanation/comparison view, not as normal recommendations.
- **Result language:** Distinguish `Confirmed compatible`, `Compatible with required adapter or condition`, `Not compatible`, and `Not enough evidence`. Never turn dimensional similarity into approval.
- **Required conditions:** If an adapter, stabiliser or mounting condition is required, include it automatically in the proposed package and quote rather than hiding it as an optional extra.
- **Owned-item treatment:** Render the owned rack in the room but label it `Owned` and never charge for it. Highlight newly proposed attachments separately in the room and quote.
- **One-click decisions:** `Add to upgrade` should validate compatibility, room fit and price in one action. On success, update the room and quote immediately. On failure, preserve the current plan and explain the single actionable reason.
- **Budget handling:** Ask for budget only before a priced recommendation needs it. If a requested compatible item exceeds the cap, preserve that exact product intent and offer explicit consent for the exact overrun.
- **Manual or unknown equipment:** Ask for brand, exact model and relevant interface measurements. Provide room-fit assistance, but label attachment compatibility `Not enough evidence` unless a governed relationship exists. Do not imply photo upload until implemented.
- **Multiple equipment:** Keep the MVP focused on one primary compatibility host at a time, but provide a visible `Change equipment` action so the customer can correct or switch the selected item without starting over.
- **Completion:** Present the owned item, proposed additions, compatibility evidence, required conditions, room fit and incremental cost. Use `Finish upgrade` rather than new-gym language.
- **Status:** Implemented and regression-tested in the final sweep.


# B-009 - Make post-build refinements relevant to the training goal

- **Observed:** The new-gym flow captures a primary training style, but post-build refinement is currently oriented around rack, barbell, spotter-arm and plate-storage scenarios. A calisthenics customer should receive different follow-up suggestions.
- **Desired experience:** After the first checked plan, inspect the customer's goals, selected equipment, remaining room, budget and governed catalogue, then offer the single most useful missing refinement for that training style.
- **Calisthenics examples:** Gymnastic rings, compatible dip handles or freestanding dip bars, parallettes, resistance bands, an appropriate training mat and pull-up options. Do not offer an item already covered by the base plan.
- **Catalogue work:** Add governed products for missing essentials such as rings and parallettes where the current catalogue does not contain them. Include price, dimensions, operating envelope, mounting/interface requirements, evidence and 3D representation. Dip attachments must retain host-specific compatibility rules.
- **Mounting rule:** Rings or wall/ceiling-mounted equipment may only be proposed when the relevant mounting permission and structural requirements are known. If unanswered, ask one contextual question at the point it affects the recommendation; do not silently assume permission.
- **Other goal mappings:** Bodybuilding may prioritise safety supports, adjustable bench angles, dumbbell range or plate storage; strength may prioritise safety equipment and progressive loading; cardio may offer a second modality, flooring or storage; hybrid plans should choose the biggest uncovered capability rather than list everything.
- **Interaction rule:** Offer one refinement at a time with direct actions such as `Add rings` and `Not now`. Acceptance should immediately validate, add, place and reprice the item. Do not restart intake or enter confirmation loops.
- **Budget rule:** If the refinement exceeds budget, show the exact overrun and offer explicit consent for that exact item; never silently substitute a different product.
- **Completion rule:** Stop when the important training needs are covered or the customer declines. Do not keep upselling merely because budget or floor space remains.
- **Status:** Implemented and regression-tested in the final sweep.


# B-010 - Prevent internal state-change messages leaking into chat

- **Observed:** Selecting `Plan a gym` sometimes displays `journeyType changed` twice beneath Mara's opening message.
- **Root cause:** Direct form/header patches append a customer-visible `system` chat message constructed from the internal requirement field name. Repeated clicks or concurrent journey updates can enqueue the same mutation twice.
- **Desired experience:** Journey selection should produce one natural Mara response and no technical state labels. Direct-control feedback may use the existing visually hidden live status, not the conversation transcript.
- **Implementation direction:** Stop appending generic `${field} changed` messages to chat. Keep concise accessibility announcements through the live region; never expose canonical field identifiers. Disable journey controls while their patch is pending, ignore a request that matches the current value and coalesce duplicate queued patches.
- **Conversation synchronisation:** If the journey is selected from the header, let Mara continue with the same natural next question used by the chat shortcut. Do not show both a system event and a conversational acknowledgement.
- **Regression checks:** Rapid double-click `Plan a gym` and `Upgrade equipment`; select the active journey again; switch journeys once; verify one state transition, no duplicate messages and none of `journeyType`, `new_space` or other internal labels in visible customer text.
- **Priority:** High for the final polish batch because it visibly exposes implementation language.
- **Status:** Implemented and regression-tested in the final sweep.


# B-011 - Explain why requested package items were omitted or substituted

- **Observed:** With a 6 x 6 x 1.5 m room, the deterministic planner correctly excluded standard racks despite the customer selecting the highest package/budget level. The conversation anticipated the ceiling constraint, but the completed plan did not clearly connect the missing rack to the failed height check.
- **Desired experience:** After building, Mara should explain the most important constraint-driven change in plain customer language: `I left out a standard rack because the recorded 1.5 m ceiling is lower than the current rack options. I used low-profile equipment instead.`
- **Result presentation:** Add a concise `How the room shaped this plan` or `Why this plan` note near the checked-plan summary. Show only material decisions, such as ceiling too low, operating envelope too large, mounting not permitted or budget cap reached.
- **Evidence rule:** Explanations must come from deterministic candidate rejection/failure reason codes and governed dimensions, not model inference. Include useful values where available, for example the room height and minimum required product height.
- **Package language:** Selecting a higher package level expresses spending/capability preference; it does not override fit, compatibility or evidence rules. If the expected premium item cannot pass, say that the package was adapted rather than silently presenting a cheaper-looking result.
- **Alternatives:** Where a valid lower-profile alternative exists, identify it and why it was chosen. If no product in that category fits, say so directly rather than implying the category was forgotten.
- **Unusual-input safeguard:** For unusually restrictive dimensions, retain the current planning behaviour but make the recorded value easy to edit from the result in case the customer entered it incorrectly.
- **Avoid:** Technical reason codes, vague `planning judgement`, silently omitted products, or claiming that a rejected product is unsafe.
- **Status:** Implemented and regression-tested in the final sweep.


# B-012 - Make equipment rows visibly interactive

- **Observed:** Equipment-package rows can be selected to inspect product details, but nothing clearly tells the customer that the rows are interactive. The small chevron is insufficient, and the replacement action remains hidden in the Details tab.
- **Desired experience:** Add a concise persistent hint above the equipment list: `Select any item to view details or replace it.`
- **Row treatment:** Use a clear hover and keyboard-focus state, pointer cursor, stable selected state and an accessible label such as `View details for [product]`. Retain the chevron as a supporting cue.
- **Selection behaviour:** Selecting a row should open the `Details` tab automatically, keep the same item highlighted in the package and room views, and scroll its details into view when needed.
- **Replacement cue:** In Details, label the action plainly as `Replace item` or `View replacement options`; avoid relying on `Try another checked rack` as the only explanation.
- **First-use guidance:** A temporary one-time callout after the first plan is built may point to the package list, but the persistent text hint must remain enough on its own.
- **Accessibility and mobile:** Entire rows should be keyboard operable with visible focus. On mobile, selecting an item should take the user to its Details view and provide an obvious route back to the plan or room.
- **Avoid:** Flashing tours, modal tutorials, hover-only instructions or making the hint look like another product row.
- **Status:** Implemented and regression-tested in the final sweep.


# B-013 - Preserve exact product intent when adding an accessory

- **Observed:** The customer accepted `compatible spotter arms`, but the app added the A20 Compact Cable Kit and reported success. Both products share the broad `attachment` category, so category filtering allowed an unrelated compatible item to win.
- **Severity:** High. The plan, quote and room were mutated with a product the customer did not request.
- **Desired behaviour:** A request for spotter arms may add only a governed spotter-arm product. If none is compatible, available, within the authorised budget and able to pass the room check, preserve the current plan and explain that no checked spotter-arm option can be added.
- **Matching rule:** Resolve explicit product nouns to a strict product subtype, capability tag or approved candidate ID before compatibility/ranking. Broad category is not sufficient for named requests such as spotter arms, safety straps, cable kit, dip handles, landmine, plate storage, rower or bike.
- **Substitution rule:** Never silently substitute across product intent. Alternatives may be offered afterward with their different purpose stated clearly and must require a separate customer choice.
- **Post-build prompt rule:** Only offer `Add spotter arms` when at least one spotter-arm candidate has a governed relationship with the selected host. Otherwise explain the unavailable option or offer a genuinely relevant safety alternative as a distinct choice.
- **Success wording:** Confirmation must repeat the requested and added product identity. Before responding, assert that the selected product satisfies the resolved intent.
- **Regression coverage:** Test explicit accessory requests against every seeded rack, including a case where another attachment is compatible but the requested subtype is not. Assert no mutation on mismatch and verify the quote and room contain the intended SKU only.
- **Status:** Implemented and regression-tested in the final sweep.


# B-014 - Replace blind product swapping with checked alternative selection

- **Observed:** The Details action says `Try another checked flooring` and immediately chooses the next valid same-category item. The customer cannot see what will be selected, compare price or know whether another option exists.
- **Desired experience:** Rename the action to `View replacement options`. Open a compact dropdown, popover or inline list containing only alternatives that currently pass the room, stock, mounting, compatibility and authorised-budget checks.
- **Option content:** Show product name, configuration, price and price difference from the current item. Include the one most relevant dimensional/capability difference where useful.
- **Selection behaviour:** The customer chooses a specific replacement. Only then should the app atomically swap it, regenerate affected placement, update the quote and confirm the exact change.
- **No alternatives:** Disable or replace the action with `No other checked flooring options fit this plan` (using the relevant category name). Do not provide a button that predictably fails.
- **Scope:** Apply consistently to racks, benches, cardio, barbells, plates, flooring and other replaceable categories. Governed attachment replacement may be enabled only when host compatibility is rechecked.
- **Current item:** Mark the selected product as `Current` and never include it as a replacement option.
- **Accessibility/mobile:** Use a labelled native select or accessible listbox/menu with keyboard operation; do not rely on hover. Keep the comparison readable on narrow screens.
- **Avoid:** Cycling blindly through products, selecting the next catalogue record by sort order, or showing alternatives that will fail only after selection.
- **Status:** Implemented and regression-tested in the final sweep.


# B-015 - Make plan changes visibly reversible

- **Observed:** Customers can add and replace products, while undo/removal controls are either confined to planning surfaces or difficult to discover. An incorrect automated addition can therefore feel permanent.
- **Desired experience:** After an add, replacement or optional refinement, show a brief confirmation containing the exact product and a visible `Undo` action. Equipment details should also provide `Remove from plan` for non-required items.
- **Required-item rule:** If removing an item would make another product unusable or invalidate a required package condition, explain the dependency and offer to remove the affected group together. Do not leave a misleading checked plan.
- **Mutation behaviour:** Undo or removal must update canonical state, room placement, quote, compatibility results and Mara's context together, then confirm the resulting plan.
- **Safety:** Retain a short confirmation only for changes with dependent items or substantial plan impact; ordinary optional additions should be reversible without repetitive confirmation dialogs.
- **Accessibility/mobile:** Make actions available from the item Details view and recent-action confirmation, with clear labels and keyboard access.
- **Status:** Implemented and regression-tested in the final sweep.

# Final Sweep Boundary

- Treat B-001 through B-015 as the final product-polish batch.
- Prioritise correctness and customer trust: exact intent, explicit budget consent, no internal language, governed compatibility and clear constraint explanations.
- Then address flow discoverability and copy consistency across desktop and mobile.
- Do not add broader catalogue coverage or new product concepts unless required to demonstrate the agreed calisthenics and rack flows.
- Finish with focused unit/API tests plus a compact end-to-end matrix for new-space, low-ceiling, upgrade, over-budget, replacement, duplicate-click and mobile journeys.
