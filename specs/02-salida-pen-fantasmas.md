# SPEC 02 — Salida escalonada de fantasmas del pen

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-12
> **Objetivo:** Que los fantasmas arranquen dentro del pen y salgan de forma escalonada con un campo `inPen` que controle su estado.

## Scope

**In:**

- Campo `inPen: true/false` en cada objeto fantasma (se añade en `createGame()`).
- Posición de salida del pen: celda `(14, 11)` — encima de la puerta, fuera del pen.
- Fantasma dentro del pen: `inPen === true`, se queda estático (no se mueve).
- Salida escalonada clásica: Blinky sale primero, luego Pinky ~3 segundos después, Inky ~6 segundos después, Clyde ~9 segundos después (desde el inicio de la partida).
- `decideGhost` no calcula dirección si `inPen === true`.

**Out of scope (futuras specs):**

- Retorno al pen tras perder una vida ("ojitos").
- Velocidad distinta dentro del pen.
- Visual de animación del pen (el fantasma simplemente desaparece del pen y aparece fuera).
- Cambio de modo a fugitivo/azul.

## Data model

Cambio en `createGame()` — nuevo campo `inPen` en cada fantasma:

```js
ghosts: GHOST_STARTS.map( ( g ) => ( {
  x: g.x,
  y: g.y,
  dir: 'up',
  speed: GHOST_SPEED,
  kind: g.kind,
  inPen: true,   // ← nuevo
} ) ),
```

Temporizador de salida — se añade al estado del juego:

```js
return {
  // ...existentes...
  ghostReleaseTimer: 0,  // frames desde el inicio de la partida
};
```

Tiempos de salida (en frames, a 60 fps):

- Blinky (hunter): `0` — sale inmediatamente al pasar a `playing`.
- Pinky (ambusher): `180` — 3 segundos.
- Inky (cutter): `360` — 6 segundos.
- Clyde (timid): `540` — 9 segundos.

Convención: el orden de salida se define por el índice en `GHOST_STARTS` (0 = Blinky, 1 = Pinky, 2 = Inky, 3 = Clyde).

## Implementation plan

1. **Añadir `inPen` al fantasma en `createGame()`** (`game.js`): cada fantasma arranca con `inPen: true`. Verificación: consola sin errores, juego arranca igual que antes (fantasmas visibles dentro del pen).
2. **Añadir `ghostReleaseTimer` al estado del juego** (`game.js`): se incrementa cada frame en `update()` mientras `state === 'playing'`. Verificación: consola sin errores.
3. **Lógica de salida escalonada en `update()`** (`game.js`): al inicio de cada frame, comprobar `ghostReleaseTimer` contra los tiempos de cada fantasma; si corresponde, poner `inPen = false` y mover el fantasma a `(14, 11)`. Verificación: al iniciar la partida, Blinky aparece fuera del pen inmediatamente; los demás permanecen visibles dentro del pen.
4. **Parar movimiento de fantasmas en pen** (`game.js`): en `moveGhost()`, si `g.inPen === true`, no ejecutar lógica de movimiento ni de dirección — el fantasma queda estático. Verificación: los fantasmas en pen no se mueven; Blinky (fuera del pen) sí se mueve con IA normal.
5. **`decideGhost` respeta `inPen`** (`ghost-ai.js`): al inicio de `decideGhost`, si `g.inPen === true`, retornar sin hacer nada (ya cubierto por el paso 4, pero defense-in-depth). Verificación: sin cambios visuales adicionales.

## Acceptance criteria

- [ ] Al iniciar la partida, los 4 fantasmas aparecen inicialmente dentro del pen en `(13,14)` y `(14,14)`.
- [ ] Blinky (rojo) aparece fuera del pen en `(14,11)` inmediatamente al pasar a estado `playing`.
- [ ] Pinky (rosa) aparece fuera del pen ~3 segundos después del inicio de la partida.
- [ ] Inky (cian) aparece fuera del pen ~6 segundos después del inicio de la partida.
- [ ] Clyde (naranja) aparece fuera del pen ~9 segundos después del inicio de la partida.
- [ ] Los fantasmas dentro del pen (`inPen === true`) no se mueven ni cambian de dirección.
- [ ] Los fantasmas fuera del pen (`inPen === false`) se mueven y persiguen con IA según su `kind`.
- [ ] No hay errores en la consola del navegador.
- [ ] Las mecánicas previas se mantienen intactas (dots, vidas, estados del juego).

## Decisions

- **Sí:** campo `inPen` en el objeto fantasma — permite reutilizarlo para retorno al pen en specs futuras.
- **Sí:** posición de salida `(14, 11)` — celda vacía encima de la puerta, fuera del pen.
- **Sí:** temporizador en frames del juego (no `setTimeout`) — mantiene la lógica dentro del game loop y es consistente con el resto del código.
- **Sí:** fantasma estático dentro del pen — simplifica la implementación; el rebote de animación dentro del pen va en otra spec.
- **Sí:** check de `inPen` en `decideGhost` como defense-in-depth, aunque `moveGhost` ya lo bloquea.
- **No:** retorno al pen ("ojitos") — se deja para una spec futura que use el campo `inPen`.
- **No:** visual especial del pen — por ahora los fantasmas simplemente aparecen fuera sin transición.

## What is **not** in this spec

- Retorno al pen tras perder una vida ("ojitos").
- Animación de fantasmas dentro del pen (rebotar arriba/abajo).
- Modo fugitivo / fantasmas azules.
- Velocidad distinta para cada fantasma.
- Visual de transición al salir del pen.

Cada uno de esos, si llega, va en su propia spec.