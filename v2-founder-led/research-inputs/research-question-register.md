# Research Question Register

These are not questions to return to the founder before the run. They capture the
uncertainties raised during collaborative product discovery that the Researcher
must investigate and resolve before the Designer begins.

For each item, record a conclusion or recommended default, evidence and source
quality, confidence and limitations, classification as fact/inference/
recommendation/prototype assumption, and the exact downstream requirement. Use
`FOUNDER DECISION REQUIRED` only for strategic or subjective choices that neither
the charter nor credible evidence can resolve.

## Customer and Conversation

1. What information do competent home-gym planners require, and which fields are
   genuinely mandatory?
2. Which follow-ups should vary by training goal, sport, experience, room type,
   intended users, and new-space versus upgrade journey?
3. How should the assistant adapt for beginners and experts without becoming
   patronising, needlessly technical, or a questionnaire read aloud?
4. What is the natural question order while still accepting several details in a
   single user message?
5. When should it recommend, probe, challenge, or explain that constraints make a
   request impossible?
6. Which values stay visibly editable, and how do edits reconcile with conversation
   and existing validations?
7. When do quick choices help without reducing conversation to scripted menus?

## Recommendation and Budget

8. How should goals become equipment capabilities and then a coherent set?
9. How should versatility, progression, footprint, budget, and preference be
   weighted without filling every available metre?
10. What belongs in a realistic quote beyond headline equipment: flooring, bars,
    plates, storage, accessories, delivery, adapters, and declared assumptions?
11. What is the correct budget-overrun permission flow, and when should a modest
    overrun be shown beside a within-budget plan?
12. When is one alternative useful rather than choice overload?

## Catalogue and Datasheets

13. What minimum catalogue breadth demonstrates the concept while remaining
    governable?
14. Which equipment categories and tiers create meaningful fit, capability, and
    budget trade-offs?
15. Which fields are universal, category-specific, variant-specific, or
    compatibility-relationship-specific?
16. How can realistic fictional Northstar specifications be derived and cited
    without implying manufacturer affiliation?
17. How should unknown, conflicting, converted, approximate, and declared values
    appear in data and to customers?
18. Which values require field-level provenance?
19. How should price, stock, delivery, generations, variants, and schema changes be
    represented and refreshed in Google Sheets?

## Compatibility

20. Which physical and documentary factors actually determine rack-attachment
    compatibility?
21. Why can nominal metric/imperial or marketed dimensions mislead, and what can a
    dimensional match establish without catalogue approval?
22. What evidence supports explicitly compatible, conditional, dimensional-only
    unapproved, incompatible, and insufficient-information states?
23. How should failures, conditions, and alternatives be explained for different
    experience levels?
24. What may the upgrade journey responsibly do with partially specified,
    manually entered third-party equipment?

## Spatial Planning

25. Which equipment needs physical, user, loading, access, movement, folding,
    door-path, or maintenance zones?
26. Which clearances are documented facts and which are conservative Northstar
    planning assumptions?
27. How should ceiling height account for equipment, people, movement, and raised
    flooring?
28. Which operating zones may overlap and which must be exclusive?
29. Which constraint/layout approach best suits the prototype, and how should valid
    layouts be ranked?
30. How should dragging, rotation, locking, collision feedback, and recalculation
    preserve validity?
31. How should manually entered equipment occupy space when its operating envelope
    is unknown?

## 2D and 3D Experience

32. What coordinate system, units, origin, rotations, and placement object drive
    both views?
33. What detail makes equipment recognisable without commercial 3D assets?
34. Which 2D editing controls are essential for MVP?
35. Which camera, wall, zoom, lighting, loading, fallback, and mobile behaviours
    make 3D useful rather than decorative?
36. How are invalid placements and operating zones understandable visually and to
    screen-reader users?
37. What tests prove the canvas is nonblank, framed, synchronised, and responsive?

## AI, Tools, and State

38. What structured state and contracts are required for requirements, search,
    comparison, fit, compatibility, layout, and quote tools?
39. Which tasks belong to the language model and which remain deterministic?
40. What sequence prevents unverified recommendations, inventions, silent budget
    overruns, and failed calls being described as facts?
41. How do chat, direct edits, live refreshes, and visual manipulation converge on
    one canonical state?
42. What retrieval strategy handles goals, capabilities, colloquial language, and
    aliases more reliably than keyword search?
43. What happens when OpenAI, Google Sheets, WebGL, or records are unavailable,
    stale, malformed, incomplete, or slow?

## Safety, Trust, and Evaluation

44. Which statements about dimensions, loads, anchoring, support features,
    installation, and clearance are factual reporting versus safety certification?
45. How should steel gauge, spotter arms, adapters, and anchoring be explained
    without simplistic safety claims?
46. What uncertainty language preserves trust without exposing internal terms?
47. Which scenarios prove both journeys are genuine rather than scripted demos?
48. Which boundary, adversarial, freshness, accessibility, mobile, geometry,
    compatibility, budget, and visual tests are required before release?

## Carry-Forward Rule

Do not merely answer these in prose. Every accepted conclusion must become at
least one data field, deterministic rule, tool contract, user-flow requirement,
interface state, acceptance criterion, test fixture, provenance rule, or explicitly
logged prototype assumption.
