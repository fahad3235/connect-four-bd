// Connect Four BD — UI, i18n, persistence. Depends on game.js (ConnectFour).
(function () {
  'use strict';
  var G = window.ConnectFour;
  var $ = function (id) { return document.getElementById(id); };

  var T = {
    en: {
      title: 'Connect Four BD', subtitle: 'Drop four in a row — beat the AI or a friend.',
      mode: 'Mode', vsAI: 'Play vs AI', twoPlayer: '2 Players',
      difficulty: 'Difficulty', easy: 'Easy', medium: 'Medium', hard: 'Hard',
      starts: 'Starts', youStart: 'You start', aiStart: 'AI starts',
      newGame: 'New Game', undo: 'Undo', score: 'Score',
      you: 'You', ai: 'AI', draws: 'Draws', red: 'Red', yellow: 'Yellow',
      moves: 'Moves', yourTurn: 'Your turn', aiThinking: 'AI is thinking…',
      p1Turn: "Red's turn", p2Turn: "Yellow's turn",
      youWin: 'You win!', aiWin: 'AI wins!', p1Win: 'Red wins!', p2Win: 'Yellow wins!',
      draw: "It's a draw!", hint: 'Tap a column to drop your disc.',
      howTo: 'How to play',
      howText: 'Players take turns dropping discs into a column. The first to line up four discs — horizontally, vertically, or diagonally — wins. Fill the board with no winner and it is a draw.',
      footer: 'Offline personal game. No data leaves your device. Scores are kept only in this browser.',
      langBtn: 'বাংলা'
    },
    bn: {
      title: 'কানেক্ট ফোর বিডি', subtitle: 'চারটি ঘুঁটি এক সারিতে মেলান — এআই বা বন্ধুর বিরুদ্ধে খেলুন।',
      mode: 'মোড', vsAI: 'এআইয়ের বিরুদ্ধে', twoPlayer: '২ জন খেলোয়াড়',
      difficulty: 'কঠিনতা', easy: 'সহজ', medium: 'মাঝারি', hard: 'কঠিন',
      starts: 'শুরু করবে', youStart: 'আপনি শুরু করুন', aiStart: 'এআই শুরু করুক',
      newGame: 'নতুন খেলা', undo: 'ফিরিয়ে নিন', score: 'স্কোর',
      you: 'আপনি', ai: 'এআই', draws: 'ড্র', red: 'লাল', yellow: 'হলুদ',
      moves: 'চাল', yourTurn: 'আপনার চাল', aiThinking: 'এআই ভাবছে…',
      p1Turn: 'লালের চাল', p2Turn: 'হলুদের চাল',
      youWin: 'আপনি জিতেছেন!', aiWin: 'এআই জিতেছে!', p1Win: 'লাল জিতেছে!', p2Win: 'হলুদ জিতেছে!',
      draw: 'ড্র হয়েছে!', hint: 'ঘুঁটি ফেলতে একটি কলামে ট্যাপ করুন।',
      howTo: 'কীভাবে খেলবেন',
      howText: 'খেলোয়াড়রা পালা করে একটি কলামে ঘুঁটি ফেলে। আড়াআড়ি, লম্বালম্বি বা কোণাকুণি চারটি ঘুঁটি মেলালেই জয়। বোর্ড ভরে গেলে আর জয়ী না থাকলে ড্র।',
      footer: 'অফলাইন ব্যক্তিগত গেম। আপনার ডিভাইস থেকে কোনো তথ্য বাইরে যায় না। স্কোর শুধু এই ব্রাউজারে থাকে।',
      langBtn: 'English'
    }
  };

  var BN_DIGITS = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
  function locNum(n, lang) {
    var s = String(n);
    if (lang !== 'bn') return s;
    return s.replace(/[0-9]/g, function (d) { return BN_DIGITS[d]; });
  }

  var LS_KEY = 'connect-four-bd-v1';
  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function save(state) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  var saved = loadSaved();
  var lang = saved.lang || 'en';
  var state = {
    mode: saved.mode || 'ai',           // 'ai' | '2p'
    difficulty: saved.difficulty || 'medium',
    starts: saved.starts || 'you',     // 'you' | 'ai' (ai mode only)
    scores: saved.scores || { a: 0, b: 0, d: 0 },
    board: G.createBoard(),
    turn: G.P1,                        // P1 = Red / You, P2 = Yellow / AI
    over: false, winLine: null, moves: [], lastDrop: null, aiBusy: false
  };

  function t(k) { return T[lang][k]; }
  function playerLabel(p) {
    if (state.mode === 'ai') return p === G.P1 ? t('you') : t('ai');
    return p === G.P1 ? t('red') : t('yellow');
  }

  function renderBoard() {
    var el = $('board'), html = '', r, c, v, cls, ghost;
    for (r = 0; r < G.ROWS; r++) {
      for (c = 0; c < G.COLS; c++) {
        v = state.board[r][c];
        cls = 'cell';
        if (state.lastDrop && state.lastDrop.r === r && state.lastDrop.c === c) cls += ' last';
        if (state.winLine) {
          for (var i = 0; i < state.winLine.length; i++) {
            if (state.winLine[i].r === r && state.winLine[i].c === c) cls += ' win';
          }
        }
        ghost = '';
        if (!state.over && !state.aiBusy && state.hoverCol === c && r === G.lowestEmptyRow(state.board, c)) {
          ghost = ' ghost ' + (state.turn === G.P1 ? 'p1' : 'p2');
        }
        html += '<button type="button" class="' + cls + '" data-col="' + c + '" data-row="' + r + '" aria-label="Column ' + (c + 1) + '">' +
          '<span class="disc' + (v === G.P1 ? ' p1' : v === G.P2 ? ' p2' : '') + ghost +
          (state.lastDrop && state.lastDrop.r === r && state.lastDrop.c === c ? ' just-dropped' : '') + '"></span></button>';
      }
    }
    el.innerHTML = html;
  }

  function renderStatus() {
    var s = $('status'), msg;
    if (state.over) {
      if (state.winLine) {
        msg = state.mode === 'ai'
          ? (state.turn === G.P1 ? t('youWin') : t('aiWin'))
          : (state.turn === G.P1 ? t('p1Win') : t('p2Win'));
      } else msg = t('draw');
    } else if (state.aiBusy) msg = t('aiThinking');
    else if (state.mode === 'ai') msg = state.turn === G.P1 ? t('yourTurn') : t('aiThinking');
    else msg = state.turn === G.P1 ? t('p1Turn') : t('p2Turn');
    s.textContent = msg;
    $('turnDisc').className = 'turn-disc ' + (state.turn === G.P1 ? 'p1' : 'p2');
    $('moves').textContent = t('moves') + ': ' + locNum(state.moves.length, lang);
    $('undoBtn').disabled = state.moves.length === 0 || state.aiBusy;
    $('scoreA').textContent = locNum(state.scores.a, lang);
    $('scoreD').textContent = locNum(state.scores.d, lang);
    $('scoreB').textContent = locNum(state.scores.b, lang);
  }

  function renderChrome() {
    document.title = t('title');
    $('title').textContent = t('title');
    $('subtitle').textContent = t('subtitle');
    $('modeLabel').textContent = t('mode');
    $('modeAI').textContent = t('vsAI');
    $('mode2p').textContent = t('twoPlayer');
    $('diffLabel').textContent = t('difficulty');
    $('diffEasy').textContent = t('easy');
    $('diffMed').textContent = t('medium');
    $('diffHard').textContent = t('hard');
    $('startsLabel').textContent = t('starts');
    $('startsYou').textContent = t('youStart');
    $('startsAI').textContent = t('aiStart');
    $('newBtn').textContent = t('newGame');
    $('undoBtn').textContent = t('undo');
    $('scoreLabel').textContent = t('score');
    $('labelA').textContent = state.mode === 'ai' ? t('you') : t('red');
    $('labelD').textContent = t('draws');
    $('labelB').textContent = state.mode === 'ai' ? t('ai') : t('yellow');
    $('hint').textContent = t('hint');
    $('howToTitle').textContent = t('howTo');
    $('howText').textContent = t('howText');
    $('footer').textContent = t('footer');
    $('langBtn').textContent = t('langBtn');
    $('modeAI').classList.toggle('active', state.mode === 'ai');
    $('mode2p').classList.toggle('active', state.mode === '2p');
    $('diffEasy').classList.toggle('active', state.difficulty === 'easy');
    $('diffMed').classList.toggle('active', state.difficulty === 'medium');
    $('diffHard').classList.toggle('active', state.difficulty === 'hard');
    $('startsYou').classList.toggle('active', state.starts === 'you');
    $('startsAI').classList.toggle('active', state.starts === 'ai');
    $('startsRow').style.display = state.mode === 'ai' ? '' : 'none';
    $('diffRow').style.display = state.mode === 'ai' ? '' : 'none';
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
  }

  function renderAll() { renderChrome(); renderBoard(); renderStatus(); }

  function finishTurn(row, col) {
    var win = G.checkWin(state.board, state.turn);
    state.lastDrop = { r: row, c: col };
    if (win) {
      state.over = true; state.winLine = win;
      if (state.turn === G.P1) state.scores.a++; else state.scores.b++;
    } else if (G.isFull(state.board)) {
      state.over = true; state.scores.d++;
    } else {
      state.turn = state.turn === G.P1 ? G.P2 : G.P1;
    }
    persist(); renderAll();
    if (!state.over && state.mode === 'ai' && state.turn === G.P2) scheduleAI();
  }

  function doMove(col) {
    if (state.over || state.aiBusy) return;
    if (state.mode === 'ai' && state.turn === G.P2) return;
    var row = G.drop(state.board, col, state.turn);
    if (row === -1) return;
    state.moves.push({ col: col, player: state.turn });
    finishTurn(row, col);
  }

  function scheduleAI() {
    state.aiBusy = true; renderStatus();
    setTimeout(function () {
      var col = G.bestMove(state.board, G.P2, state.difficulty);
      var row = G.drop(state.board, col, G.P2);
      state.aiBusy = false;
      if (row !== -1) {
        state.moves.push({ col: col, player: G.P2 });
        finishTurn(row, col);
      } else { renderAll(); }
    }, 420);
  }

  function newGame() {
    state.board = G.createBoard();
    state.over = false; state.winLine = null; state.moves = [];
    state.lastDrop = null; state.aiBusy = false; state.hoverCol = undefined;
    state.turn = (state.mode === 'ai' && state.starts === 'ai') ? G.P2 : G.P1;
    persist(); renderAll();
    if (state.mode === 'ai' && state.turn === G.P2) scheduleAI();
  }

  function undo() {
    if (state.moves.length === 0 || state.aiBusy) return;
    // Mid-game vs AI: remove the player's move and the AI reply (2 plies).
    // Game over, or 2-player mode: remove just the last move.
    var n = (state.mode === 'ai' && !state.over && state.moves.length >= 2) ? 2 : 1;
    for (var i = 0; i < n && state.moves.length > 0; i++) {
      var m = state.moves.pop();
      // Clear the topmost disc in that column — the last one placed there.
      for (var r = 0; r < G.ROWS; r++) {
        if (state.board[r][m.col] !== G.EMPTY) { state.board[r][m.col] = G.EMPTY; break; }
      }
    }
    state.over = false; state.winLine = null; state.lastDrop = null;
    var starter = (state.mode === 'ai' && state.starts === 'ai') ? G.P2 : G.P1;
    state.turn = (state.moves.length % 2 === 0) ? starter : (starter === G.P1 ? G.P2 : G.P1);
    // Vs AI, undo always hands play back to the human.
    if (state.mode === 'ai') state.turn = G.P1;
    persist(); renderAll();
  }

  function persist() {
    save({ lang: lang, mode: state.mode, difficulty: state.difficulty,
           starts: state.starts, scores: state.scores });
  }

  function bind() {
    $('board').addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('button.cell') : null;
      if (btn) doMove(parseInt(btn.getAttribute('data-col'), 10));
    });
    $('board').addEventListener('mouseover', function (e) {
      var btn = e.target.closest ? e.target.closest('button.cell') : null;
      if (btn) { state.hoverCol = parseInt(btn.getAttribute('data-col'), 10); renderBoard(); }
    });
    $('board').addEventListener('mouseleave', function () { state.hoverCol = undefined; renderBoard(); });
    $('newBtn').addEventListener('click', newGame);
    $('undoBtn').addEventListener('click', undo);
    $('langBtn').addEventListener('click', function () {
      lang = lang === 'en' ? 'bn' : 'en'; persist(); renderAll();
    });
    $('modeAI').addEventListener('click', function () { state.mode = 'ai'; persist(); newGame(); });
    $('mode2p').addEventListener('click', function () { state.mode = '2p'; persist(); newGame(); });
    $('diffEasy').addEventListener('click', function () { state.difficulty = 'easy'; persist(); renderChrome(); });
    $('diffMed').addEventListener('click', function () { state.difficulty = 'medium'; persist(); renderChrome(); });
    $('diffHard').addEventListener('click', function () { state.difficulty = 'hard'; persist(); renderChrome(); });
    $('startsYou').addEventListener('click', function () { state.starts = 'you'; persist(); newGame(); });
    $('startsAI').addEventListener('click', function () { state.starts = 'ai'; persist(); newGame(); });
  }

  bind();
  newGame();
})();
