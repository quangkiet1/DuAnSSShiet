/**
 * Header Detector Service
 * Scans first N rows of an Excel sheet to detect the actual header row.
 * Strategy: Find the row with the most non-empty, non-numeric cells
 * that contain recognizable column-name-like text.
 */

// Minimum number of non-empty cells to consider a row a potential header
const MIN_HEADER_CELLS = 2;
// Score thresholds
const SCAN_ROWS = 50;

/**
 * Detect the header row index (0-based) from raw rows
 * @param {string[][]} rawRows
 * @returns {{ headerRowIndex: number, confidence: number, reason: string }}
 */
function detectHeaderRow(rawRows) {
  const scanLimit = Math.min(rawRows.length, SCAN_ROWS);
  let bestScore = -1;
  let bestRowIndex = 0;
  let bestReason = 'Mặc định dòng đầu tiên';

  for (let i = 0; i < scanLimit; i++) {
    const row = rawRows[i];
    const score = scoreRowAsHeader(row, rawRows, i);

    if (score > bestScore) {
      bestScore = score;
      bestRowIndex = i;
      bestReason = `Dòng ${i + 1} có điểm header: ${score.toFixed(1)}`;
    }
  }

  // Confidence: normalize score
  const confidence = Math.min(100, Math.max(0, bestScore));

  return {
    headerRowIndex: bestRowIndex,
    confidence: Math.round(confidence),
    reason: bestReason,
  };
}

/**
 * Score a row as a header row (higher = more likely header)
 */
function scoreRowAsHeader(row, allRows, rowIndex) {
  if (!row || row.length === 0) return 0;

  const nonEmptyCells = row.filter((c) => c && c.toString().trim() !== '');
  if (nonEmptyCells.length < MIN_HEADER_CELLS) return 0;

  let score = 0;

  // 1. Fraction of non-empty cells (headers tend to be dense)
  const density = nonEmptyCells.length / row.length;
  score += density * 20;

  // 2. Cells that look like column names (text, not pure numbers)
  const textLikeCells = nonEmptyCells.filter((c) => !isNumeric(c));
  const textRatio = textLikeCells.length / nonEmptyCells.length;
  score += textRatio * 30;

  // 3. Contains recognized keywords
  const keywordScore = checkHeaderKeywords(nonEmptyCells);
  score += keywordScore * 40;

  // 4. Penalty: if this row looks like data (numbers, student IDs, etc.)
  const dataLikePenalty = checkDataLike(row);
  score -= dataLikePenalty * 15;

  // 5. Bonus: rows below this one have more numeric data (scores)
  if (rowIndex < allRows.length - 3) {
    const nextRows = allRows.slice(rowIndex + 1, rowIndex + 4);
    const hasDataBelow = nextRows.some((r) => r.some((c) => isNumeric(c) || (c && c.trim() !== '')));
    if (hasDataBelow) score += 10;
  }

  // 6. Short values are more header-like
  const avgLength = nonEmptyCells.reduce((sum, c) => sum + c.length, 0) / nonEmptyCells.length;
  if (avgLength < 30) score += 10;
  if (avgLength > 100) score -= 20;

  return score;
}

const HEADER_KEYWORDS = [
  // MSSV
  'mssv', 'mã sv', 'mã sinh viên', 'ma sinh vien', 'student id', 'student code', 'số báo danh', 'ma so sinh vien',
  // Name
  'họ tên', 'ho ten', 'họ và tên', 'ho va ten', 'tên sinh viên', 'ten sinh vien', 'full name', 'student name', 'sinh viên',
  // Class
  'lớp', 'lop', 'mã lớp', 'ma lop', 'class', 'class name', 'classname',
  // Score
  'điểm', 'diem', 'gk', 'ck', 'tx1', 'tx2', 'tbm', 'giữa kỳ', 'cuối kỳ', 'tổng kết', 'điểm thi',
  // Common
  'stt', 'số tt', 'no', 'ngành', 'khoa', 'niên khóa',
];

function checkHeaderKeywords(cells) {
  let matchCount = 0;
  for (const cell of cells) {
    const lower = cell.toLowerCase().normalize('NFC');
    for (const kw of HEADER_KEYWORDS) {
      if (lower.includes(kw)) {
        matchCount++;
        break;
      }
    }
  }
  return matchCount / cells.length;
}

function checkDataLike(row) {
  const nonEmpty = row.filter((c) => c && c.trim() !== '');
  if (nonEmpty.length === 0) return 0;
  const dataCount = nonEmpty.filter((c) => {
    // Looks like MSSV (long number string) or data value
    return isNumeric(c) || /^\d{5,}$/.test(c);
  }).length;
  return dataCount / nonEmpty.length;
}

function isNumeric(val) {
  if (!val || val.toString().trim() === '') return false;
  const cleaned = val.toString().replace(',', '.').trim();
  return !isNaN(parseFloat(cleaned)) && isFinite(cleaned);
}

module.exports = { detectHeaderRow };
