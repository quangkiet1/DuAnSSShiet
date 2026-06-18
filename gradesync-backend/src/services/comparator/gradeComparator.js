/**
 * Grade Comparison Engine
 * Implements O(n + m) comparison using hash maps keyed by MSSV
 *
 * Matching priority:
 *   1. MSSV (primary key)
 *   2. Họ tên (warning if mismatch)
 *   3. Lớp (warning if mismatch)
 * → Same MSSV but different class: still matched, CLASS_MISMATCH warning.
 *
 * Input:
 *   - rowsA, rowsB: array of row objects from readDataFromSheet()
 *   - identityMapping: { mssv: {a: colIdx, b: colIdx}, hoten: {...}, lop: {...} }
 *   - scoreMappings: [{ colIndexA, labelA, colIndexB, labelB }]
 *   - rules: { tolerance, caseInsensitive, ignoreAccents }
 *
 * Output: ComparisonResult object
 */

const {
  normalizeMSSV,
  normalizeHoTen,
  normalizeLop,
  normalizeDiem,
  compareScores,
} = require('../normalizer/dataNormalizer');

/**
 * Main comparison function
 */
function compareGrades(rowsA, rowsB, identityMapping, scoreMappings, rules = {}) {
  const tolerance = rules.tolerance ?? 0.001;
  const nameOptions = {
    caseInsensitive: rules.caseInsensitive !== false,
    removeAccents: rules.ignoreAccents === true,
  };

  // ===== STEP 1: Build mapA from File A (keyed by MSSV) =====
  const mapA = new Map();
  const duplicatesA = [];

  for (const row of rowsA) {
    const rawMSSV = row[identityMapping.mssv.a] ?? '';
    const lop = row[identityMapping.lop?.a] ?? '';
    const mssv = normalizeMSSV(rawMSSV);

    if (!mssv) continue; // Skip rows without MSSV

    const identityKey = mssv; // Key = MSSV only

    const entry = {
      identityKey,
      mssv,
      rawMSSV,
      hoten: row[identityMapping.hoten?.a] ?? '',
      lop,
      scores: extractScores(row, scoreMappings, 'a'),
      _rawRow: row,
    };

    if (mapA.has(identityKey)) {
      duplicatesA.push({ identityKey, mssv, lop, file: 'A', entries: [mapA.get(identityKey), entry] });
    } else {
      mapA.set(identityKey, entry);
    }
  }

  // ===== STEP 2: Build mapB from File B (keyed by MSSV) =====
  const mapB = new Map();
  const duplicatesB = [];

  for (const row of rowsB) {
    const rawMSSV = row[identityMapping.mssv.b] ?? '';
    const lop = row[identityMapping.lop?.b] ?? '';
    const mssv = normalizeMSSV(rawMSSV);

    if (!mssv) continue;

    const identityKey = mssv; // Key = MSSV only

    const entry = {
      identityKey,
      mssv,
      rawMSSV,
      hoten: row[identityMapping.hoten?.b] ?? '',
      lop,
      scores: extractScores(row, scoreMappings, 'b'),
      _rawRow: row,
    };

    if (mapB.has(identityKey)) {
      duplicatesB.push({ identityKey, mssv, lop, file: 'B', entries: [mapB.get(identityKey), entry] });
    } else {
      mapB.set(identityKey, entry);
    }
  }

  // ===== STEP 3: Match & Compare - O(n + m) =====
  const differentScores = [];
  const identityWarnings = [];
  const missingStu = [];
  const extraStu = [];

  // Process all students in A
  for (const [identityKey, entA] of mapA) {
    if (!mapB.has(identityKey)) {
      missingStu.push({
        identityKey,
        mssv: entA.mssv,
        hoten: entA.hoten,
        lop: entA.lop,
      });
      continue;
    }

    const entB = mapB.get(identityKey);
    const warnings = [];

    // Check name
    const normNameA = normalizeHoTen(entA.hoten, nameOptions);
    const normNameB = normalizeHoTen(entB.hoten, nameOptions);
    if (normNameA && normNameB && normNameA !== normNameB) {
      warnings.push({
        type: 'NAME_MISMATCH',
        detail: `File A: "${entA.hoten}" | File B: "${entB.hoten}"`,
      });
    }

    // Check class
    const normLopA = normalizeLop(entA.lop);
    const normLopB = normalizeLop(entB.lop);
    if (normLopA && normLopB && normLopA !== normLopB) {
      warnings.push({
        type: 'CLASS_MISMATCH',
        detail: `File A: "${entA.lop}" | File B: "${entB.lop}"`,
      });
    }

    if (warnings.length > 0) {
      identityWarnings.push({
        identityKey,
        mssv: entA.mssv,
        hotenA: entA.hoten,
        hotenB: entB.hoten,
        lopA: entA.lop,
        lopB: entB.lop,
        warnings,
      });
    }

    // Compare scores for each mapped column
    for (const mapping of scoreMappings) {
      if (mapping.colIndexA === null && mapping.colIndexB === null) continue;

      const scoreA = normalizeDiem(entA.scores[mapping.colIndexA]);
      const scoreB = normalizeDiem(entB.scores[mapping.colIndexB]);
      const result = compareScores(scoreA, scoreB, tolerance);

      if (!result.same) {
        differentScores.push({
          identityKey,
          mssv: entA.mssv,
          hotenA: entA.hoten,
          hotenB: entB.hoten,
          lopA: entA.lop,
          lopB: entB.lop,
          columnLabel: mapping.labelA || mapping.labelB || `Cột ${mapping.colIndexA}`,
          colIndexA: mapping.colIndexA,
          colIndexB: mapping.colIndexB,
          scoreA: entA.scores[mapping.colIndexA] ?? '',
          scoreB: entB.scores[mapping.colIndexB] ?? '',
          reason: result.reason,
          hasIdentityWarning: warnings.length > 0,
        });
      }
    }
  }

  // Find extra students in B (not in A)
  for (const [identityKey, entB] of mapB) {
    if (!mapA.has(identityKey)) {
      extraStu.push({
        identityKey,
        mssv: entB.mssv,
        hoten: entB.hoten,
        lop: entB.lop,
      });
    }
  }

  // ===== STEP 4: Summary =====
  const matchedCount = [...mapA.keys()].filter((k) => mapB.has(k)).length;

  return {
    summary: {
      totalRowsA: rowsA.length,
      totalRowsB: rowsB.length,
      totalStudentsA: mapA.size,
      totalStudentsB: mapB.size,
      matchedStudents: matchedCount,
      differentScores: differentScores.length,
      identityWarnings: identityWarnings.length,
      missingStudents: missingStu.length,
      extraStudents: extraStu.length,
      duplicatedIdsA: duplicatesA.length,
      duplicatedIdsB: duplicatesB.length,
      duplicatedKeysA: duplicatesA.length,
      duplicatedKeysB: duplicatesB.length,
    },
    differentScores,
    identityWarnings,
    missingStudents: missingStu,
    extraStudents: extraStu,
    duplicatesA,
    duplicatesB,
    // Keep maps for highlight sheet generation
    _mapA: mapA,
    _mapB: mapB,
  };
}

/**
 * Extract score values from a row for all mapped columns
 */
function extractScores(row, scoreMappings, side) {
  const scores = {};
  for (const mapping of scoreMappings) {
    const colIndex = side === 'a' ? mapping.colIndexA : mapping.colIndexB;
    if (colIndex !== null && colIndex !== undefined) {
      scores[colIndex] = row[colIndex] ?? '';
    }
  }
  return scores;
}

module.exports = { compareGrades };
