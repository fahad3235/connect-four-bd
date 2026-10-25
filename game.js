// Connect Four core logic — pure, no DOM. Usable in browser (plain script)
// and in Node (module.exports guard at the bottom) for unit tests.
(function (root) {
  'use strict';
  var ROWS = 6, COLS = 7, EMPTY = 0, P1 = 1, P2 = 2;

  function createBoard() {
    var b = [], r, c;
    for (r = 0; r < ROWS; r++) { b.push([]); for (c = 0; c < COLS; c++) b[r].push(EMPTY); }
    return b;
  }

  function cloneBoard(b) { return b.map(function (row) { return row.slice(); }); }

  // Drop a disc; returns the row it landed in, or -1 if the column is full/invalid.
  function drop(b, col, player) {
    if (col < 0 || col >= COLS) return -1;
    for (var r = ROWS - 1; r >= 0; r--) {
      if (b[r][col] === EMPTY) { b[r][col] = player; return r; }
    }
    return -1;
  }

  function lowestEmptyRow(b, col) {
    for (var r = ROWS - 1; r >= 0; r--) if (b[r][col] === EMPTY) return r;
    return -1;
  }

  function availableColumns(b) {
    var out = [], c;
    for (c = 0; c < COLS; c++) if (b[0][c] === EMPTY) out.push(c);
    return out;
  }

  function isFull(b) { return availableColumns(b).length === 0; }

  // Returns the winning line as [{r,c}...] for player, or null.
  function checkWin(b, player) {
    var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]], r, c, d, i, line, ok;
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        if (b[r][c] !== player) continue;
        for (d = 0; d < dirs.length; d++) {
          line = []; ok = true;
          for (i = 0; i < 4; i++) {
            var rr = r + dirs[d][0] * i, cc = c + dirs[d][1] * i;
            if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || b[rr][cc] !== player) { ok = false; break; }
            line.push({ r: rr, c: cc });
          }
          if (ok) return line;
        }
      }
    }
    return null;
  }

  function countWindows(b, player) {
    // Score every window of 4 cells: big reward for 4/3-in-a-row, small for 2.
    var score = 0, r, c, dr, dc, i, cells, mine, opp, empty;
    var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        for (var d = 0; d < dirs.length; d++) {
          dr = dirs[d][0]; dc = dirs[d][1];
          if (r + dr * 3 < 0 || r + dr * 3 >= ROWS || c + dc * 3 < 0 || c + dc * 3 >= COLS) continue;
          cells = []; mine = 0; opp = 0; empty = 0;
          for (i = 0; i < 4; i++) {
            var v = b[r + dr * i][c + dc * i];
            if (v === player) mine++;
            else if (v === EMPTY) empty++;
            else opp++;
          }
          if (mine === 4) score += 100000;
          else if (mine === 3 && empty === 1) score += 500;
          else if (mine === 2 && empty === 2) score += 50;
          else if (opp === 3 && empty === 1) score -= 400;
          else if (opp === 2 && empty === 2) score -= 20;
        }
      }
    }
    // Prefer the centre column slightly.
    for (r = 0; r < ROWS; r++) if (b[r][3] === player) score += 6;
    return score;
  }

  function evaluate(b, ai) {
    var opp = ai === P1 ? P2 : P1;
    if (checkWin(b, ai)) return 1000000;
    if (checkWin(b, opp)) return -1000000;
    return countWindows(b, ai) - countWindows(b, opp);
  }

  function minimax(b, depth, alpha, beta, maximizing, ai) {
    var opp = ai === P1 ? P2 : P1;
    var cols = availableColumns(b);
    if (depth === 0 || cols.length === 0 || checkWin(b, ai) || checkWin(b, opp)) {
      return evaluate(b, ai);
    }
    // Try centre columns first for better pruning.
    cols.sort(function (a, c) { return Math.abs(a - 3) - Math.abs(c - 3); });
    var i, nb, row, val;
    if (maximizing) {
      var best = -Infinity;
      for (i = 0; i < cols.length; i++) {
        nb = cloneBoard(b); row = drop(nb, cols[i], ai);
        if (row === -1) continue;
        val = minimax(nb, depth - 1, alpha, beta, false, ai);
        if (val > best) best = val;
        if (best > alpha) alpha = best;
        if (beta <= alpha) break;
      }
      return best;
    }
    var worst = Infinity;
    for (i = 0; i < cols.length; i++) {
      nb = cloneBoard(b); row = drop(nb, cols[i], opp);
      if (row === -1) continue;
      val = minimax(nb, depth - 1, alpha, beta, true, ai);
      if (val < worst) worst = val;
      if (worst < beta) beta = worst;
      if (beta <= alpha) break;
    }
    return worst;
  }

  // difficulty: 'easy' (random), 'medium' (depth 3), 'hard' (depth 5).
  // randomFn injectable for tests.
  function bestMove(b, ai, difficulty, randomFn) {
    var cols = availableColumns(b);
    if (cols.length === 0) return -1;
    var rnd = randomFn || Math.random;
    if (difficulty === 'easy') return cols[Math.floor(rnd() * cols.length)];
    var depth = difficulty === 'hard' ? 5 : 3;
    var bestScore = -Infinity, bestCol = cols[0], i, nb, row, score;
    cols.sort(function (a, c) { return Math.abs(a - 3) - Math.abs(c - 3); });
    for (i = 0; i < cols.length; i++) {
      nb = cloneBoard(b); row = drop(nb, cols[i], ai);
      if (row === -1) continue;
      if (checkWin(nb, ai)) return cols[i]; // take an immediate win
      score = minimax(nb, depth - 1, -Infinity, Infinity, false, ai);
      if (score > bestScore) { bestScore = score; bestCol = cols[i]; }
    }
    return bestCol;
  }

  var api = {
    ROWS: ROWS, COLS: COLS, EMPTY: EMPTY, P1: P1, P2: P2,
    createBoard: createBoard, cloneBoard: cloneBoard, drop: drop,
    lowestEmptyRow: lowestEmptyRow, availableColumns: availableColumns,
    isFull: isFull, checkWin: checkWin, evaluate: evaluate,
    minimax: minimax, bestMove: bestMove
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ConnectFour = api;
})(typeof window !== 'undefined' ? window : globalThis);
