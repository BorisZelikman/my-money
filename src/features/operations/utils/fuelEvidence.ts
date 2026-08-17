export type FuelEvidenceKind = 'receipt' | 'odometer'

export interface FuelEvidenceResult {
  id: string
  fileName: string
  kind: FuelEvidenceKind
  confidence: number
  text: string
}

export interface FuelEvidenceDraft {
  title?: string
  amount?: number
  datetime?: string
  unitPrice?: number
  liters?: number
  odometer?: number
  fullTank: boolean
}

interface LoadedImage {
  source: CanvasImageSource
  width: number
  height: number
  dispose: () => void
}

interface DecimalCandidate {
  value: number
  fractionLength: number
}

const MAX_PROCESSED_PIXELS = 5_000_000

function loadImage(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => resolve({
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => URL.revokeObjectURL(url),
    })
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Could not load ${file.name}`))
    }
    image.src = url
  })
}

function percentile(histogram: number[], total: number, ratio: number) {
  const target = total * ratio
  let count = 0
  for (let index = 0; index < histogram.length; index += 1) {
    count += histogram[index]
    if (count >= target) return index
  }
  return histogram.length - 1
}

function otsuThreshold(histogram: number[], total: number) {
  let weightedTotal = 0
  histogram.forEach((count, value) => {
    weightedTotal += value * count
  })

  let backgroundWeight = 0
  let backgroundSum = 0
  let bestVariance = -1
  let bestThreshold = 127
  for (let threshold = 0; threshold < 256; threshold += 1) {
    backgroundWeight += histogram[threshold]
    if (backgroundWeight === 0) continue
    const foregroundWeight = total - backgroundWeight
    if (foregroundWeight === 0) break
    backgroundSum += threshold * histogram[threshold]
    const backgroundMean = backgroundSum / backgroundWeight
    const foregroundMean = (weightedTotal - backgroundSum) / foregroundWeight
    const variance = backgroundWeight * foregroundWeight *
      (backgroundMean - foregroundMean) ** 2
    if (variance > bestVariance) {
      bestVariance = variance
      bestThreshold = threshold
    }
  }
  return bestThreshold
}

async function renderProcessedImage(
  loaded: LoadedImage,
  crop: { x: number; y: number; width: number; height: number },
  binary: boolean
) {
  const sourceX = Math.round(loaded.width * crop.x)
  const sourceY = Math.round(loaded.height * crop.y)
  const sourceWidth = Math.max(1, Math.round(loaded.width * crop.width))
  const sourceHeight = Math.max(1, Math.round(loaded.height * crop.height))
  const preferredScale = binary ? 3 : 1.6
  const pixelScale = Math.sqrt(MAX_PROCESSED_PIXELS / (sourceWidth * sourceHeight))
  const scale = Math.max(1, Math.min(preferredScale, pixelScale, 1800 / sourceWidth))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(sourceWidth * scale))
  canvas.height = Math.max(1, Math.round(sourceHeight * scale))
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas is not available')
  context.drawImage(
    loaded.source,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  )

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const histogram = Array.from({ length: 256 }, () => 0)
  const grayscale = new Uint8Array(canvas.width * canvas.height)
  for (let pixel = 0; pixel < grayscale.length; pixel += 1) {
    const offset = pixel * 4
    const value = Math.round(
      imageData.data[offset] * 0.299 +
      imageData.data[offset + 1] * 0.587 +
      imageData.data[offset + 2] * 0.114
    )
    grayscale[pixel] = value
    histogram[value] += 1
  }

  const low = percentile(histogram, grayscale.length, 0.02)
  const high = percentile(histogram, grayscale.length, 0.98)
  const threshold = otsuThreshold(histogram, grayscale.length)
  for (let pixel = 0; pixel < grayscale.length; pixel += 1) {
    const offset = pixel * 4
    const stretched = high > low
      ? Math.max(0, Math.min(255, ((grayscale[pixel] - low) * 255) / (high - low)))
      : grayscale[pixel]
    const value = binary ? (grayscale[pixel] > threshold ? 255 : 0) : stretched
    imageData.data[offset] = value
    imageData.data[offset + 1] = value
    imageData.data[offset + 2] = value
    imageData.data[offset + 3] = 255
  }
  context.putImageData(imageData, 0, 0)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Could not prepare image for OCR'))
    }, 'image/png')
  })
}

function decimalCandidates(text: string): DecimalCandidate[] {
  return Array.from(text.matchAll(/(^|\D)(\d{1,5})[.,](\d{2,4})(?!\d)/g)).flatMap(
    (match) => {
      const value = Number(`${match[2]}.${match[3]}`)
      return Number.isFinite(value)
        ? [{ value, fractionLength: match[3].length }]
        : []
    }
  )
}

function mostRepeatedTotal(candidates: DecimalCandidate[]) {
  const totals = new Map<string, { value: number; count: number }>()
  candidates
    .filter(({ value }) => value >= 10 && value < 100_000)
    .forEach(({ value }) => {
      const key = value.toFixed(2)
      totals.set(key, { value, count: (totals.get(key)?.count || 0) + 1 })
    })
  return Array.from(totals.values()).sort(
    (first, second) => second.count - first.count || second.value - first.value
  )[0]?.value
}

function contextualReceiptTotal(text: string) {
  const lines = text
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const totalLabels = [
    /סה\s*["״']?\s*כ.*שולם/i,
    /סך\s*הכל.*שולם/i,
    /total\s+paid/i,
    /grand\s+total/i,
    /לתשלום/i,
    /סה\s*["״']?\s*כ/i,
    /סך\s*הכל/i,
    /\btotal\b/i,
  ]

  for (const label of totalLabels) {
    for (let index = 0; index < lines.length; index += 1) {
      if (!label.test(lines[index])) continue
      const nearbyLines = [
        lines[index],
        lines[index - 1],
        lines[index + 1],
        lines[index - 2],
        lines[index + 2],
      ].filter((line): line is string => !!line)
      for (const line of nearbyLines) {
        const candidates = decimalCandidates(line)
          .filter(({ value }) => value >= 0.01 && value < 100_000)
          .sort((first, second) => second.value - first.value)
        if (candidates.length > 0) return candidates[0].value
      }
    }
  }
  return undefined
}

function parseReceiptDate(text: string) {
  const dateMatch = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/)
  if (!dateMatch) return undefined
  const timeMatch = text.match(/\b([01]?\d|2[0-3])[:.](\d{2})\b/)
  const day = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const year = Number(dateMatch[3])
  const hour = timeMatch ? Number(timeMatch[1]) : 12
  const minute = timeMatch ? Number(timeMatch[2]) : 0
  const date = new Date(year, month - 1, day, hour, minute)
  if (
    date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day
  ) return undefined
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
}

function parseReceiptTitle(text: string) {
  const merchants: Array<[RegExp, string]> = [
    [/rami[\s-]*levy|רמי\s*לוי/i, 'Rami Levy'],
    [/shufersal|שופרסל/i, 'Shufersal'],
    [/yohananof|יוחננוף/i, 'Yohananof'],
    [/victory|ויקטורי/i, 'Victory'],
    [/osher\s*ad|אושר\s*עד/i, 'Osher Ad'],
  ]
  return merchants.find(([pattern]) => pattern.test(text))?.[1]
}

export function parseFuelReceipt(text: string): Partial<FuelEvidenceDraft> {
  const candidates = decimalCandidates(text)
  const amount = contextualReceiptTotal(text) ?? mostRepeatedTotal(candidates)
  const liters = candidates
    .filter(({ value, fractionLength }) => value >= 10 && value <= 100 && fractionLength >= 3)
    .sort((first, second) => second.fractionLength - first.fractionLength)[0]?.value
  const scannedUnitPrice = candidates
    .filter(({ value }) => value >= 3 && value <= 20)
    .sort((first, second) => Math.abs(first.value - 7.5) - Math.abs(second.value - 7.5))[0]?.value
  const derivedUnitPrice = amount && liters ? amount / liters : undefined
  const unitPrice = derivedUnitPrice && (
    !scannedUnitPrice || Math.abs(scannedUnitPrice - derivedUnitPrice) / derivedUnitPrice > 0.03
  ) ? derivedUnitPrice : scannedUnitPrice

  return {
    title: parseReceiptTitle(text),
    amount,
    datetime: parseReceiptDate(text),
    liters,
    unitPrice,
  }
}

export function buildFuelEvidenceDraftFromText(text: string): FuelEvidenceDraft {
  return {
    ...parseFuelReceipt(text),
    fullTank: true,
  }
}

export function parseOdometer(text: string) {
  const candidates = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\D/g, ''))
    .filter((digits) => digits.length >= 5 && digits.length <= 7)
    .map(Number)
    .filter((value) => value >= 10_000 && value <= 9_999_999)
  return candidates.sort((first, second) => second - first)[0]
}

export function buildFuelEvidenceDraft(results: FuelEvidenceResult[]): FuelEvidenceDraft {
  const receiptText = results
    .filter((result) => result.kind === 'receipt')
    .map((result) => result.text)
    .join('\n')
  const odometerText = results
    .filter((result) => result.kind === 'odometer')
    .map((result) => result.text)
    .join('\n')
  return {
    ...parseFuelReceipt(receiptText),
    odometer: parseOdometer(odometerText),
    fullTank: true,
  }
}

export async function recognizeFuelEvidence(
  files: File[],
  onProgress: (progress: number) => void,
  signal?: AbortSignal,
  forceReceipt = false
) {
  const loaded = await Promise.all(files.map(loadImage))
  const kinds = loaded.map((image): FuelEvidenceKind =>
    forceReceipt || image.height / image.width > 1.65 ? 'receipt' : 'odometer'
  )
  let worker: Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>> | null = null
  let activeFileIndex = 0
  const abort = () => {
    if (worker) void worker.terminate()
  }
  signal?.addEventListener('abort', abort, { once: true })

  try {
    const { createWorker, PSM } = await import('tesseract.js')
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    worker = await createWorker(['heb', 'eng'], undefined, {
      logger: (message) => {
        if (message.status === 'recognizing text') {
          onProgress(((activeFileIndex + message.progress) / files.length) * 0.9)
        }
      },
    })
    const results: FuelEvidenceResult[] = []

    for (let index = 0; index < files.length; index += 1) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      const file = files[index]
      const image = loaded[index]
      const kind = kinds[index]
      activeFileIndex = index
      let text = ''
      let confidence = 0

      if (kind === 'receipt') {
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SPARSE_TEXT,
          tessedit_char_whitelist: '',
          preserve_interword_spaces: '1',
        })
        const enhanced = await renderProcessedImage(
          image,
          { x: 0, y: 0, width: 1, height: 1 },
          false
        )
        const originalResult = await worker.recognize(file)
        const enhancedResult = await worker.recognize(enhanced)
        text = `${originalResult.data.text}\n${enhancedResult.data.text}`
        confidence = Math.max(originalResult.data.confidence, enhancedResult.data.confidence)
      } else {
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SPARSE_TEXT,
          tessedit_char_whitelist: '0123456789',
          preserve_interword_spaces: '1',
        })
        const crops = await Promise.all([
          renderProcessedImage(
            image,
            { x: 0.2, y: 0.45, width: 0.65, height: 0.4 },
            true
          ),
          renderProcessedImage(
            image,
            { x: 0.34, y: 0.56, width: 0.42, height: 0.22 },
            true
          ),
        ])
        const cropResults = []
        for (const crop of crops) cropResults.push(await worker.recognize(crop))
        text = cropResults.map((result) => result.data.text).join('\n')
        confidence = Math.max(...cropResults.map((result) => result.data.confidence))
      }

      results.push({
        id: `${index}-${file.name}-${file.lastModified}`,
        fileName: file.name,
        kind,
        confidence,
        text,
      })
      onProgress(((index + 1) / files.length) * 0.9)
    }

    onProgress(1)
    return { results, draft: buildFuelEvidenceDraft(results) }
  } finally {
    signal?.removeEventListener('abort', abort)
    loaded.forEach((image) => image.dispose())
    if (worker) await worker.terminate().catch(() => undefined)
  }
}
