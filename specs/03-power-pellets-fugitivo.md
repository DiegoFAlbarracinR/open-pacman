# SPEC 03 — Power pellets que activan el modo fugitivo

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-09-12
> **Objetivo:** Añadir 4 power pellets que, al comerlos, ponen a los fantasmas azules y comibles durante 6 segundos para que Pac-Man pueda comérselos.

## Scope

**In:**

- 4 power pellets en `(1,3)`, `(26,3)`, `(6,23)` y `(20,23)`, representados con el código de celda `4` y el char `o` en `MAZE_STR`.
- Comer un power pellet: +50 puntos, cuenta como dot (`dotsRemaining--`) y activa el modo fugitivo.
- Modo fugitivo de 360 frames (6 s a 60 fps): fantasma azul, decisión de dirección aleatoria y velocidad reducida.
- Colisión con fantasma en modo fugitivo = Pac-Man se come al fantasma (no pierde vida).
- Puntos por fantasma comido: escalado clásico `200/400/800/1600`, que se reinicia al comer un power pellet nuevo.
- Fantasma comido → vuelve al pen por teleport con `inPen = true` y un temporizador propio (~180 frames); reaparece en `(14,11)`.
- Comer otro power pellet durante el fugitivo reinicia el contador a 360 (no suma).

**Out of scope (futuras specs):**

- "Ojitos" que recorren el laberinto de vuelta al pen (el retorno de esta spec es por teleport).
- Flash blanco-azul previo al fin del modo fugitivo.
- Música y efectos de sonido.
- Duración del fugitivo variable por nivel o dificultad.

## Data model

Nuevo código de celda (se suma a `1` pared, `2` dot, `3` puerta, `0` libre) y dos filas de `MAZE_STR` en `maze.js`:

```js
const POWER_PELLET = 4;
// parseTile: 'o' -> 4
// Fila 3:   '#o###.#####.##.#####.####o#'
// Fila 23:  '#...##o.............o.##...#'
//  'o' en fila 3 cols 1 y 26; en fila 23 cols 6 y 20
```

Nuevos campos de estado en `createGame()` (`game.js`):

```js
return {
  // ...existentes...
  frightenedTimer: 0,  // frames restantes del modo fugitivo
  ghostScoreMult: 1,   // 1,2,4,8 segun fantasmas comidos con el mismo pellet
  // en cada fantasma:
  respawnTimer: 0,     // frames restantes dentro del pen tras ser comido
};
```

Constantes (`game.js`):

```js
const FRIGHTENED_DURATION = 360; // 6 s a 60 fps
const FRIGHTENED_SPEED    = 0.06; // mas lento que GHOST_SPEED (0.1)
const GHOST_RESPAWN_TIME  = 180;  // 3 s dentro del pen
const GHOST_POINTS        = [ 200, 400, 800, 1600 ];
```

Reglas de integración:

- `dotsRemaining` cuenta celdas `2` **y** `4`; comer cualquiera la decrementa. No se puede ganar sin comer los pellets.
- Al pisar una celda `4`: +50 pts, celda → `0`, `dotsRemaining--`, `frightenedTimer = FRIGHTENED_DURATION`, `ghostScoreMult = 1`.
- En `update()`: decrementar `frightenedTimer` mientras `> 0`. Para cada fantasma con `respawnTimer > 0`: decrementar; al llegar a 0 → `inPen = false`, `respawnTimer = 0`, posición `(14,11)`.
- La salida escalonada inicial (SPEC 02) debe ignorar a los fantasmas en `respawnTimer > 0` (un fantasma comido no debe salir drásticamente por la condición del `ghostReleaseTimer` global ya superado).
- En la colisión: si `frightenedTimer > 0` → comer (puntos con `GHOST_POINTS` escalados por `ghostScoreMult`, luego `ghostScoreMult *= 2`, y `respawnTimer = GHOST_RESPAWN_TIME`, `inPen = true`, celda del pen de su índice en `GHOST_STARTS`); si no → pérdida de vida y `resetPositions()` como hoy.
- `moveGhost`: mientras `frightenedTimer > 0`, usar `FRIGHTENED_SPEED`. `decideGhost`: mientras `frightenedTimer > 0`, dirección aleatoria (reusa el fallback `random`). El color azul y el movimiento solo aplican a fantasmas fuera del pen.
- `drawGhost`: azul `'#2121ff'` mientras `frightenedTimer > 0`; **no** dibujar fantasmas con `respawnTimer > 0`.
- `drawDots`: la celda `4` se pinta como un dot grande (radio ~5) en vez del dot pequeño.

## Implementation plan

