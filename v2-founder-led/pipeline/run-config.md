# Pipeline Run Configuration

## Required Inputs

- Founder charter reviewed: `yes`
- Research-led authority reviewed: `yes`
- Research-led authority path: `research-led-authority.md`
- Deep Research report present: `yes`
- Deep Research report path: `research-inputs/deep-research-report.md`
- Research question register present: `yes`
- Research question register path: `research-inputs/research-question-register.md`

## Runtime Decisions

- Product outcomes and trust boundaries: `founder-controlled`
- Design and implementation method: `research-led`
- Preferred implementation stack: `Researcher and Maker to select from evidence`
- Live catalogue: `Google Sheets, unless research establishes a better supporting
  architecture while retaining genuine live external data`
- Region/currency/units: `Ireland and Europe / EUR / metric`
- Existing v1 must remain untouched: `yes`

## External Actions Authorised by Founder

- Install required dependencies: `authorised`
- Create or modify the prototype Google Sheet: `authorised`
- Create required external cloud services: `authorised`
- Publish or redeploy frontend and backend: `authorised`
- Push v2 changes to GitHub: `authorised`

Authorisation permits actions necessary for this product run; it does not permit
exposing secrets, deleting unrelated resources, altering v1, or incurring paid
services without a separate cost decision. Prefer free-tier services suitable for
the prototype and document every external resource created.

## OpenAI Credential

The Maker must verify that an API key is available through a non-committed
environment setting before model integration. Never print, copy into source, or
commit the key. If the only available credential is known to have been disclosed,
stop that integration step and request a fresh key.

## Run Behaviour

Do not interrupt the authorised run for ordinary research, design, engineering,
testing, deployment, or repair choices. Ask the founder only for a genuinely
strategic decision, inaccessible account action, new paid commitment, or security
issue that cannot be resolved conservatively.
