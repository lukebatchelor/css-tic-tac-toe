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
  </div>
  <a href="https://github.com/lukebatchelor/css-tic-tac-toe" class="github-corner" aria-label="View source on Github"><svg width="80" height="80" viewBox="0 0 250 250" style="fill:#151513; color:#fff; position: absolute; top: 0; border: 0; right: 0;" aria-hidden="true"><path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path><path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path><path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path></svg></a><style>.github-corner:hover .octo-arm{animation:octocat-wave 560ms ease-in-out}@keyframes octocat-wave{0%,100%{transform:rotate(0)}20%,60%{transform:rotate(-25deg)}40%,80%{transform:rotate(10deg)}}@media (max-width:500px){.github-corner:hover .octo-arm{animation:none}.github-corner .octo-arm{animation:octocat-wave 560ms ease-in-out}}</style>
  </body>
  </html>
`;
console.log('Done!');
console.log('Writing to', outputPath);

fs.writeFileSync(outputPath, htmlTemplate);
console.log('Done!');