1. **El pellet se come** (`maze.js`, `game.js`, `render.js`): char `o` → `4` en las 4 celdas clásicas; `dotsRemaining` cuenta `2` y `4`; al pisar `4` → +50, celda `0`, `dotsRemaining--`; `drawDots` pinta `4` grande. Verificación: se ven 4 pellets grandes, comibles y que suman 50; se gana comiendo todo.
2. **Modo fugitivo** (`game.js`, `render.js`, `ghost-ai.js`): al comer `4` se fija `frightenedTimer = 360`; `update()` lo decrementa; `moveGhost` usa `FRIGHTENED_SPEED`, `decideGhost` elige aleatorio y `drawGhost` los pinta azules mientras `> 0`. Verificación: 6 s azules, lentos y erráticos; vuelven a la normalidad al expirar.
3. **Comer fantasmas + escala** (`game.js`): colisión con fugitivo → +`200·ghostScoreMult`, `ghostScoreMult *= 2`, el fantasma pasa a `respawnTimer = 180` / `inPen = true` / celda del pen; sin fugitivo → perder vida como hoy. Comer un pellet nuevo resetea `ghostScoreMult = 1`. Verificación: comer 4 seguidos suma 200/400/800/1600; fuera del fugitivo la colisión sigue restando vidas.
4. **Reaparición en el pen** (`game.js`, `render.js`): `update()` gestiona `respawnTimer` (y excluye del release inicial a los fantasmas comidos); al llegar a 0 salen por `(14,11)`; no se dibujan mientras `respawnTimer > 0`. Verificación: el comido desaparece y reaparece en la puerta ~3 s después, azul si el fugitivo sigue activo.

## Acceptance criteria

- [ ] Se ven exactamente 4 power pellets grandes en `(1,3)`, `(26,3)`, `(6,23)` y `(20,23)`.
- [ ] Comer un power pellet suma exactamente 50 puntos y reduce `dotsRemaining`.
- [ ] Al comer un power pellet, los 4 fantasmas se pintan de azul, se mueven más lento y eligen dirección aleatoria durante 6 segundos.
- [ ] Pasados los 6 segundos, los fantasmas vuelven a su color, velocidad e IA normales.
- [ ] Mientras están azules, chocar contra un fantasma lo "come": suma 200, 400, 800 o 1600 según el orden dentro del mismo pellet, sin perder vida.
- [ ] Comer un segundo power pellet durante el fugitivo reinicia el contador a 6 s y vuelve la escala a 200.
- [ ] Con fantasmas en color normal, la colisión mantiene la mecánica previa (resta una vida y hace `resetPositions`).
- [ ] El fantasma comido desaparece, y ~3 segundos después reaparece por `(14,11)`.
- [ ] Si el fugitivo sigue activo cuando reaparece, sale azul y vuelve a ser comible.
- [ ] Comer el último dot o pellet lleva la partida al estado `won`.
- [ ] No se puede ganar dejando power pellets sin comer.
- [ ] No hay errores en la consola del navegador.
- [ ] Mecánicas previas intactas: dots +10, vidas, túnel fila 14, estados start/playing/won/lost, salida escalonada del pen.

## Decisions

- **Sí:** 4 power pellets en las posiciones clásicas del arcade (aprobadas por el usuario).
- **Sí:** código de celda `4` con char `o` en `MAZE_STR`; el laberinto se autocontiene y `MAZE` sigue prístino (se copia en `createGame()`).
- **Sí:** duración 360 frames (6 s) medida en frames en `update()`, consistente con `ghostReleaseTimer` de SPEC 02.
- **Sí:** comportamiento clásico azul + aleatorio + más lento (`FRIGHTENED_SPEED = 0.06`).
- **Sí:** +50 pts por pellet y cuenta como dot para ganar.
- **Sí:** escala clásica `200/400/800/1600` con reinicio al comer un pellet nuevo (`ghostScoreMult`).
- **Sí:** el fantasma comido teleporta al pen con temporizador propio; "ojitos" fuera de scope.
- **Sí:** no dibujar fantasmas con `respawnTimer > 0`; evita un extraño "fantasma muerto" estático en el pen.
- **Sí:** comer otro pellet reinicia el temporizador (no suma), y la salida del pen ignora a los comidos durante su respawn.
- **No:** ojitos de retorno, flash de salida del fugitivo, sonido, dificultad variable por nivel. Cada uno va en su propia spec.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Un fantasma comido reaparece en `(14,11)` por la condición del `ghostReleaseTimer` global ya superado | La salida inicial ignora a los fantasmas con `respawnTimer > 0`; su salida la gobierna el temporizador propio |
| Fantasmas que reaparecen juntos se solapan en `(14,11)` | Transitorio y aceptado (mismo caso que la salida inicial del pen en SPEC 01/02) |
| La escala 1600 exige comer 4 seguidos en 6 s | Es el desafío clásico; no bloquea criterios; se rebalancea en otra spec si se considera excesivo |

## What is **not** in this spec

- "Ojitos" que recorren el laberinto de vuelta al pen.
- Flash blanco-azul al terminar el modo fugitivo.
- Música / efectos de sonido.
- Duración del fugitivo distinta por nivel o dificultad.

Cada uno de esos, si llega, va en su propia spec.