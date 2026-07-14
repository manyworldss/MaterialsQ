# UX Design Prompts & Heuristics (Impeccable Playbook)

Use these prompts and heuristics on future projects to ensure your UIs look premium, bespoke, and explicitly avoid the "AI-generated" look. 

## 1. The "Anti-AI Slop" Design Prompt
Copy and paste this into any AI agent when starting a new design task to set strict visual guardrails:

> **Prompt:** "Design this interface with a strict ban on common AI design clichés. Do NOT use: side-stripe colored borders on cards/alerts, gradient text (background-clip: text), glassmorphism as a default, the 'hero-metric template' (big number, small label, gradient accent), identical card grids repeated endlessly, or the 'kicker' eyebrow (tiny uppercase tracked text above every section). If the brief is 'warm', do not default to a near-white tinted background. Use a confident, bespoke typography pairing (e.g., Serif display + Sans body, or Display + Mono) and a highly restrained color palette. The surface should feel intentional, not scaffolded."

## 2. The UX Critique / Persona Audit Prompt
When you have an existing UI that needs to be audited, use this prompt to force the AI to evaluate it rigorously rather than just saying "it looks good":

> **Prompt:** "Act as a strict Design Director. Audit this UI against Nielsen's 10 Usability Heuristics and score it out of 40. Then, run a Persona-Based Stress Test using these three profiles:
> 1. **Alex (Impatient Power User):** Looks for keyboard shortcuts, batch edits, hates unskippable onboarding.
> 2. **Sam (Accessibility-Dependent):** Uses keyboard navigation, requires 4.5:1 contrast, screen reader compatibility.
> 3. **Casey (Distracted Mobile User):** One-handed thumb use, slow connection, gets interrupted.
> List specific P0 (Blocking) and P1 (Major) red flags for each persona. Do not soften criticism."

## 3. The Cognitive Load Check
Use this to simplify complex screens:

> **Prompt:** "Evaluate this screen for cognitive load. Apply the Working Memory Rule (humans can hold ≤4 items in memory at once). Identify any 'Wall of Options' (10+ choices with no hierarchy), 'Memory Bridges' (forcing a user to remember info from step 1 in step 3), or 'Context Switches'. Propose specific ways to chunk, group, and progressively disclose this information."

## 4. Color & Theming Strategy
When defining a new palette, force the AI to commit to a strategy rather than mixing everything:

> **Prompt:** "Before picking colors, pick ONE color strategy from this list: 
> 1. Restrained (tinted neutrals + one accent ≤10%)
> 2. Committed (one saturated color carries 30–60% of the surface)
> 3. Full palette (3–4 named roles, deliberate)
> 4. Drenched (the surface IS the color). 
> Pick the strategy first, then define the palette using OKLCH. Ensure the background color is explicitly chosen (e.g., true off-white, deep ochre, terracotta) and not just a generic AI-default 'warm cream'."

## 5. UI Polish & Typography
For the final mile of a design:

> **Prompt:** "Polish this component's typography and layout. Ensure body line length is capped at 65–75ch. Apply `text-wrap: balance` to headings and `text-wrap: pretty` to body prose. Verify that there are no layout property animations (do not animate width/height/padding/margin; use transform/opacity only). Ensure consistent padding rhythms (e.g., 8px/16px/24px system)."

