// if we sort the moves in alphabetical order we can ensure that two states
// that are equivalent become the same state string
function normaliseState(state) {
  return state.split(' ').sort().join(' ').trim();
}

function getWinner(state) {
  const winningSets = [
    [1,2,3], [4,5,6], [7,8,9], // horizontal
    [1,4,7], [2,5,8], [3,6,9], // vertical
    [1,5,9], [7,5,3]           // vertical
  ];
  const players = ['r', 'g'];
  const moves = state.split(' ');
  if (moves.length < 5) {
    return null;
  }
  for ( const player of players) {
    for (const set of winningSets) {
        if(set.every(move => state.indexOf(`${player}${move}`) !== -1)) {
          return player
        }
    }
  }
  return null;
}
