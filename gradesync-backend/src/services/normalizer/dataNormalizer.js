/**
 * Data Normalizer Service
 * Normalizes MSSV, HoTen, Lop, and Diem values before comparison
 */

/**
 * Normalize MSSV (Student ID)
 * - Trim whitespace
 * - Preserve leading zeros (keep as string)
 * - Remove invisible characters
 */
function normalizeMSSV(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .trim()
    .replace(/\s+/g, '')          // Remove all spaces
    .replace(/\u00a0/g, '')       // Remove non-breaking spaces
    .replace(/\u200b/g, '')       // Remove zero-width spaces
    .toUpperCase();               // Normalize case for IDs like AB123
}

/**
 * Normalize HoTen (Full Name)
 * - Trim leading/trailing whitespace
 * - Normalize multiple spaces to single space
 * - Optional: case-insensitive (lowercase)
 * - Optional: remove diacritics (for fuzzy match)
 */
function normalizeHoTen(val, options = {}) {
  if (val === null || val === undefined) return '';
  let str = String(val)
    .trim()
    .replace(/\s+/g, ' ')         // Normalize spaces
    .replace(/\u00a0/g, ' ')      // Non-breaking space
    .replace(/\u200b/g, '');      // Zero-width space

  if (options.caseInsensitive !== false) {
    str = str.toLowerCase();
  }

  if (options.removeAccents) {
    str = removeVietnameseDiacritics(str);
  }

  return str;
}

/**
 * Normalize Lop (Class code)
 * - Trim and uppercase
 * - Remove spaces
 */
function normalizeLop(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();
}

/**
 * Build the comparison key used to match rows between two files.
 * A student is considered the same only when both class and MSSV match.
 */
function createStudentKey(lop, mssv) {
  const normLop = normalizeLop(lop);
  const normMSSV = normalizeMSSV(mssv);
  if (!normLop || !normMSSV) return '';
  return `${normLop}__${normMSSV}`;
}

/**
 * Normalize Diem (Score)
 * - Replace comma decimal separator with dot
 * - Remove whitespace
 * - Parse to float
 * - Return null if not a valid number
 */
function normalizeDiem(val) {
  if (val === null || val === undefined || String(val).trim() === '') return null;

  const str = String(val)
    .trim()
    .replace(',', '.')            // Vietnamese decimal: 8,5 → 8.5
    .replace(/[^\d.]/g, '');     // Remove anything that's not digit or dot

  const num = parseFloat(str);
  if (isNaN(num)) return null;

  // Round to avoid floating point noise (e.g., 8.500000001)
  return Math.round(num * 10000) / 10000;
}

/**
 * Compare two score values with tolerance
 * @param {number|null} a
 * @param {number|null} b
 * @param {number} tolerance - default 0.001
 * @returns {{ same: boolean, reason: string }}
 */
function compareScores(a, b, tolerance = 0.001) {
  // Both null/empty
  if (a === null && b === null) return { same: true, reason: 'Cả hai đều trống' };
  // One null
  if (a === null) return { same: false, reason: `File A trống, File B: ${b}` };
  if (b === null) return { same: false, reason: `File A: ${a}, File B trống` };

  const diff = Math.abs(a - b);
  if (diff <= tolerance) {
    return { same: true, reason: '' };
  }
  return {
    same: false,
    reason: `${a} ≠ ${b} (chênh lệch: ${diff.toFixed(4)})`,
  };
}

/**
 * Remove Vietnamese diacritical marks for fuzzy name matching
 */
function removeVietnameseDiacritics(str) {
  const map = {
    à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
    ă: 'a', ắ: 'a', ằ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
    â: 'a', ấ: 'a', ầ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
    è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
    ê: 'e', ế: 'e', ề: 'e', ể: 'e', ễ: 'e', ệ: 'e',
    ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
    ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
    ô: 'o', ố: 'o', ồ: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
    ơ: 'o', ớ: 'o', ờ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
    ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
    ư: 'u', ứ: 'u', ừ: 'u', ử: 'u', ữ: 'u', ự: 'u',
    ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
    đ: 'd',
    // Uppercase
    À: 'A', Á: 'A', Ả: 'A', Ã: 'A', Ạ: 'A',
    Ă: 'A', Ắ: 'A', Ằ: 'A', Ẳ: 'A', Ẵ: 'A', Ặ: 'A',
    Â: 'A', Ấ: 'A', Ầ: 'A', Ẩ: 'A', Ẫ: 'A', Ậ: 'A',
    È: 'E', É: 'E', Ẻ: 'E', Ẽ: 'E', Ẹ: 'E',
    Ê: 'E', Ế: 'E', Ề: 'E', Ể: 'E', Ễ: 'E', Ệ: 'E',
    Ì: 'I', Í: 'I', Ỉ: 'I', Ĩ: 'I', Ị: 'I',
    Ò: 'O', Ó: 'O', Ỏ: 'O', Õ: 'O', Ọ: 'O',
    Ô: 'O', Ố: 'O', Ồ: 'O', Ổ: 'O', Ỗ: 'O', Ộ: 'O',
    Ơ: 'O', Ớ: 'O', Ờ: 'O', Ở: 'O', Ỡ: 'O', Ợ: 'O',
    Ù: 'U', Ú: 'U', Ủ: 'U', Ũ: 'U', Ụ: 'U',
    Ư: 'U', Ứ: 'U', Ừ: 'U', Ử: 'U', Ữ: 'U', Ự: 'U',
    Ỳ: 'Y', Ý: 'Y', Ỷ: 'Y', Ỹ: 'Y', Ỵ: 'Y',
    Đ: 'D',
  };
  return str.replace(/[^\u0000-\u007E]/g, (c) => map[c] || c);
}

module.exports = {
  normalizeMSSV,
  normalizeHoTen,
  normalizeLop,
  createStudentKey,
  normalizeDiem,
  compareScores,
  removeVietnameseDiacritics,
};
