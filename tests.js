// Node unit tests for game.js — run: node tests.js
var G = require('./game.js');
var pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}
function boardFrom(rows) {
  // rows: array of 6 strings, top row first, '.' empty, 'R' P1, 'Y' P2
  var b = G.createBoard();
  for (var r = 0; r < 6; r++)
    for (var c = 0; c < 7; c++)
      b[r][c] = rows[r][c] === 'R' ? G.P1 : rows[r][c] === 'Y' ? G.P2 : G.EMPTY;
  return b;
}

// 1. Drop lands on the bottom of an empty column.
var b = G.createBoard();
check('drop empty column lands row 5', G.drop(b, 3, G.P1) === 5 && b[5][3] === G.P1);
// 2. Drop stacks.
check('drop stacks to row 4', G.drop(b, 3, G.P2) === 4 && b[4][3] === G.P2);
// 3. Full column rejected.
for (var i = 0; i < 4; i++) G.drop(b, 3, G.P1);
check('full column returns -1', G.drop(b, 3, G.P1) === -1);
check('invalid column returns -1', G.drop(b, 9, G.P1) === -1 && G.drop(b, -1, G.P1) === -1);
// 4. Horizontal win.
b = boardFrom(['.......', '.......', '.......', '.......', '.......', '.RRRR..']);
var w = G.checkWin(b, G.P1);
check('horizontal win found, 4 cells', !!w && w.length === 4 && w[0].c === 1 && w[3].c === 4);
// 5. Vertical win.
b = boardFrom(['.......', '.......', '..Y....', '..Y....', '..Y....', '..Y....']);
w = G.checkWin(b, G.P2);
check('vertical win found', !!w && w.length === 4 && w[0].r === 2 && w[3].r === 5);
// 6. Diagonal down-right win.
b = boardFrom(['.......', '.......', 'R......', '.R.....', '..R....', '...R...']);
check('diagonal down-right win', !!G.checkWin(b, G.P1));
// 7. Diagonal up-right win.
b = boardFrom(['.......', '.......', '...R...', '..R....', '.R.....', 'R......']);
check('diagonal up-right win', !!G.checkWin(b, G.P1));
// 8. No false win for 3 in a row.
b = boardFrom(['.......', '.......', '.......', '.......', '.......', '.RRR...']);
check('3 in a row is not a win', G.checkWin(b, G.P1) === null);
// 9. No win for the other player.
check('opponent has no win', G.checkWin(b, G.P2) === null);
// 10. Full board detection (checkerboard-ish fill, no win check needed here).
b = G.createBoard();
for (var c = 0; c < 7; c++) for (var r = 0; r < 6; r++) b[r][c] = (r + c) % 2 ? G.P1 : G.P2;
check('full board detected', G.isFull(b) === true);
check('full board has no available columns', G.availableColumns(b).length === 0);
// 11. AI takes an immediate win (medium).
b = boardFrom(['.......', '.......', '.......', '.......', '.......', '.YYY...']);
check('AI takes immediate win at col 4', G.bestMove(b, G.P2, 'medium') === 4);
// 12. AI blocks the opponent's single immediate win (medium).
// (Board 'RRR....' threatens only col 3; '.RRR...' would be an unblockable
// double threat at cols 0 and 4, so it is not used here.)
b = boardFrom(['.......', '.......', '.......', '.......', '.......', 'RRR....']);
check('AI blocks opponent win at col 3', G.bestMove(b, G.P2, 'medium') === 3);
// 13. AI blocks a vertical threat (medium).
b = boardFrom(['.......', '.......', '.......', 'R......', 'R......', 'R......']);
check('AI blocks vertical threat at col 0', G.bestMove(b, G.P2, 'medium') === 0);
// 14. Easy AI returns a legal column (deterministic random stub).
b = G.createBoard();
for (i = 0; i < 6; i++) G.drop(b, 0, G.P1);
// Stub random returns 0, so easy AI picks the first available column (col 1).
var mv = G.bestMove(b, G.P2, 'easy', function () { return 0; });
check('easy AI skips full column 0', mv === 1);
check('easy AI move is available', G.availableColumns(b).indexOf(mv) !== -1);
// 15. Hard AI still finds the immediate win quickly.
b = boardFrom(['.......', '.......', '.......', '.......', '.......', '.YYY...']);
check('hard AI takes immediate win', G.bestMove(b, G.P2, 'hard') === 4);
// 16. Empty board: medium AI prefers centre-ish (score-based, not random).
b = G.createBoard();
mv = G.bestMove(b, G.P2, 'medium');
check('medium AI opens near centre (col 2-4)', mv >= 2 && mv <= 4);
// 17. availableColumns excludes full columns only.
b = G.createBoard();
for (i = 0; i < 6; i++) G.drop(b, 6, G.P1);
check('availableColumns excludes col 6', G.availableColumns(b).indexOf(6) === -1 && G.availableColumns(b).length === 6);
// 18. lowestEmptyRow.
b = G.createBoard();
G.drop(b, 2, G.P1); G.drop(b, 2, G.P2);
check('lowestEmptyRow is 3 after two drops', G.lowestEmptyRow(b, 2) === 3);
check('lowestEmptyRow of full column is -1', (function () {
  for (var k = 0; k < 6; k++) G.drop(b, 1, G.P1);
  return G.lowestEmptyRow(b, 1) === -1;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail === 0 ? 0 : 1);
