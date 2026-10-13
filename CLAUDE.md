<liminal_design>
This is the website for Liminal Games Studio, an independent studio making low-poly
games. It is a static site (index.html, 404.html, styles.css, facets.js, and the Poly
Blockade support/privacy pages). No framework, no build step.

The site already has a visual identity. Extend it; don't reinvent it. Generic output
(stock hero, card grids, gradient blobs, icon rows) is the failure to avoid, but so is
novelty for its own sake. Every choice should come from the games themselves.

Identity
- Geometry: low-poly, flat-shaded facets. facets.js paints them from CSS tokens
  (data-stops, data-ridge, data-animate). When a section needs atmosphere, use a facet
  canvas. Don't add gradient layers, blobs, noise or patterns.
- Day and night: Poly Blockade is the day world (--pb-* tokens: teal, green, yellow,
  dark text). Leave No Witnesses is the night world (--lnw-* tokens: indigo to plum,
  light text). The page moves from day into night as you scroll. New content belongs
  to one world or to the neutral studio layer (--bg, --fg, --muted, --line).
- Type: Archivo only, self-hosted in fonts/. Its width axis is the identity: wide for Poly Blockade,
  condensed for Leave No Witnesses, normal width for studio text. No second font
  family, no monospace labels, no all-caps eyebrow labels.
- Color: every color is a token in styles.css :root. Use the existing ones. If you
  need a new one, add it there and to both dark-mode blocks (the prefers-color-scheme
  block and :root[data-theme="dark"]). No raw hex values in components.

Restraint
- The last redesign removed ornament and the site got better. Before adding a
  decorative element, ask what it tells a visitor about the games. If nothing, cut it.
- One strong idea per section beats several small ones.

Motion
- CSS first. Use JS only where CSS can't do the job (as facets.js does for the light).
- Motion should mean something in game terms: the detection meter filling, light
  moving across facets. No blanket fade-up-on-scroll.
- Every animation has a prefers-reduced-motion path, and the page is complete and
  readable with motion off.

Copy
- Plain, concrete, short. Say what the game is and what you do in it: "Guards hunt
  you by sight and sound," not "an immersive stealth experience."
- No superlatives. Never invent features, dates, prices, platforms or quotes. Mark
  anything unconfirmed as <mark class="todo">[what's needed]</mark>; the draft banner
  appears automatically.

Constraints
- Design for phones first: Poly Blockade is a mobile game, so many visitors arrive on
  phones. Keep the --gutter side margin (16px minimum) and no horizontal scroll.
- Text meets WCAG AA contrast in both themes and on both worlds' backgrounds.
- No new libraries or CDN scripts without asking. Facet canvases are the heaviest
  thing on the page, so add them sparingly.
- Semantic HTML, a real heading order, visible focus states.
- Pages load styles.css and facets.js with a ?v=N query so browsers don't pair new
  HTML with a cached old file. When either file changes, bump its N in every page
  (index.html, 404.html and both poly-blockade pages).
</liminal_design>
