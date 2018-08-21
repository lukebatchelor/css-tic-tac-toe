const fs = require('fs');
const path = require('path');


const outputPath = path.join(__dirname, '..', 'dist', 'index.html');

const WINNING_SETS = [
  [1,2,3], [4,5,6], [7,8,9], // horizontal
  [1,4,7], [2,5,8], [3,6,9], // vertical
  [1,5,9], [7,5,3]           // diagonal
];
const PLAYER = 'r';
const COMPUTER = 'g';

// If we sort the moves in alphabetical order we can ensure that two states
// that are equivalent become the same state string
function normaliseState(state) {
  return state.split('-')
    .filter(Boolean) // Remove empty strings
    .sort()
    .join('-');
}

function extractPlayersMoves(state) {
  const oppMoves = (state.match(/r([0-9])/g) || [])
    .map(move => move.charAt(1))
    .map(move => parseInt(move, 10));
  const ourMoves = (state.match(/g([0-9])/g) || [])
    .map(move => move.charAt(1))
    .map(move => parseInt(move, 10));

  return {
    oppMoves,
    ourMoves
  }
}

function getComputerMove(state) {
  const { oppMoves, ourMoves } = extractPlayersMoves(state);
  const winner = getWinner(state);
  if (winner) return null;

  // We partially hardcode the first two moves
  // If they play center, play an arbitrary corner, else, we play center
  if (oppMoves.length === 1) return oppMoves[0] === 5 ? 9 : 5;
  if (oppMoves.length === 2) {
    // On the second turn, the only special cose we care about is if they
    // control two opposite corners (we know we must control the center). If
    // they do, then we MUST force them to block by playing an edge or they
    // can fork and create two win conditons
    if (oppMoves.includes(1) && oppMoves.includes(9)) return 2;
    if (oppMoves.includes(3) && oppMoves.includes(7)) return 2;
    // Other than this, we can safely fallback to the default strategy
  }
  // If there is a winning move we can make: make it
  for (let set of WINNING_SETS) {
    const weStillNeed = set.filter(move => !ourMoves.includes(move));
    const oppHas = set.filter(move => oppMoves.includes(move));

    if (weStillNeed.length === 1 && oppHas.length === 0) {
      return weStillNeed[0]; // We win!
    }
  }
  // If there is a winning move they can make: block it
  for (let set of WINNING_SETS) {
    const oppStillNeeds = set.filter(move => !oppMoves.includes(move));
    const weHave = set.filter(move => ourMoves.includes(move));

    if (oppStillNeeds.length === 1 && weHave.length === 0) {
      return oppStillNeeds[0]
    }
  }
  // Otherwise just pick an empty square, preferring a corner first
  const emptySquares = [5,1,3,7,9,2,4,6,8].filter(sq => !state.includes(sq));

  return emptySquares[0];
}

function getWinner(state) {
  const { oppMoves, ourMoves } = extractPlayersMoves(state);

  if (oppMoves.length < 3) return null;

  for (const set of WINNING_SETS) {
    if (set.every(move => oppMoves.includes(move))) return PLAYER;
    if (set.every(move => ourMoves.includes(move))) return COMPUTER;
  }
  if (oppMoves.length === 5) return 'd'; // It's a draw!

  return null;
}

function getHtmlForState(state) {
  const winner = getWinner(state);

  // Map over each of the next moves the player can make
  const nextStates = [1,2,3,4,5,6,7,8,9].map(possibleMoveIdx => {
    // A move is only legal if it hasn't been played before and there is no winner
    const isLegalMove = !state.includes(possibleMoveIdx) && !winner;
    if (isLegalMove) {
      const tempState = normaliseState(`${state}-${PLAYER}${possibleMoveIdx}`);
      // If there was a move the player can make, calculate our counter
      const ourMove = getComputerMove(tempState);
      if (ourMove) {
        return normaliseState(`${tempState}-${COMPUTER}${ourMove}`);
      }
      // If there is no legal move we can make, then we stay in tempState
      return tempState;
    }
    // If the move was not legal, we stay in the current state
    return state;
  });


  const winnerClass = winner ? `winner-${winner}` : '';
  const stateClasses = state.replace(/-/g, ' ');

  const stateHtml = `<input type="radio" name="game-state" id="${state}">
    <div class="game ${stateClasses} ${winnerClass}">
      ${nextStates.map(next => `<label for="${next}"></label>`).join('\n  ')}
    </div>`;
  return stateHtml;
}

function getAllStates() {
  let allStates = new Set();
  const curStates = new Set(['']);

  allStates = getNextStates(allStates, curStates, 0);

  return allStates;
}


function getNextStates(allStates, curStates, depth) {
  const newStates = new Set();
  console.log(`depth=${depth}, states=${allStates.size}`);

  curStates.forEach(state => {
    // Each state will be in the players turn, so check all the legal moves they can make
    const legalMoves = getLegalMoves(state);
    legalMoves.forEach(moveIdx => {
      let newState = normaliseState(`${state}-${PLAYER}${moveIdx}`);
      const ourMove = getComputerMove(newState);
      if (ourMove) {
        newState = normaliseState(`${newState}-${COMPUTER}${ourMove}`);
      }
      if (!allStates.has(newState)) {
        newStates.add(newState);
      }
    })
  });

  if (newStates.size === 0) {
    return allStates;
  }
  return getNextStates(new Set([...allStates, ...newStates]), newStates, depth + 1);
}

function getLegalMoves(state) {
  const winner = getWinner(state);
  if (winner) {
    return [];
  }
  return [1,2,3,4,5,6,7,8,9].filter(move => state.indexOf(move) === -1);
}


console.log('~~~~ Building CSS-Tic-Tac-Toe 2 Player... ~~~')
const startTime = +new Date();
const allStates = getAllStates();
const endTime = +new Date();

console.log('Found ', allStates.size, 'states in ', (endTime - startTime), 'milliseconds');
console.log('Mapping to board states...');
const allStatesArr = Array.from(allStates);
const allStateStrings = allStatesArr.map(getHtmlForState);

const htmlTemplate = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>CSS Tic Tac Toe AI</title>
    <link href="styles.css" rel="stylesheet"></head>
  </head>
  <body>
  <div class="app">
    <h1>CSS Tic Tac Toe AI</h1>
    <p>This game is built entirely out of HTML and CSS, no JavaScript™ at all!</p>
    <p>Or go <a href="./2">here</a> if you would like a 2-player version!</p>
    <br><br>
    <input type="radio" name="game-state" id="start" checked>
    <div class="game">
      <label for="g5-r1"></label>
      <label for="g5-r2"></label>
      <label for="g5-r3"></label>
      <label for="g5-r4"></label>
      <label for="g9-r5"></label>
      <label for="g5-r6"></label>
      <label for="g5-r7"></label>
      <label for="g5-r8"></label>
      <label for="g5-r9"></label>
    </div>
    ${allStateStrings.join('\n')}
    <label for="start" id="resetButton">Reset</label>
    <p>Check out <a href="https://github.com/lukebatchelor/css-tic-tac-toe">lukebatchelor/css-tic-tac-toe</a> if you're interested in how it works!</p>
  </div>
  <a href="https://github.com/lukebatchelor/css-tic-tac-toe"><img style="position: absolute; top: 0; right: 0; border: 0;" src="https://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png" alt="Fork me on GitHub"></a>
  </body>
  </html>
`;
console.log('Done!');
console.log('Writing to', outputPath);

fs.writeFileSync(outputPath, htmlTemplate);
console.log('Done!');
