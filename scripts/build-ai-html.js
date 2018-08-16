const fs = require('fs');
const path = require('path');
const outdent = require('outdent');

const outputPath = path.join(__dirname, '..', 'dist', 'index.html');

// if we sort the moves in alphabetical order we can ensure that two states
// that are equivalent become the same state string
function normaliseState(state) {
  return state.split(' ').sort().join(' ').trim();
}

function getComputerMove(state) {
  const oppMoves = (state.match(/r([0-9])/g) || []).map(move => move.charAt(1));
  const ourMoves = (state.match(/g([0-9])/g) || []).map(move => move.charAt(1));
  const winningSets = [
    ['1','2','3'], ['4','5','6'], ['7','8','9'], // horizontal
    ['1','4','7'], ['2','5','8'], ['3','6','9'], // vertical
    ['1','5','9'], ['7','5','3']           // vertical
  ];
  const opposites = {
    '1': '9',
    '2': '8',
    '3': '7',
    '4': '6',
    '6': '4',
    '7': '3',
    '8': '2',
    '9': '1',
  }

  if (oppMoves.length === 1) {
    // if they play center, play an arbitrary corner, else, play center
    return oppMoves[0] === '5' ? '9' : '5';
  }
  if (oppMoves.length === 2) {
    // if they control the center (we must have played g9)...
    if (oppMoves.includes('5')) {
      // If they played the opposite corner, we just play a corner (we are going to draw)
      if (oppMoves.includes('1')) {
        return '3'
      }
      // otherwise we need to block (will always be the 'opposite' side than what they just played)
      // const opponentMove = oppMoves.find(move => move !== '5');
      // return opposites[opponentMove];
    }
    // if they didn't play the center, we know we did ('g5') and we can go on with normal strategy
  }
  // check if we can win
  for (let set of winningSets) {
    const weStillNeed = set.filter(move => !ourMoves.includes(move));
    const oppHas = set.filter(move => oppMoves.includes(move));
    // if there is a move the opp can play to win, we block it
    if (weStillNeed.length === 1 && oppHas.length === 0) {
      return weStillNeed[0]; // We win!
    }
  }
  // check if we need to block
  for (let set of winningSets) {
    const oppStillNeeds = set.filter(move => !oppMoves.includes(move));
    const weHave = set.filter(move => ourMoves.includes(move));
    // if there is a move the opp can play to win, we block it
    if (oppStillNeeds.length === 1 && weHave.length === 0) {
      return oppStillNeeds[0]
    }
  }
  // otherwise just pick an empty square
  // console.log('picking empty square for state: ', state );
  const emptySquares = [1,2,3,4,5,6,7,8,9].filter(sq => !state.includes(sq));

  return emptySquares[0];
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
  if (moves.length === 9) {
    return 'd' // it's a draw!
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

function getBoardForState(state) {
  let nextStates;
  const normalisedState = normaliseState(state);
  const numMoves = state.split(' ').filter(Boolean);
  const curPlayer = numMoves.length % 2 === 0 ? 'r' : 'g';
  const winner = getWinner(state);

  nextStates = [1,2,3,4,5,6,7,8,9].map(possibleMoveIdx => {
    // A move is only legal if we haven't seen it before (it wont be in the state string)
    const isLegalMove = state.indexOf(possibleMoveIdx) === -1 && !winner;
    if (isLegalMove) {
      const tempState = normaliseState(`${state} ${curPlayer}${possibleMoveIdx}`)
      const ourMove = getComputerMove(tempState);
      if (ourMove) {
        return normaliseState(`${tempState} g${ourMove}`);
      }
      return tempState;
    }
    return normalisedState;
  });


  const winnerClass = winner ? `winner-${winner}` : '';
  const boardTemplate = outdent`
    <input type="radio" name="game-state" id="${normalisedState}">
    <div class="game ${normalisedState} ${winnerClass}">
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
    const legalMoves = getLegalMoves(state);
    legalMoves.forEach(moveIdx => {
      let newState = normaliseState(`${state} r${moveIdx}`);
      const ourMove = getComputerMove(newState);
      if (ourMove) {
        newState = normaliseState(`${newState} g${ourMove}`);
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

const startTime = +new Date();
const allStates = getAllStates();
const endTime = +new Date();

console.log('Found ', allStates.size, 'states in ', (endTime - startTime), 'milliseconds');
console.log('Mapping to board states...');
const allStatesArr = Array.from(allStates);
const allStateStrings = allStatesArr.map(getBoardForState);

const htmlTemplate = outdent`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>CSS Tic Tac Toe</title>
    <link href="styles.css" rel="stylesheet"></head>
  </head>
  <body>
  <div class="app">
    <h1>CSS Tic Tac Toe</h1>
    <p>This game is built entirely out of HTML and CSS, no JavaScript™ at all!</p>
    <p>Check out <a href="https://github.com/lukebatchelor/css-tic-tac-toe">lukebatchelor/css-tic-tac-toe</a> if you're interested in how it works!</p>
    <br><br>
    <input type="radio" name="game-state" id="start" checked>
    <div class="game">
      <label for="g5 r1"></label>
      <label for="g5 r2"></label>
      <label for="g5 r3"></label>
      <label for="g5 r4"></label>
      <label for="g9 r5"></label>
      <label for="g5 r6"></label>
      <label for="g5 r7"></label>
      <label for="g5 r8"></label>
      <label for="g5 r9"></label>
    </div>
    ${allStateStrings.join('\n')}
    <label for="start" id="resetButton">Reset</label>
  </div>
  <a href="https://github.com/lukebatchelor/css-tic-tac-toe"><img style="position: absolute; top: 0; right: 0; border: 0;" src="https://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png" alt="Fork me on GitHub"></a>
  </body>
  </html>
`;
console.log('Done!');
console.log('Writing to', outputPath);

fs.writeFileSync(outputPath, htmlTemplate);
console.log('Done!');
