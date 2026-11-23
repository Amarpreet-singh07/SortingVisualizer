/**
 * Every algorithm takes an array of numbers and returns a list of "steps".
 * A step is a full snapshot of the visualisation at that moment:
 *   {
 *     array:   number[]          current values
 *     compare: number[]          indices being compared
 *     swap:    number[]          indices just swapped
 *     write:   number[]          indices just overwritten (merge sort)
 *     pivot:   number[]          pivot / key / min indices
 *     sorted:  number[]          indices already in final position
 *     type:    'start' | 'compare' | 'swap' | 'write' | 'mark' | 'done'
 *     message: string            plain-English description
 *   }
 * Pre-computing steps makes play / pause / step-back trivial.
 */

function createRecorder(input) {
  const arr = [...input]
  // Every bar keeps a stable id so the UI can animate it sliding to a new slot.
  const ids = arr.map((_, i) => i)
  const sorted = new Set()
  const steps = []

  const swapAt = (a, b) => {
    ;[arr[a], arr[b]] = [arr[b], arr[a]]
    ;[ids[a], ids[b]] = [ids[b], ids[a]]
  }

  const push = (type, message, extra = {}) => {
    steps.push({
      array: [...arr],
      ids: [...ids],
      compare: [],
      swap: [],
      write: [],
      pivot: [],
      ...extra,
      sorted: [...sorted],
      type,
      message,
    })
  }

  return { arr, ids, sorted, steps, push, swapAt }
}

function finish({ arr, sorted, push }) {
  arr.forEach((_, i) => sorted.add(i))
  push('done', 'The array is sorted!')
}

/* ---------------------------------------------------------------- Bubble */
function bubbleSort(input) {
  const rec = createRecorder(input)
  const { arr, sorted, push, swapAt } = rec
  const n = arr.length
  push('start', 'Initial array. Bubble sort repeatedly swaps adjacent elements that are out of order.')

  for (let i = 0; i < n - 1; i++) {
    let swapped = false
    for (let j = 0; j < n - i - 1; j++) {
      push('compare', `Compare ${arr[j]} and ${arr[j + 1]}.`, { compare: [j, j + 1] })
      if (arr[j] > arr[j + 1]) {
        swapAt(j, j + 1)
        swapped = true
        push('swap', `${arr[j + 1]} > ${arr[j]}, so swap them.`, { swap: [j, j + 1] })
      }
    }
    sorted.add(n - i - 1)
    push('mark', `${arr[n - i - 1]} has bubbled up to its final position.`)
    if (!swapped) {
      for (let k = 0; k < n - i - 1; k++) sorted.add(k)
      push('mark', 'No swaps in this pass, so the rest is already sorted.')
      break
    }
  }
  finish(rec)
  return rec.steps
}

/* ------------------------------------------------------------- Selection */
function selectionSort(input) {
  const rec = createRecorder(input)
  const { arr, sorted, push, swapAt } = rec
  const n = arr.length
  push('start', 'Initial array. Selection sort finds the smallest remaining value and moves it to the front.')

  for (let i = 0; i < n - 1; i++) {
    let min = i
    push('mark', `Start pass ${i + 1}: assume ${arr[i]} is the minimum.`, { pivot: [min] })
    for (let j = i + 1; j < n; j++) {
      push('compare', `Compare ${arr[j]} with current minimum ${arr[min]}.`, {
        compare: [j],
        pivot: [min],
      })
      if (arr[j] < arr[min]) {
        min = j
        push('mark', `${arr[min]} is the new minimum.`, { pivot: [min] })
      }
    }
    if (min !== i) {
      swapAt(i, min)
      push('swap', `Swap the minimum ${arr[i]} into position ${i}.`, { swap: [i, min] })
    }
    sorted.add(i)
    push('mark', `${arr[i]} is now in its final position.`)
  }
  finish(rec)
  return rec.steps
}

/* ------------------------------------------------------------- Insertion */
function insertionSort(input) {
  const rec = createRecorder(input)
  const { arr, sorted, push, swapAt } = rec
  const n = arr.length
  push('start', 'Initial array. Insertion sort grows a sorted section on the left, inserting one value at a time.')
  if (n > 0) sorted.add(0)

  for (let i = 1; i < n; i++) {
    let j = i
    push('mark', `Take ${arr[i]} and insert it into the sorted section on the left.`, { pivot: [i] })
    while (j > 0) {
      push('compare', `Compare ${arr[j]} with ${arr[j - 1]}.`, { compare: [j - 1, j] })
      if (arr[j - 1] > arr[j]) {
        swapAt(j - 1, j)
        push('swap', `${arr[j]} > ${arr[j - 1]}, so shift ${arr[j - 1]} left.`, { swap: [j - 1, j] })
        j--
      } else {
        break
      }
    }
    for (let k = 0; k <= i; k++) sorted.add(k)
    push('mark', `${arr[j]} is inserted. The first ${i + 1} elements are sorted.`)
  }
  finish(rec)
  return rec.steps
}

