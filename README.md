# Sorting Visualizer

A React (Vite) app that animates sorting algorithms step by step.

## Run

```bash
npm install
npm run dev
```

## Features

- Enter your own numbers (comma/space separated, 2–40) or generate random ones
- Algorithms: Bubble, Selection, Insertion, Merge, Quick, Heap
- Play / pause / replay, step forward and back, jump to start or end, scrub the step slider
- Adjustable speed, live comparison / swap counts, complexity info
- Plain-English description of every step; click any entry in the step log to jump to it

## How it works

`src/algorithms.js` runs each algorithm once up front and records a snapshot per step
(array, highlighted indices, message). `src/App.jsx` just plays those snapshots back, which
is why pausing, stepping backwards and scrubbing are all trivial. To add an algorithm, write a
function that returns steps in the same shape and register it in `ALGORITHMS`.
