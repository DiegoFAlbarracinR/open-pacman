# AGENTS.md

Pac-Man en vanilla JS/HTML/CSS. Sin build, sin npm, sin tests: se ejecuta abriendo `src/index.html` en un navegador. El repo está en español (README, comentarios, specs).

## Verificación
- No hay tooling: no instalar dependencias ni correr build/lint/test/typecheck.
- Verificar manualmente en el navegador. Estados de juego: `start`, `playing`, `won`, `lost`.

## Arquitectura (crítico)
- Sin módulos ES: scripts clásicos cargados en orden en `src/index.html` (`maze.js` → `game.js` → `render.js` → `main.js`), comunicando vía globals de `window`:
  - maze.js: `MAZE`, `TUNNEL_ROW`, `PACMAN_START`, `GHOST_STARTS`
  - game.js: `createGame`, `update`, `DIRS`
  - render.js: `draw`
- Todo archivo JS nuevo debe añadirse como `<script>` en `src/index.html` **antes de** `main.js`, y sus globals expuestos con `window.X = X`.
- `MAZE` (28x31) es prístino: `createGame()` lo copia por partida. Nunca mutarlo directamente (comer dots mutaría el original).
- Códigos de celda: `1` pared, `2` dot, `3` puerta del pen (bloquea solo a Pac-Man), `0` pasable. Tile 20px → canvas 560x620.
- Pac-Man sale en `PACMAN_START` (13,23). Túnel en `TUNNEL_ROW` = 14. Fantasmas: `kind: 'hunter'` persigue (Manhattan), `'random'` elige al azar.

## Spec-driven development
- Features nuevas pasan por `specs/NN-slug.md` (numeración secuencial, en español) antes de escribir código.
- Skills locales en `.agents/skills/`: `/spec` crea la spec; `/spec-impl` implementa y exige estado "Aprobado", crea rama `spec-NN-slug` (config `specs/.spec-config.yml`, `AutoCreateBranch`). No hay specs aún.

## Estilo
- Comentarios en español. Estilo de código con espacios dentro de paréntesis/corchetes: `f( a, b )`, `grid[ 0 ].length`, `( x, y )`.