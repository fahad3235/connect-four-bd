# Connect Four BD

Offline, bilingual (English / বাংলা) Connect Four game for the browser.
Play against an AI opponent (Easy / Medium / Hard) or against a friend on
the same device. No build step, no server, no network requests — open
`index.html` and play.

## Features

- **Play vs AI** — Easy plays a random legal move; Medium (depth-3) and Hard
  (depth-5) use negamax with alpha-beta pruning and window scoring, so the
  AI takes immediate wins and blocks immediate threats.
- **2-player local mode** — take turns on one device (Red vs Yellow).
- **Full Connect Four rules** — 7×6 board, gravity drops, horizontal /
  vertical / diagonal four-in-a-row detection, draw detection, winning-line
  highlight, last-move highlight.
- **Column preview** — hovering a column shows a ghost disc in the landing cell.
- **Undo** — in AI mode removes your move and the AI reply; in 2-player mode
  removes the last move. Scores are never rewound.
- **Score tally** — wins for each side and draws, kept in `localStorage`.
- **English / বাংলা toggle** — persisted, including Bengali digits (০–৯).
- **Who starts** — in AI mode, choose whether you or the AI opens.
- **Mobile friendly** — verified at 390px width with no horizontal overflow.
- **Offline personal tool** — all state stays in the browser.

## Stack

Vanilla HTML, CSS, and JavaScript. No frameworks, no dependencies, no build.

- `index.html` — page shell; all visible text is filled by `app.js` so the
  language toggle re-renders the whole UI.
- `styles.css` — responsive board, disc, and control styling.
- `game.js` — pure game logic (board, drops, win detection, AI). Loaded as a
  plain script in the browser and via `require` in Node for tests.
- `app.js` — UI, bilingual strings, `localStorage` persistence.
- `tests.js` — Node unit tests for the game logic.

## Prerequisites

Any modern browser. For the unit tests, Node.js (any recent version).

## Run

Open `index.html` in a browser, or serve the folder:

```sh
npx serve .
# or
python3 -m http.server 8000
```

Then open http://localhost:8000/.

## Testing

```sh
node tests.js
```

22 unit tests covering drops, stacking, full/invalid columns, all four win
directions, non-wins, full-board detection, AI immediate wins, AI blocking
(and the unblockable double-threat case, documented in the test), easy-AI
legality, and opening play. Headless-Chrome smoke checks (real Chromium 152
over CDP, `file://`) additionally verified: page load, AI reply after a
player move, EN↔বাংলা toggle, a full 2-player win with 4 highlighted cells,
undo clearing the win, new-game reset, zero console/page errors, and no
horizontal overflow at 390px.

## Deployment

Static hosting only. On GitHub Pages: enable Pages for the `main` branch,
root folder — the site is live at
https://fahad3235.github.io/connect-four-bd/.

## Limitations

- The AI is a depth-limited search, not a solved engine: Hard (depth 5) plays
  strongly in the middlegame but can miss deep forced wins and does not play
  perfectly from the empty board.
- Scores and settings live in the browser's `localStorage`; clearing site
  data resets them. There is no online multiplayer and no account system.
- Sound is intentionally absent (silent play).

## Status

MVP complete and verified: 22/22 Node unit tests and 13/13 headless-Chrome
smoke checks green, 0 console errors.
