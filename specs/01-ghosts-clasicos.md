# SPEC 01 — Cuatro fantasmas con personalidad propia

> **Estado:** Aprobado
> **Depende de:** ninguno
> **Fecha:** 2026-09-12
> **Objetivo:** Dotar al juego de 4 fantasmas con IA propia (Blinky, Pinky, Inky, Clyde), siendo Blinky el que persigue agresivamente a Pac-Man.

## Scope

**In:**

- 4 fantasmas en partida, definidos en `GHOST_STARTS`.
- IA por `kind` con el esquema actual: celda objetivo y minimizar distancia Manhattan.
- Nuevo módulo `src/js/ghost-ai.js` con la decisión por kind.
- Color fijo por `kind` (rojo, rosa, cian, naranja).
- Los 4 arrancan en el pen: (13,14) y (14,14) a pares.

**Out of scope (futuras specs):**

- Punto energizante / modo fugitivo (fantasmas azules que dan puntos).
- Salida escalonada del pen con temporizador.
- "Ojitos" que vuelven al pen tras perder una vida.
- Velocidades distintas por fantasma.
- Dificultad creciente por nivel.
- Nombres visibles en HUD.

## Data model

No hay campos nuevos en el fantasma: `createGame()` no cambia, solo copia el `kind`. Cambia `GHOST_STARTS` en `maze.js`:

```js
const GHOST_STARTS = [
  { x: 13, y: 14, kind: 'hunter'   }, // Blinky
  { x: 14, y: 14, kind: 'ambusher' }, // Pinky
  { x: 13, y: 14, kind: 'cutter'   }, // Inky
  { x: 14, y: 14, kind: 'timid'    }, // Clyde
];
```

Comportamiento por kind (en `src/js/ghost-ai.js`, `decideGhost`): se calcula una celda objetivo y se elige la dirección candidata que minimiza la distancia Manhattan a esa celda.

- `hunter` -> celda de Pac-Man.
- `ambusher` -> celda de Pac-Man + 4·`DIRS[dir]`; si esa celda es pared o queda fuera del laberinto -> celda de Pac-Man.
- `cutter` -> `pivot` = celda de Pac-Man + 2·`DIRS[dir]`; Blinky = el fantasma con `kind: 'hunter'`; objetivo = `2·pivot - celda de Blinky`; si es pared o queda fuera -> celda de Pac-Man.
- `timid` -> si la distancia Manhattan al fantasma es > 8 -> celda de Pac-Man; si es ≤ 8 -> dirección aleatoria.
- `random` se mantiene soportado como fallback interno, pero ningún fantasma de `GHOST_STARTS` lo usa.

Cambia el mapa de colores en `render.js`:

```js
const GHOST_COLORS = {
  hunter: '#ff0000',
  ambusher: '#ffb8ff',
  cutter: '#00ffff',
  timid: '#ffb852',
};
```

## Implementation plan

1. **`ghost-ai.js` + `index.html`:** añadir `<script src="js/ghost-ai.js"></script>` después de `game.js`; mover ahí la lógica actual (hunter + random) a `window.decideGhost`; `game.js` delega en `window.decideGhost( game, g )`. Verificación: partida idéntica a hoy con 2 fantasmas, sin errores en consola.
2. **4 fantasmas + color por kind:** expandir `GHOST_STARTS` a 4 entradas y pasar `render.js` al mapa por kind. Verificación: se ven 4 fantasmas de 4 colores; los kinds nuevos aún caen en el fallback aleatorio (funcional provisionalmente).
3. **`ambusher`:** objetivo a 4 celdas delante de Pac-Man con fallback a su celda. Verificación: el rosa se anticipa a la dirección de Pac-Man.
4. **`cutter`:** objetivo combinado con Blinky (2·pivot - celda de Blinky). Verificación: el cian no repite trayectoria del rojo ni del rosa.
5. **`timid`:** umbral 8 (persigue si está lejos, aleatorio si está cerca). Verificación: el naranja se vuelve errático al acercarse.

## Acceptance criteria

- [ ] Al iniciar partida aparecen exactamente 4 fantasmas: rojo, rosa, cian y naranja, uno de cada color.
- [ ] El rojo persigue agresivamente a Pac-Man, aproximándose por el camino de menor distancia Manhattan.
- [ ] El rosa se dirige a la zona 4 celdas por delante de la dirección de Pac-Man, no a su posición.
- [ ] El cian no duplica la trayectoria del rojo ni del rosa; su ruta depende de Blinky y Pac-Man a la vez.
- [ ] El naranja deja de perseguir y elige direcciones erráticas cuando está a ≤ 8 celdas de Pac-Man; persigue cuando está más lejos.
- [ ] Mecánicas previas intactas: comer dots suma 10 puntos, vidas, estados start/playing/won/lost, túnel por la fila 14.
- [ ] La consola del navegador no muestra errores.
- [ ] La partida se puede ganar (`won`) y perder (`lost`) igual que antes.

Verificación manual (no hay tooling): abrir `src/index.html` y observar los 4 comportamientos.

## Decisions

- **Sí:** 4 personalidades clásicas (Blinky/Pinky/Inky/Clyde) en vez de variantes genéricas; mapean a los 4 colores ya reservados.
- **Sí:** misma `GHOST_SPEED` para todos; solo difiere la IA.
- **Sí:** IA en módulo propio `ghost-ai.js` (regla de AGENTS.md: script antes de `main.js`, globals en `window`).
- **Sí:** color fijo por kind, no por índice; una reordenación futura no rompe los colores clásicos.
- **Sí:** los 4 arrancan en el pen; el solapamiento en (13,14)/(14,14) es transitorio y aceptado.
- **Sí:** fallback de Pinky e Inky a la celda de Pac-Man cuando el objetivo calculado es pared o queda fuera; más simple y predecible que el wrap clásico.
- **Sí:** umbral de Clyde = 8 (Manhattan), valor oficial del arcade.
- **No:** modo fugitivo/energizante, salida escalonada, ojitos de retorno, velocidades propias, dificultad por nivel, nombres en HUD. Cada uno va en su propia spec.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Inky calcula objetivo fuera del laberinto (2·pivot - blinky puede salirse) | Fallback a la celda de Pac-Man, misma regla que Pinky |
| 3 perseguidores pueden hacer casi imposible ganar la partida | Observar en la verificación manual; si es excesivo, se rebalancea en otra spec (no bloquea esta) |
| Solapamiento inicial de fantasmas que parece un bug | Es transitorio y en dos celdas adyacentes del pen |

## What is **not** in this spec

- Punto energizante / fantasmas fugitivos azules.
- Salida escalonada del pen.
- "Ojitos" de retorno al pen tras chocar.
- Velocidades distintas por fantasma.
- Dificultad creciente por nivel.
- Nombres visibles en pantalla.

Cada uno de esos, si llega, va en su propia spec.