/* ----------------------------------------------------------------- Merge */
function mergeSort(input) {
  const rec = createRecorder(input)
  const { arr, ids, sorted, push } = rec
  const n = arr.length
  push('start', 'Initial array. Merge sort splits the array in halves, sorts each, then merges them.')

  const sort = (lo, hi) => {
    if (lo >= hi) return
    const mid0 = Math.floor((lo + hi) / 2)
    sort(lo, mid0)
    sort(mid0 + 1, hi)

    const isFinalMerge = lo === 0 && hi === n - 1
    // Merge in place: when the right element is smaller it is lifted out and
    // inserted before the left element, and everything in between shifts right.
    let i = lo
    let mid = mid0
    let j = mid0 + 1

    push('mark', `Merge the sorted halves [${arr.slice(lo, mid + 1)}] and [${arr.slice(j, hi + 1)}].`, {
      pivot: Array.from({ length: hi - lo + 1 }, (_, x) => lo + x),
    })

    while (i <= mid && j <= hi) {
      push('compare', `Compare ${arr[i]} (left) with ${arr[j]} (right).`, { compare: [i, j] })
      if (arr[i] <= arr[j]) {
        if (isFinalMerge) sorted.add(i)
        i++
      } else {
        const value = arr[j]
        const id = ids[j]
        for (let k = j; k > i; k--) {
          arr[k] = arr[k - 1]
          ids[k] = ids[k - 1]
        }
        arr[i] = value
        ids[i] = id
        if (isFinalMerge) sorted.add(i)
        push('write', `${value} is smaller, so insert it at position ${i} and shift the others right.`, {
          write: [i],
        })
        i++
        mid++
        j++
      }
    }
    if (isFinalMerge) for (let k = lo; k <= hi; k++) sorted.add(k)
    push('mark', `Positions ${lo}–${hi} are now merged in order.`)
  }

  sort(0, n - 1)
  finish(rec)
  return rec.steps
}

/* ----------------------------------------------------------------- Quick */
function quickSort(input) {
  const rec = createRecorder(input)
  const { arr, sorted, push, swapAt } = rec
  const n = arr.length
  push('start', 'Initial array. Quick sort picks a pivot and partitions values smaller / larger around it.')

  const sort = (lo, hi) => {
    if (lo > hi) return
    if (lo === hi) {
      sorted.add(lo)
      push('mark', `${arr[lo]} is alone in its partition, so it is in its final position.`)
      return
    }
    const pivot = arr[hi]
    push('mark', `Choose ${pivot} (last element) as the pivot for positions ${lo}–${hi}.`, { pivot: [hi] })
    let i = lo
    for (let j = lo; j < hi; j++) {
      push('compare', `Compare ${arr[j]} with pivot ${pivot}.`, { compare: [j], pivot: [hi] })
      if (arr[j] < pivot) {
        if (i !== j) {
          swapAt(i, j)
          push('swap', `${arr[i]} < ${pivot}, so move it to the left side.`, { swap: [i, j], pivot: [hi] })
        }
        i++
      }
    }
    if (i !== hi) {
      swapAt(i, hi)
      push('swap', `Place pivot ${pivot} at its final position ${i}.`, { swap: [i, hi] })
    }
    sorted.add(i)
    push('mark', `Pivot ${pivot} is now in its final position.`)
    sort(lo, i - 1)
    sort(i + 1, hi)
  }

  sort(0, n - 1)
  finish(rec)
  return rec.steps
}

/* ------------------------------------------------------------------ Heap */
function heapSort(input) {
  const rec = createRecorder(input)
  const { arr, sorted, push, swapAt } = rec
  const n = arr.length
  push('start', 'Initial array. Heap sort builds a max-heap, then repeatedly moves the largest value to the end.')

  const heapify = (size, root) => {
    let largest = root
    const l = 2 * root + 1
    const r = 2 * root + 2
    if (l < size) {
      push('compare', `Compare left child ${arr[l]} with ${arr[largest]}.`, { compare: [l, largest] })
      if (arr[l] > arr[largest]) largest = l
    }
    if (r < size) {
      push('compare', `Compare right child ${arr[r]} with ${arr[largest]}.`, { compare: [r, largest] })
      if (arr[r] > arr[largest]) largest = r
    }
    if (largest !== root) {
      swapAt(root, largest)
      push('swap', `Swap ${arr[root]} up to restore the heap.`, { swap: [root, largest] })
      heapify(size, largest)
    }
  }

  push('mark', 'Phase 1: build a max-heap.')
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i)

  push('mark', 'Phase 2: repeatedly move the max to the end.')
  for (let end = n - 1; end > 0; end--) {
    swapAt(0, end)
    sorted.add(end)
    push('swap', `Move the max ${arr[end]} to position ${end}.`, { swap: [0, end] })
    heapify(end, 0)
  }
  finish(rec)
  return rec.steps
}

export const ALGORITHMS = {
  bubble: {
    name: 'Bubble Sort',
    run: bubbleSort,
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    description: 'Repeatedly swaps adjacent elements that are in the wrong order.',
  },
  selection: {
    name: 'Selection Sort',
    run: selectionSort,
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    description: 'Finds the minimum of the unsorted part and places it at the front.',
  },
  insertion: {
    name: 'Insertion Sort',
    run: insertionSort,
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    description: 'Builds a sorted section by inserting each element into its correct spot.',
  },
  merge: {
    name: 'Merge Sort',
    run: mergeSort,
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
    description: 'Divides the array in halves, sorts them recursively, and merges the results.',
  },
  quick: {
    name: 'Quick Sort',
    run: quickSort,
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
    space: 'O(log n)',
    description: 'Partitions around a pivot so smaller values go left and larger go right.',
  },
  heap: {
    name: 'Heap Sort',
    run: heapSort,
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(1)',
    description: 'Builds a max-heap, then repeatedly extracts the largest element.',
  },
}


