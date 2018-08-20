const fs = require('fs');
const path = require('path');


const outputPath = path.join(__dirname, '..', 'dist','2', 'index.html');

const WINNING_SETS = [
  [1,2,3], [4,5,6], [7,8,9], // horizontal
  [1,4,7], [2,5,8], [3,6,9], // vertical
  [1,5,9], [7,5,3]           // vertical
];

// if we sort the moves in alphabetical order we can ensure that two states
// that are equivalent become the same state string
function normaliseState(state) {
  return state.split('-')
    .filter(Boolean) // remove empty strings, this happens when we pass '-r1' as the state
    .sort()
    .join('-');
}

function getWinner(state) {
  const { redMoves, greenMoves } = extractPlayersMoves(state);

  if (redMoves.length < 3) return null;

  for (const set of WINNING_SETS) {
    if (set.every(move => redMoves.includes(move))) return 'r';
    if (set.every(move => greenMoves.includes(move))) return 'g';
  }
  if (redMoves.length === 5) return 'd'; // it's a draw!

  return null;
}

function extractPlayersMoves(state) {
  const redMoves = (state.match(/r([0-9])/g) || [])
    .map(move => move.charAt(1))
    .map(move => parseInt(move, 10));
  const greenMoves = (state.match(/g([0-9])/g) || [])
    .map(move => move.charAt(1))
    .map(move => parseInt(move, 10));

  return {
    redMoves,
    greenMoves
  }
}

function getBoardForState(state) {
  let nextStates;
  const normalisedState = normaliseState(state);
  const numMoves = state.split('-').filter(Boolean);
  const curPlayer = numMoves.length % 2 === 0 ? 'r' : 'g';
  const winner = getWinner(state);

  nextStates = [1,2,3,4,5,6,7,8,9].map(possibleMoveIdx => {
    // A move is only legal if we haven't seen it before (it wont be in the state string)
    const isLegalMove = state.indexOf(possibleMoveIdx) === -1 && !winner;
    if (isLegalMove) {
      return normaliseState(`${state}-${curPlayer}${possibleMoveIdx}`);
    }
    return normalisedState;
  });


  const winnerClass = winner ? `winner-${winner}` : '';
  const stateClasses = normalisedState.replace(/-/g, ' ');
  const boardTemplate = `
    <input type="radio" name="game-state" id="${normalisedState}">
    <div class="game ${stateClasses} ${winnerClass}">
      ${nextStates.map(next => `<label for="${next}"></label>`).join('\n  ')}
    </div>
  `;
  return boardTemplate;
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
    const numMoves = state.split('-').filter(Boolean);
    const curPlayer = numMoves.length % 2 === 0 ? 'r' : 'g';
    const legalMoves = getLegalMoves(state);
    legalMoves.forEach(moveIdx => {
      const newState = normaliseState(`${state}-${curPlayer}${moveIdx}`);
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

console.log('~~~~ Building CSS-Tic-Tac-Toe 2 Player... ~~~');
const startTime = +new Date();
const allStates = getAllStates();
const endTime = +new Date();

console.log('Found ', allStates.size, 'states in ', (endTime - startTime), 'milliseconds');
console.log('Mapping to board states...');
const allStatesArr = Array.from(allStates);
const allStateStrings = allStatesArr.map(getBoardForState);

const htmlTemplate = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>CSS Tic Tac Toe</title>
    <link href="../styles.css" rel="stylesheet"></head>
  </head>
  <body>
  <div class="app">
    <h1>2 Player CSS Tic Tac Toe</h1>
    <p>This game is built entirely out of HTML and CSS, no JavaScript™ at all!</p>
    <p>Or go <a href="/">here</a> to play against a computer!</p>
    <br><br>
    <input type="radio" name="game-state" id="start" checked>
    <div class="game">
      <label for="r1"></label>
      <label for="r2"></label>
      <label for="r3"></label>
      <label for="r4"></label>
      <label for="r5"></label>
      <label for="r6"></label>
      <label for="r7"></label>
      <label for="r8"></label>
      <label for="r9"></label>
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
