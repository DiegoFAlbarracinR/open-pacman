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

  const options = Object.keys( DIRS ).filter(
    ( dir ) => dir !== OPPOSITE[ g.dir ] && canMove( grid, g.x, g.y, dir, 'ghost' )
  );
  // Sin salida (callejon): permitir el giro de 180.
  const choices = options.length ? options : [ '' + OPPOSITE[ g.dir ] ];

  // Cualquier kind sin IA propia aun cae en el fallback aleatorio.
  if ( g.kind !== 'hunter' && g.kind !== 'ambusher' && g.kind !== 'cutter' ) {
    g.dir = choices[ Math.floor( Math.random() * choices.length ) ];
    return;
  }

  const target = ghostTarget( game, g );
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