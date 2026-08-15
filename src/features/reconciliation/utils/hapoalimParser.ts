import type { BankTransaction } from '../types'

type SpreadsheetCell = Date | number | string | boolean | null

function cellText(value: SpreadsheetCell) {
  return value === null ? '' : String(value).trim()
}

function normalizeHeader(value: SpreadsheetCell) {
  return cellText(value).replace(/\s+/g, '').toLocaleLowerCase('he')
}

function findColumn(headers: SpreadsheetCell[], candidates: string[], fallback: number) {
  const normalizedCandidates = candidates.map((item) => normalizeHeader(item))
  const found = headers.findIndex((header) => normalizedCandidates.some((candidate) =>
    normalizeHeader(header).includes(candidate)
  ))
  return found >= 0 ? found : fallback
}

function parseNumber(value: SpreadsheetCell) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const normalized = cellText(value).replace(/[,₪\s]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseDate(value: SpreadsheetCell): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === 'number') {
    const excelEpoch = Date.UTC(1899, 11, 30)
    return new Date(excelEpoch + value * 86_400_000)
  }
  const parts = cellText(value).match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/)
  if (!parts) return null
  const year = Number(parts[3]) < 100 ? 2000 + Number(parts[3]) : Number(parts[3])
  const date = new Date(year, Number(parts[2]) - 1, Number(parts[1]), 12)
  return Number.isNaN(date.getTime()) ? null : date
}

function isCardSettlement(description: string) {
  return /ישראכרט|כאל|כרטיס(?:י)?\s*אשראי|american\s*express|mastercard|visa/i.test(description)
}

export async function parseHapoalimWorkbook(file: File): Promise<BankTransaction[]> {
  const { default: readXlsxFile } = await import('read-excel-file')
  const rows = await readXlsxFile(file) as SpreadsheetCell[][]
  const headerIndex = rows.findIndex((row) => {
    const text = row.map(normalizeHeader).join('|')
    return text.includes('תאריך') && (text.includes('פעולה') || text.includes('תנועה'))
  })
  if (headerIndex < 0) {
    throw new Error('Hapoalim column headers were not found in this workbook.')
  }

  const headers = rows[headerIndex]
  const dateColumn = findColumn(headers, ['תאריך'], 0)
  const operationColumn = findColumn(headers, ['פעולה', 'תנועה'], 1)
  const detailsColumn = findColumn(headers, ['פרטים', 'תיאור'], 2)
  const referenceColumn = findColumn(headers, ['אסמכתא', 'סימוכין'], 3)
  const debitColumn = findColumn(headers, ['חובה'], 4)
  const creditColumn = findColumn(headers, ['זכות'], 5)
  const balanceColumn = findColumn(headers, ['יתרה'], 6)
  const beneficiaryColumn = findColumn(headers, ['מוטב', 'שם'], 8)
  const purposeColumn = findColumn(headers, ['מטרה', 'הערה'], 9)

  return rows.slice(headerIndex + 1).flatMap((row, index) => {
    const date = parseDate(row[dateColumn])
    const debit = Math.abs(parseNumber(row[debitColumn]))
    const credit = Math.abs(parseNumber(row[creditColumn]))
    if (!date || (debit === 0 && credit === 0)) return []

    const description = [
      row[operationColumn],
      row[detailsColumn],
      row[beneficiaryColumn],
      row[purposeColumn],
    ].map(cellText).filter(Boolean).filter((value, valueIndex, values) =>
      values.indexOf(value) === valueIndex
    ).join(' · ')
    const amount = credit > 0 ? credit : -debit

    return [{
      id: `bank-${headerIndex + index + 2}`,
      rowNumber: headerIndex + index + 2,
      date,
      description: description || 'Bank transaction',
      reference: cellText(row[referenceColumn]),
      amount,
      balance: row[balanceColumn] === null ? undefined : parseNumber(row[balanceColumn]),
      isCardSettlement: isCardSettlement(description),
    }]
  }).sort((left, right) => right.date.getTime() - left.date.getTime())
}
