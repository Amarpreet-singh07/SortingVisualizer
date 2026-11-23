import { useEffect, useMemo, useRef, useState } from 'react'
import { ALGORITHMS } from './algorithms'
import Bars from './components/Bars'
import './App.css'

const MIN_COUNT = 2
const MAX_COUNT = 40
const DEFAULT_INPUT = '64, 34, 25, 12, 22, 11, 90, 45'

/** Turn "5, 3 8;1" into [5, 3, 8, 1], or return an error message. */
function parseNumbers(text) {
  const parts = text.split(/[\s,;]+/).filter(Boolean)
  if (parts.length < MIN_COUNT) return { error: `Enter at least ${MIN_COUNT} numbers.` }
  if (parts.length > MAX_COUNT) return { error: `Enter at most ${MAX_COUNT} numbers.` }
  const numbers = parts.map(Number)
  if (numbers.some((n) => !Number.isFinite(n))) {
    return { error: 'Only numbers separated by commas or spaces are allowed.' }
  }
  return { numbers }
}

function randomNumbers(count) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 95) + 5)
}

// speed 1..10 -> delay in ms between steps
const delayFor = (speed) => Math.round(1100 / speed ** 1.2)

export default function App() {
  const [inputText, setInputText] = useState(DEFAULT_INPUT)
  const [error, setError] = useState('')
  const [numbers, setNumbers] = useState(() => parseNumbers(DEFAULT_INPUT).numbers)
  const [algoKey, setAlgoKey] = useState('bubble')
  const [randomCount, setRandomCount] = useState(12)
  const [speed, setSpeed] = useState(5)
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [runId, setRunId] = useState(0) // bumped on new data/algorithm to replay the intro animation
  const logRef = useRef(null)

  const algo = ALGORITHMS[algoKey]
  const steps = useMemo(() => algo.run(numbers), [algo, numbers])
  const last = steps.length - 1
  const step = steps[stepIndex]

  // Running totals of comparisons / swaps / writes up to each step.
  const totals = useMemo(() => {
    const out = []
    const sum = { comparisons: 0, swaps: 0, writes: 0 }
    for (const st of steps) {
      if (st.type === 'compare') sum.comparisons++
      if (st.type === 'swap') sum.swaps++
      if (st.type === 'write') sum.writes++
      out.push({ ...sum })
    }
    return out
  }, [steps])

  const finished = stepIndex === last
  const isPlaying = playing && !finished

  // Auto-advance while playing (stops by itself on the last step).
  useEffect(() => {
    if (!isPlaying) return
    const id = setTimeout(() => setStepIndex((i) => i + 1), delayFor(speed))
    return () => clearTimeout(id)
  }, [isPlaying, stepIndex, speed])

  // Keep the current log entry visible by scrolling only the log list itself.
  // (scrollIntoView would also scroll the whole page away from the bars.)
  useEffect(() => {
    const list = logRef.current
    const el = list?.querySelector('[data-current="true"]')
    if (!list || !el) return
    const top = el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2
    list.scrollTo({ top, behavior: isPlaying && delayFor(speed) < 200 ? 'auto' : 'smooth' })
  }, [stepIndex, steps, isPlaying, speed])

  const resetPlayback = () => {
    setPlaying(false)
    setStepIndex(0)
    setRunId((r) => r + 1)
  }

  const applyInput = (e) => {
    e?.preventDefault()
    const result = parseNumbers(inputText)
    if (result.error) {
      setError(result.error)
      return
    }
    setError('')
    setNumbers(result.numbers)
    resetPlayback()
  }

  const generateRandom = () => {
    const count = Math.min(MAX_COUNT, Math.max(MIN_COUNT, Number(randomCount) || MIN_COUNT))
    const nums = randomNumbers(count)
    setRandomCount(count)
    setInputText(nums.join(', '))
    setError('')
    setNumbers(nums)
    resetPlayback()
  }

  const changeAlgo = (key) => {
    setAlgoKey(key)
    resetPlayback()
  }

  const togglePlay = () => {
    if (isPlaying) {
      setPlaying(false)
      return
    }
    if (stepIndex >= last) setStepIndex(0) // replay from the start
    setPlaying(true)
  }

  const goTo = (i) => {
    setPlaying(false)
    setStepIndex(Math.min(last, Math.max(0, i)))
  }

  const { comparisons, swaps, writes } = totals[stepIndex]

  return (
    <div className="app">
      <header>
        <h1>Sorting Visualizer</h1>
        <p>Enter some numbers, pick an algorithm, and watch it sort step by step.</p>
      </header>

      <section className="panel setup">
        <form className="numbers" onSubmit={applyInput}>
          <label htmlFor="numbers">Numbers (comma or space separated)</label>
          <div className="row">
            <input
              id="numbers"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. 5, 3, 8, 1, 9"
              aria-invalid={Boolean(error)}
              spellCheck={false}
            />
            <button type="submit" className="primary">
              Set numbers
            </button>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
        </form>

        <div className="random">
          <label htmlFor="count">Or generate random</label>
          <div className="row">
            <input
              id="count"
              type="number"
              min={MIN_COUNT}
              max={MAX_COUNT}
              value={randomCount}
              onChange={(e) => setRandomCount(e.target.value)}
              aria-label="How many random numbers"
            />
            <button type="button" onClick={generateRandom}>
              Randomize
            </button>
          </div>
        </div>

        <div className="algo">
          <label htmlFor="algo">Algorithm</label>
          <select id="algo" value={algoKey} onChange={(e) => changeAlgo(e.target.value)}>
            {Object.entries(ALGORITHMS).map(([key, a]) => (
              <option key={key} value={key}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel stage">
        <div className="algo-info">
          <div>
            <h2>{algo.name}</h2>
            <p>{algo.description}</p>
          </div>
          <dl className="complexity">
            <div><dt>Best</dt><dd>{algo.best}</dd></div>
            <div><dt>Average</dt><dd>{algo.average}</dd></div>
            <div><dt>Worst</dt><dd>{algo.worst}</dd></div>
            <div><dt>Space</dt><dd>{algo.space}</dd></div>
          </dl>
        </div>

        <Bars
          key={runId}
          step={step}
          tick={stepIndex}
          durationMs={isPlaying ? Math.min(550, Math.max(90, delayFor(speed) * 0.85)) : 400}
        />

        <div className="legend">
          <span className="chip compare">Comparing</span>
          <span className="chip swap">Swapped</span>
          <span className="chip write">Inserted</span>
          <span className="chip pivot">Pivot / selected</span>
          <span className="chip sorted">Sorted</span>
        </div>

        <p className={`message ${finished ? 'done' : ''}`} aria-live="polite">
          {step.message}
        </p>

        <div className="controls">
          <button onClick={() => goTo(0)} disabled={stepIndex === 0} title="Back to start">
            ⏮ Reset
          </button>
          <button onClick={() => goTo(stepIndex - 1)} disabled={stepIndex === 0}>
            ◀ Prev
          </button>
          <button className="primary play" onClick={togglePlay}>
            {isPlaying ? '⏸ Pause' : finished ? '↻ Replay' : '▶ Play'}
          </button>
          <button onClick={() => goTo(stepIndex + 1)} disabled={finished}>
            Next ▶
          </button>
          <button onClick={() => goTo(last)} disabled={finished} title="Jump to the sorted result">
            ⏭ End
          </button>

          <label className="speed">
            Speed
            <input
              type="range"
              min="1"
              max="10"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="progress">
          <input
            type="range"
            min="0"
            max={last}
            value={stepIndex}
            onChange={(e) => goTo(Number(e.target.value))}
            aria-label="Step"
          />
          <span>
            Step {stepIndex} / {last}
          </span>
        </div>

        <div className="stats">
          <div><b>{comparisons}</b> comparisons</div>
          <div><b>{swaps}</b> swaps</div>
          {algoKey === 'merge' && <div><b>{writes}</b> inserts</div>}
        </div>
      </section>

      <section className="panel log">
        <h2>Steps</h2>
        <ol ref={logRef}>
          {steps.map((st, i) => (
            <li
              key={i}
              value={i}
              data-current={i === stepIndex}
              className={`${st.type} ${i === stepIndex ? 'current' : ''}`}
              onClick={() => goTo(i)}
            >
              {st.message}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
