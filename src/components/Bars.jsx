/**
 * Renders one step as a row of bars.
 *
 * Each bar is keyed by its stable id and positioned absolutely by its current
 * index, so when two bars swap, React keeps the same DOM node and CSS slides it
 * to its new slot instead of just recolouring it.
 */
export default function Bars({ step, tick, durationMs }) {
  const { array, ids, compare, swap, write, pivot, sorted, type } = step
  const n = array.length
  const min = Math.min(...array)
  const max = Math.max(...array)
  const range = max - min || 1
  const showLabels = n <= 25
  const celebrate = type === 'done'

  const stateOf = (i) => {
    if (swap.includes(i)) return 'swap'
    if (write.includes(i)) return 'write'
    if (compare.includes(i)) return 'compare'
    if (pivot.includes(i)) return 'pivot'
    if (sorted.includes(i)) return 'sorted'
    return 'idle'
  }

  // Render in id order so DOM order never changes (nodes just move via `left`).
  const order = ids.map((id, index) => ({ id, index })).sort((a, b) => a.id - b.id)

  return (
    <div className="bars-wrap" style={{ '--dur': `${durationMs}ms` }}>
      <div className="bars" role="img" aria-label={`Array: ${array.join(', ')}`}>
        {order.map(({ id, index }) => {
          const value = array[index]
          const height = 12 + ((value - min) / range) * 88 // smallest bar stays visible
          const state = stateOf(index)
          return (
            <div
              className="bar-slot"
              key={id}
              style={{ left: `${(index * 100) / n}%`, width: `${100 / n}%` }}
            >
              <div
                className={`bar-rise`}
                style={{ height: `${height}%`, '--i': id }}
              >
                <div
                  className={`bar ${state} ${state === 'swap' ? `hop-${tick % 2}` : ''} ${
                    celebrate ? 'celebrate' : ''
                  }`}
                  style={{ '--i': index }}
                >
                  {showLabels && <span className="value">{value}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {showLabels && (
        <div className="indices" aria-hidden="true">
          {array.map((_, i) => (
            <span key={i} style={{ width: `${100 / n}%` }}>
              {i}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
