// ghost-ai.js
// IA de los fantasmas: decide la direccion de cada fantasma segun su kind.
// Depende de globals de game.js: DIRS, OPPOSITE, canMove.

// Una celda bloqueante para un objetivo: pared o fuera del laberinto.
function isBlockingCell( grid, x, y ) {
  if ( y < 0 || y >= grid.length ) return true;
  if ( x < 0 || x >= grid[ 0 ].length ) return true;
  return grid[ y ][ x ] === 1;
}

// Celda objetivo del fantasma segun su kind.
function ghostTarget( game, g ) {
  const px = Math.round( game.pacman.x );
  const py = Math.round( game.pacman.y );

  if ( g.kind === 'timid' ) {
    // Si esta cerca de Pac-Man (distancia Manhattan <= 8) no persigue:
    // devuelve null para que decideGhost elija direccion aleatoria.
    const dist = Math.abs( g.x - px ) + Math.abs( g.y - py );
    if ( dist <= 8 ) return null;
  }

  if ( g.kind === 'ambusher' ) {
    // 4 celdas por delante de Pac-Man; si caen en pared o fuera -> su celda.
    const d = DIRS[ game.pacman.dir ];
    const tx = px + d.x * 4;
    const ty = py + d.y * 4;
    if ( !isBlockingCell( game.grid, tx, ty ) ) return { x: tx, y: ty };
  }

  if ( g.kind === 'cutter' ) {
    // pivot = 2 celdas por delante de Pac-Man; objetivo = 2·pivot - Blinky.
    const d = DIRS[ game.pacman.dir ];
    const pivotX = px + d.x * 2;
    const pivotY = py + d.y * 2;
    const blinky = game.ghosts.find( ( other ) => other.kind === 'hunter' );
    const tx = 2 * pivotX - Math.round( blinky.x );
    const ty = 2 * pivotY - Math.round( blinky.y );
    if ( !isBlockingCell( game.grid, tx, ty ) ) return { x: tx, y: ty };
  }

  return { x: px, y: py };
}

function decideGhost( game, g ) {
  const grid = game.grid;

  // Fantasma dentro del pen: no calcula direccion (defense-in-depth;
  // moveGhost ya bloquea su movimiento).
  if ( g.inPen ) return;

  const options = Object.keys( DIRS ).filter(
    ( dir ) => dir !== OPPOSITE[ g.dir ] && canMove( grid, g.x, g.y, dir, 'ghost' )
  );
  // Sin salida (callejon): permitir el giro de 180.
  const choices = options.length ? options : [ '' + OPPOSITE[ g.dir ] ];

  // Fallback interno: kind 'random' y cualquier kind sin objetivo.
  const target = ghostTarget( game, g );
  if ( g.kind === 'random' || !target ) {
    g.dir = choices[ Math.floor( Math.random() * choices.length ) ];
    return;
  }

  const tx = Math.round( target.x );
  const ty = Math.round( target.y );
  let best = choices[ 0 ];
  let bestDist = Infinity;
  for ( const dir of choices ) {
    const d = DIRS[ dir ];
    const nx = g.x + d.x;
    const ny = g.y + d.y;
    const dist = Math.abs( nx - tx ) + Math.abs( ny - ty );
    if ( dist < bestDist ) {
      bestDist = dist;
      best = dir;
    }
  }
  g.dir = best;
}

window.decideGhost = decideGhost;
