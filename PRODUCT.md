# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One person: the owner, cooking pizza at home and using the page to remember the steps. Typically on a phone in the kitchen, mid-recipe, possibly with messy hands. Installed as a PWA from the home screen.

## Product Purpose

A personal recipe reference for Neapolitan-style home pizza (about 12 hours of cold fermentation, double bake, puffy crust), laid out as a 10-step guide with exact quantities. It is not a commercial product. Success means the owner can recall the next step at a glance without rereading. It is also a personal playground for web design and animated interaction.

## Operating Context

- Used live while cooking: quick lookups of quantities, timings, and the next step.
- Installable and offline-capable (manifest and service worker present).
- Light and dark themes, following system preference with a manual toggle.

## Capabilities and Constraints

- Static site: plain HTML, CSS, and JS with no build step (`index.html`, `style.css`, `script.js`, `sw.js`).
- Bilingual: Catalan (primary) and Spanish are full parallel translations, switched in-page. Every content or UI change must be made in both.
- Content today: hero with total time, yield (2 balls of 260 g), and step count; ingredient lists; 10 steps.
- Undecided: whether the page gets cooking-time helpers (timers, checklists); not requested.

## Brand Commitments

- Name: "Pizza, pas a pas".
- Primary language Catalan, with Spanish alongside.

## Evidence on Hand

- The recipe content itself in `index.html`, in both languages.
- No photography, testimonials, or external proof exist. Do not fabricate any.
- `pizza-paso-a-paso.html` and `Main.dc.html` are design-canvas exports from earlier exploration; `index.html` is the live site.

## Product Principles

1. Readability and usability come first; the page must work at a glance while cooking.
2. Motion and interaction are welcome and valued, as long as they never hurt reading or task flow.
3. Catalan and Spanish stay at parity; no change ships in one language only.
4. Stay lightweight and offline-friendly: no build step, no heavy dependencies.
5. Only real recipe facts: quantities, times, and notes come from the owner.

## Accessibility & Inclusion

No specific standard was stated. Practical needs: legible in kitchen lighting and at arm's length on a phone, and large tap targets for use with messy hands.
