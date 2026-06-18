/**
 * Column Analyzer Service
 * Analyzes each column to determine its type (MSSV, HoTen, Lop, Diem, Other)
 * with a confidence score (0-100)
 *
 * Algorithm:
 * - Check column name keywords
 * - Check data content patterns
 * - Combine into final confidence score per type
 */

// ===== KEYWORD DICTIONARIES =====
const MSSV_KEYWORDS = [
  'mssv', 'mã sv', 'ma sv', 'mã sinh viên', 'ma sinh vien', 'student id',
  'student code', 'số báo danh', 'so bao danh', 'ma so sinh vien', 'mã số sinh viên',
  'id sinh viên', 'id sv', 'mã học sinh', 'ma hoc sinh', 'mã học viên',
];
const HOTEN_KEYWORDS = [
  'họ tên', 'ho ten', 'họ và tên', 'ho va ten', 'tên sinh viên', 'ten sinh vien',
  'full name', 'student name', 'sinh viên', 'sinh vien', 'tên học sinh',
  'ho va ten sv', 'ten hs', 'name',
];
const LOP_KEYWORDS = [
  'lớp', 'lop', 'mã lớp', 'ma lop', 'class', 'class name', 'classname',
  'lớp học', 'lop hoc', 'nhóm lớp', 'nhom lop', 'mã nhóm', 'ma nhom',
];
const DIEM_KEYWORDS = [
  'điểm', 'diem', 'gk', 'ck', 'tx', 'tx1', 'tx2', 'tx3', 'tbm', 'tb',
  'giữa kỳ', 'giua ky', 'cuối kỳ', 'cuoi ky', 'tổng kết', 'tong ket',
  'điểm thi', 'diem thi', 'điểm quá trình', 'diem qua trinh',
  'điểm hp', 'diem hp', 'hp', 'score', 'grade', 'mark',
  'điểm tbm', 'diem tbm', 'điểm trung bình', 'avg', 'average',
  'cc', 'thực hành', 'thuc hanh', 'thi', 'kt',
  'clo', 'plo', 'ilo', 'rubric', 'tiêu chí', 'tieu chi', 'đánh giá', 'danh gia',
];
const STT_KEYWORDS = ['stt', 'số tt', 'so tt', 'no.', 'số thứ tự', 'so thu tu'];
const NON_SCORE_KEYWORDS = [
  ...MSSV_KEYWORDS,
  ...HOTEN_KEYWORDS,
  ...LOP_KEYWORDS,
  ...STT_KEYWORDS,
  'nhóm', 'nhom', 'group', 'ghi chú', 'ghi chu', 'note', 'notes', 'remark', 'remarks',
];

// ===== UTILITY =====
function normalize(str) {
  return str
    ? str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    : '';
}

function containsKeyword(text, keywords) {
  const norm = normalize(text);
  return keywords.some((kw) => norm.includes(normalize(kw)));
}

function isNumericValue(val) {
  if (val === null || val === undefined || val === '') return false;
  const cleaned = String(val).replace(',', '.').trim();
  return !isNaN(parseFloat(cleaned)) && isFinite(Number(cleaned));
}

function parseNumericValue(val) {
  const cleaned = String(val).replace(',', '.').trim();
  return parseFloat(cleaned);
}

/**
 * Analyze a single column
 * @param {string} header - column header text
 * @param {string[]} values - sample values from this column (non-empty)
 * @returns {{ type: string, confidence: number, details: object }}
 */
