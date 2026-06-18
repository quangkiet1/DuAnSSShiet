/**
 * Excel Reader Service
 * Reads Excel files, extracts sheet names, detects header rows, returns structured data
 * Uses xlsx (SheetJS) for reading - fast and compatible
 */
const XLSX = require('xlsx');

function readWorkbook(input, options = {}) {
  if (Buffer.isBuffer(input)) {
    return XLSX.read(input, { ...options, type: 'buffer' });
  }
  return XLSX.readFile(input, options);
}

function getCellText(sheet, r, c, merges = []) {
  const address = XLSX.utils.encode_cell({ r, c });
  let cell = sheet[address];

  if (!cell && merges.length > 0) {
    const merge = merges.find((m) =>
      r >= m.s.r && r <= m.e.r && c >= m.s.c && c <= m.e.c
    );
    if (merge) {
      cell = sheet[XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c })];
    }
  }

  if (!cell) return '';
  const val = cell.w !== undefined ? cell.w : (cell.v !== undefined ? cell.v : '');
  return String(val).trim();
}

function readRowValues(sheet, rowIndex, startCol, endCol, merges = []) {
  const values = [];
  for (let c = startCol; c <= endCol; c++) {
    values.push(getCellText(sheet, rowIndex, c, merges));
  }
  return values;
}

function isNumericValue(val) {
  if (val === null || val === undefined || String(val).trim() === '') return false;
  const cleaned = String(val).replace(',', '.').trim();
  return cleaned !== '' && !Number.isNaN(Number(cleaned));
}

function isLikelyStudentId(val) {
  const text = String(val || '').trim().replace(/\s+/g, '');
  if (!text) return false;
  return /^\d{6,}$/.test(text) || (/^[a-z0-9]{6,}$/i.test(text) && /\d/.test(text));
}

function looksLikeDataRow(values) {
  const nonEmpty = values.filter((v) => String(v || '').trim() !== '');
  if (nonEmpty.length < 3) return false;

  const numericCount = nonEmpty.filter(isNumericValue).length;
  const scoreCount = nonEmpty
    .map((v) => Number(String(v).replace(',', '.')))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 10)
    .length;
  const hasStudentId = nonEmpty.some(isLikelyStudentId);

  if (hasStudentId && numericCount >= 1) return true;
  return numericCount >= 3 && scoreCount >= 2 && numericCount / nonEmpty.length >= 0.35;
}

function findFirstDataRow(sheet, range, headerRowIndex, merges = []) {
  const scanEnd = Math.min(range.e.r, headerRowIndex + 30);
  for (let r = headerRowIndex + 1; r <= scanEnd; r++) {
    const values = readRowValues(sheet, r, range.s.c, range.e.c, merges);
    if (looksLikeDataRow(values)) return r;
  }
  return Math.min(headerRowIndex + 1, range.e.r + 1);
}

function buildCompositeHeaders(sheet, range, headerStartRow, headerEndRow, merges = []) {
  const headers = [];

  for (let c = range.s.c; c <= range.e.c; c++) {
    const parts = [];
    for (let r = headerStartRow; r <= headerEndRow; r++) {
      const val = getCellText(sheet, r, c, merges);
      if (val && !parts.includes(val)) parts.push(val);
    }
    headers.push(parts.join(' / '));
  }

  return headers;
}

/**
 * Get list of sheet names from an Excel file path or buffer.
 * @param {string|Buffer} input
 * @returns {string[]}
 */
function getSheetNames(input) {
  const workbook = readWorkbook(input, { bookSheets: true });
  return workbook.SheetNames;
}

/**
 * Read raw rows from a specific sheet (first N rows for analysis)
 * @param {string|Buffer} input
 * @param {string} sheetName
 * @param {number} maxRows - max rows to read (0 = all)
 * @returns {{ rawRows: any[][], sheetName: string }}
 */
function readRawRows(input, sheetName, maxRows = 0) {
  const workbook = readWorkbook(input, {
    cellDates: true,
    cellNF: false,
    cellText: true,
    dense: false,
  });

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" không tồn tại trong file`);
  }

  // Get range
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const endRow = maxRows > 0 ? Math.min(range.e.r, maxRows - 1) : range.e.r;

  const rawRows = [];
  for (let r = range.s.r; r <= endRow; r++) {
    const row = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      row.push(getCellText(sheet, r, c));
    }
    rawRows.push(row);
  }

  return { rawRows, totalCols: range.e.c - range.s.c + 1, totalRows: range.e.r - range.s.r + 1 };
}

/**
 * Read all data from a sheet, starting at a specific header row
 * Returns array of objects { colIndex: value, ... }
 * @param {string|Buffer} input
 * @param {string} sheetName
 * @param {number} headerRowIndex - 0-based index of header row
 * @returns {{ headers: string[], rows: object[], totalDataRows: number }}
 */
function readDataFromSheet(input, sheetName, headerRowIndex) {
  const workbook = readWorkbook(input, {
    cellDates: true,
    cellNF: false,
    cellText: true,
  });

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" không tồn tại trong file`);
  }

  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const merges = sheet['!merges'] || [];
  const maxCols = range.e.c - range.s.c + 1;

  const firstDataRowIndex = findFirstDataRow(sheet, range, headerRowIndex, merges);
  const headerEndRowIndex = Math.max(headerRowIndex, firstDataRowIndex - 1);
  const headers = buildCompositeHeaders(sheet, range, headerRowIndex, headerEndRowIndex, merges);

  // Read data rows (after header)
  const rows = [];
  for (let r = firstDataRowIndex; r <= range.e.r; r++) {
    // Skip completely empty rows
    let hasData = false;
    const rowObj = { _rowIndex: r };

    for (let c = range.s.c; c <= range.e.c; c++) {
      const strVal = getCellText(sheet, r, c, merges);
      rowObj[c - range.s.c] = strVal;
      if (strVal !== '') hasData = true;
    }

    if (hasData) {
      rows.push(rowObj);
    }
  }

  return {
    headers,
    rows,
    totalDataRows: rows.length,
    maxCols,
    firstDataRowIndex,
    headerEndRowIndex,
  };
}

module.exports = { getSheetNames, readRawRows, readDataFromSheet };