function analyzeColumn(header, values) {
  const results = {
    mssv: scoreMSSV(header, values),
    hoten: scoreHoTen(header, values),
    lop: scoreLop(header, values),
    diem: scoreDiem(header, values),
    stt: scoreStt(header, values),
  };

  // Find best type
  let bestType = 'other';
  let bestScore = 30; // Minimum threshold to classify
  for (const [type, score] of Object.entries(results)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return {
    type: bestType,
    confidence: Math.min(100, Math.round(bestScore)),
    scores: results,
  };
}

// ===== SCORING FUNCTIONS =====

function scoreMSSV(header, values) {
  let score = 0;

  // Keyword match
  if (containsKeyword(header, MSSV_KEYWORDS)) score += 55;

  if (values.length === 0) return score;

  // Uniqueness (MSSV should be unique per student)
  const unique = new Set(values).size;
  const uniqueRatio = unique / values.length;
  score += uniqueRatio * 20;

  // Length consistency (MSSV lengths are usually similar)
  const lengths = values.map((v) => String(v).trim().length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const lengthVariance = lengths.reduce((sum, l) => sum + Math.abs(l - avgLen), 0) / lengths.length;
  if (avgLen >= 5 && avgLen <= 15 && lengthVariance < 3) score += 15;

  // Not a score range (MSSV not 0-10)
  const numericVals = values.filter(isNumericValue).map(parseNumericValue);
  if (numericVals.length > 0) {
    const allInScoreRange = numericVals.every((v) => v >= 0 && v <= 10);
    if (allInScoreRange) score -= 20; // Penalize if looks like scores
  }

  // Contains numbers or alphanumeric codes
  const alphanumCount = values.filter((v) => /^[a-zA-Z0-9]+$/.test(String(v).trim())).length;
  if (alphanumCount / values.length > 0.7) score += 10;

  return Math.max(0, score);
}

function scoreHoTen(header, values) {
  let score = 0;

  if (containsKeyword(header, HOTEN_KEYWORDS)) score += 55;

  if (values.length === 0) return score;

  // Multiple words (name has spaces)
  const multiWordCount = values.filter((v) => String(v).trim().split(/\s+/).length >= 2).length;
  score += (multiWordCount / values.length) * 25;

  // Contains Vietnamese diacritics or common Vietnamese name chars
  const vnCount = values.filter((v) => /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/.test(String(v))).length;
  if (vnCount / values.length > 0.5) score += 10;

  // Not numeric
  const numericCount = values.filter(isNumericValue).length;
  if (numericCount / values.length > 0.3) score -= 20;

  // Avg word count 2-5
  const avgWords = values.reduce((sum, v) => sum + String(v).trim().split(/\s+/).length, 0) / values.length;
  if (avgWords >= 2 && avgWords <= 6) score += 10;

  return Math.max(0, score);
}

function scoreLop(header, values) {
  let score = 0;

  if (containsKeyword(header, LOP_KEYWORDS)) score += 55;

  if (values.length === 0) return score;

  // High duplication rate (many students in same class)
  const unique = new Set(values).size;
  const dupRate = 1 - unique / values.length;
  if (dupRate > 0.3) score += 20;

  // Pattern match: class codes like 22DTHA1, DH22IT01, 23CNTT2
  const classPatternCount = values.filter((v) =>
    /^[A-Za-z0-9]{4,15}$/.test(String(v).trim()) &&
    /\d/.test(String(v)) &&
    /[A-Za-z]/.test(String(v))
  ).length;
  if (classPatternCount / values.length > 0.6) score += 15;

  // Not all numeric
  const numericCount = values.filter(isNumericValue).length;
  if (numericCount / values.length > 0.8) score -= 15;

  return Math.max(0, score);
}

function scoreDiem(header, values) {
  let score = 0;

  if (containsKeyword(header, NON_SCORE_KEYWORDS)) return 0;

  if (containsKeyword(header, DIEM_KEYWORDS)) score += 50;

  if (values.length === 0) return score;

  // Numeric values in range 0-10
  const numericVals = values.filter(isNumericValue).map(parseNumericValue);
  const numericRatio = numericVals.length / values.length;
  score += numericRatio * 20;

  if (numericVals.length > 0) {
    const inRangeCount = numericVals.filter((v) => v >= 0 && v <= 10).length;
    const inRangeRatio = inRangeCount / numericVals.length;
    score += inRangeRatio * 25;

    // Has decimal values (typical of scores like 8.5)
    const decimalCount = numericVals.filter((v) => !Number.isInteger(v)).length;
    if (decimalCount / numericVals.length > 0.1) score += 5;
  }

  // Not too many unique long strings (not names)
  const longStrings = values.filter((v) => String(v).trim().split(/\s+/).length > 2).length;
  if (longStrings / values.length > 0.5) score -= 20;

  return Math.max(0, score);
}

function scoreStt(header, values) {
  let score = 0;
  if (containsKeyword(header, STT_KEYWORDS)) score += 60;

  if (values.length === 0) return score;

  // Sequential integers
  const nums = values.map((v) => parseInt(v, 10)).filter((n) => !isNaN(n));
  if (nums.length === values.length) {
    const isSequential = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
    if (isSequential) score += 30;
  }

  return Math.max(0, score);
}

/**
 * Analyze all columns from a sheet
 * @param {string[]} headers
 * @param {object[]} rows - array of row objects {colIndex: value}
 * @param {number} maxCols
 * @returns {ColumnAnalysis[]}
 */
function analyzeAllColumns(headers, rows, maxCols) {
  const results = [];
  const sampleSize = Math.min(rows.length, 100);
  const sampleRows = rows.slice(0, sampleSize);

  for (let i = 0; i < maxCols; i++) {
    const header = headers[i] || `Cột ${i + 1}`;
    const values = sampleRows
      .map((r) => r[i])
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== '');

    const analysis = analyzeColumn(header, values);

    results.push({
      colIndex: i,
      header,
      analysis,
      sampleValues: values.slice(0, 5),
    });
  }

  return results;
}

/**
 * Auto-suggest identity and score mappings from column analyses
 * @param {ColumnAnalysis[]} colsA - analyzed columns from file A
 * @param {ColumnAnalysis[]} colsB - analyzed columns from file B
 * @returns {{ suggestedIdentity, suggestedScores }}
 */
function suggestMapping(colsA, colsB) {
  const findBest = (cols, type, minConf = 50) => {
    const candidates = cols
      .filter((c) => c.analysis.type === type && c.analysis.confidence >= minConf)
      .sort((a, b) => b.analysis.confidence - a.analysis.confidence);
    return candidates[0] || null;
  };

  const findAllDiem = (cols, minConf = 40) => {
    return cols
      .filter((c) => c.analysis.type === 'diem' && c.analysis.confidence >= minConf)
      .sort((a, b) => a.colIndex - b.colIndex);
  };

  const mssvA = findBest(colsA, 'mssv');
  const mssvB = findBest(colsB, 'mssv');
  const hotenA = findBest(colsA, 'hoten');
  const hotenB = findBest(colsB, 'hoten');
  const lopA = findBest(colsA, 'lop');
  const lopB = findBest(colsB, 'lop');

  const diemA = findAllDiem(colsA);
  const diemB = findAllDiem(colsB);

  // Auto-match score columns left-to-right. This keeps repeated CLO headers
  // aligned by horizontal position and still includes empty score columns.
  const suggestedScores = [];

  const maxLen = Math.max(diemA.length, diemB.length);
  for (let i = 0; i < maxLen; i++) {
    const da = diemA[i] || null;
    const db = diemB[i] || null;
    suggestedScores.push({
      labelA: da?.header ?? null,
      colIndexA: da?.colIndex ?? null,
      labelB: db?.header ?? null,
      colIndexB: db?.colIndex ?? null,
      similarity: da && db ? Math.round(nameSimilarity(da.header, db.header) * 100) : 0,
      matchMode: 'horizontal',
    });
  }

  return {
    suggestedIdentity: {
      mssv: { a: mssvA ? { colIndex: mssvA.colIndex, label: mssvA.header, confidence: mssvA.analysis.confidence } : null,
               b: mssvB ? { colIndex: mssvB.colIndex, label: mssvB.header, confidence: mssvB.analysis.confidence } : null },
      hoten: { a: hotenA ? { colIndex: hotenA.colIndex, label: hotenA.header, confidence: hotenA.analysis.confidence } : null,
               b: hotenB ? { colIndex: hotenB.colIndex, label: hotenB.header, confidence: hotenB.analysis.confidence } : null },
      lop: { a: lopA ? { colIndex: lopA.colIndex, label: lopA.header, confidence: lopA.analysis.confidence } : null,
             b: lopB ? { colIndex: lopB.colIndex, label: lopB.header, confidence: lopB.analysis.confidence } : null },
    },
    suggestedScores,
    diemA,
    diemB,
  };
}

/**
 * Simple name similarity: normalize and check overlap
 */
function nameSimilarity(a, b) {
  const normA = normalize(a).replace(/[^a-z0-9]/g, '');
  const normB = normalize(b).replace(/[^a-z0-9]/g, '');

  if (normA === normB) return 1;
  if (normA.includes(normB) || normB.includes(normA)) return 0.8;

  // Check DIEM keywords
  const diemAbbr = [
    ['gk', 'giữa kỳ', 'giuaky', 'midterm', 'mid'],
    ['ck', 'cuối kỳ', 'cuoiky', 'final'],
    ['tbm', 'tổng kết', 'tongket', 'trung bình', 'average', 'avg'],
    ['tx1', 'thường xuyên 1', 'thuong xuyen 1'],
    ['tx2', 'thường xuyên 2', 'thuong xuyen 2'],
    ['cc', 'chuyên cần', 'chuyen can', 'attendance'],
  ];
  for (const group of diemAbbr) {
    const inA = group.some((k) => normA.includes(k.replace(/[^a-z0-9]/g, '')));
    const inB = group.some((k) => normB.includes(k.replace(/[^a-z0-9]/g, '')));
    if (inA && inB) return 0.9;
  }

  // Levenshtein-like: character overlap
  const setA = new Set(normA.split(''));
  const setB = new Set(normB.split(''));
  const intersection = [...setA].filter((c) => setB.has(c)).length;
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}

module.exports = { analyzeColumn, analyzeAllColumns, suggestMapping };
