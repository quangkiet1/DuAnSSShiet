/**
 * Excel Result Writer
 * Generates the output Excel file with 8 sheets:
 * 1. TONG_QUAN       - Summary statistics
 * 2. KHAC_DIEM       - Different scores detail
 * 3. SAI_THONG_TIN_SV - Identity warnings (same MSSV, diff name/class)
 * 4. THIEU_SINH_VIEN - Missing students (in A, not in B)
 * 5. DU_SINH_VIEN    - Extra students (in B, not in A)
 * 6. TRUNG_MSSV      - Duplicate IDs
 * 7. FILE_A_HIGHLIGHT - File A data with colored cells
 * 8. FILE_B_HIGHLIGHT - File B data with colored cells
 *
 * Uses ExcelJS for full styling support.
 * Output: .xlsx buffer by default, or writes to a path when outputPath is set.
 *
 * Highlight colors in FILE_A/FILE_B sheets:
 *   🔴 Red fill + thick red border = score cell with different value
 *   🟡 Yellow fill = name or class mismatch (same MSSV)
 *   🟠 Orange fill = student missing in File B (shown in File A)
 *   🔵 Blue fill   = extra student in File B (shown in File B)
 *   🟣 Purple fill = duplicate MSSV within a file
 */
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { normalizeMSSV } = require('../normalizer/dataNormalizer');

// ===== COLOR PALETTE =====
const COLORS = {
  RED_FILL:     'FFFFCCCC',  // Diff score cell fill
  RED_BORDER:   'FFFF0000',  // Diff score border
  WARN_BG:      'FFFFF3CD',  // Identity warning (name/class)
  WARN_TEXT:    'FF92400E',
  ORANGE_FILL:  'FFFFD7AA',  // Missing student
  ORANGE_TEXT:  'FFCC4400',
  BLUE_FILL:    'FFD6E4F7',  // Extra student
  BLUE_TEXT:    'FF1F4E79',
  PURPLE_FILL:  'FFE6D7F7',  // Duplicate MSSV
  PURPLE_TEXT:  'FF7030A0',
  HEADER_BG:    'FF1F4E79',  // Header row background
  HEADER_FONT:  'FFFFFFFF',
  ALT_ROW:      'FFF5F5F5',
};

// ===== HELPERS =====

function styleHeader(worksheet, rowNum, colCount) {
  const row = worksheet.getRow(rowNum);
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.HEADER_BG } };
    cell.font   = { color: { argb: COLORS.HEADER_FONT }, bold: true, size: 11 };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  }
  row.height = 30;
}

function styleDataRow(worksheet, rowNum, colCount, isAlt = false) {
  const row = worksheet.getRow(rowNum);
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    if (isAlt) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ALT_ROW } };
    }
    cell.border = {
      top: { style: 'hair' }, left: { style: 'hair' },
      bottom: { style: 'hair' }, right: { style: 'hair' },
    };
  }
}

function addTitle(worksheet, title, colCount) {
  const titleRow = worksheet.addRow([title]);
  titleRow.height = 40;
  const cell = titleRow.getCell(1);
  cell.font = { size: 14, bold: true, color: { argb: COLORS.HEADER_BG } };
  if (colCount > 1) {
    worksheet.mergeCells(titleRow.number, 1, titleRow.number, colCount);
  }
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.addRow([]); // blank spacing row
}

// ===== MAIN EXPORT =====

async function generateResultExcel(
  comparisonResult,
  headersA, headersB,
  rowsA, rowsB,
  identityMapping, scoreMappings,
  outputPath
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator  = 'GradeSync';
  workbook.created  = new Date();
  workbook.modified = new Date();

  const {
    summary, differentScores, identityWarnings,
    missingStudents, extraStudents, duplicatesA, duplicatesB,
  } = comparisonResult;

  await buildTongQuan(workbook, summary);
  await buildKhacDiem(workbook, differentScores);
  await buildSaiThongTin(workbook, identityWarnings);
  await buildThieuSinhVien(workbook, missingStudents);
  await buildDuSinhVien(workbook, extraStudents);
  await buildTrungMSSV(workbook, duplicatesA, duplicatesB);
  await buildHighlight(workbook, 'FILE_A_HIGHLIGHT', 'File A', headersA, rowsA, identityMapping, scoreMappings, 'a', comparisonResult);
  await buildHighlight(workbook, 'FILE_B_HIGHLIGHT', 'File B', headersB, rowsB, identityMapping, scoreMappings, 'b', comparisonResult);

  if (outputPath) {
    await workbook.xlsx.writeFile(outputPath);
    return outputPath;
  }

  return workbook.xlsx.writeBuffer();
}

// ===== SHEET BUILDERS =====

async function buildTongQuan(workbook, summary) {
  const ws = workbook.addWorksheet('TONG_QUAN', { tabColor: { argb: 'FF1F4E79' } });
  ws.columns = [
    { key: 'metric', width: 45 },
    { key: 'value',  width: 20 },
  ];

  addTitle(ws, '📊 TỔNG QUAN KẾT QUẢ SO SÁNH BẢNG ĐIỂM', 2);

  const sections = [
    { label: '📁 Thông tin File', isSection: true },
    { label: 'Tổng số dòng dữ liệu File A',              value: summary.totalRowsA },
    { label: 'Tổng số dòng dữ liệu File B',              value: summary.totalRowsB },
    { label: 'Số sinh viên File A (sau lọc MSSV)',        value: summary.totalStudentsA },
    { label: 'Số sinh viên File B (sau lọc MSSV)',        value: summary.totalStudentsB },
    { label: '', value: '' },
    { label: '📊 Kết quả so sánh', isSection: true },
    { label: 'Số sinh viên ghép thành công',              value: summary.matchedStudents,    color: null },
    { label: 'Số dòng KHÁC ĐIỂM',                        value: summary.differentScores,    color: summary.differentScores   > 0 ? 'FFFF0000' : 'FF00AA00' },
    { label: 'Số sinh viên SAI THÔNG TIN (tên/lớp lệch)',value: summary.identityWarnings,   color: summary.identityWarnings   > 0 ? 'FFD97706' : null },
    { label: 'Số sinh viên THIẾU trong File B',           value: summary.missingStudents,    color: summary.missingStudents    > 0 ? 'FFFF8C00' : null },
    { label: 'Số sinh viên DƯ trong File B',              value: summary.extraStudents,      color: summary.extraStudents      > 0 ? 'FF1F4E79' : null },
    { label: '', value: '' },
    { label: '⚠️ Cảnh báo dữ liệu', isSection: true },
    { label: 'Số cặp Lớp + MSSV TRÙNG trong File A',      value: summary.duplicatedIdsA,     color: summary.duplicatedIdsA     > 0 ? 'FF7030A0' : null },
    { label: 'Số cặp Lớp + MSSV TRÙNG trong File B',      value: summary.duplicatedIdsB,     color: summary.duplicatedIdsB     > 0 ? 'FF7030A0' : null },
  ];

  sections.forEach((sec, i) => {
    const row = ws.addRow([sec.label, sec.value ?? '']);
    if (sec.isSection) {
      row.getCell(1).font = { bold: true, size: 12, color: { argb: COLORS.HEADER_BG } };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F7' } };
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F7' } };
    } else if (sec.label) {
      row.getCell(2).font = { bold: true, color: { argb: sec.color || 'FF000000' } };
    }
    styleDataRow(ws, row.number, 2, i % 2 === 0);
  });

  ws.getColumn(1).alignment = { horizontal: 'left',   vertical: 'middle' };
  ws.getColumn(2).alignment = { horizontal: 'center', vertical: 'middle' };
}

async function buildKhacDiem(workbook, differentScores) {
  const ws = workbook.addWorksheet('KHAC_DIEM', { tabColor: { argb: 'FFFF0000' } });
  const headers = [
    'MSSV', 'Họ tên (File A)', 'Họ tên (File B)',
    'Lớp (File A)', 'Lớp (File B)',
    'Cột điểm', 'Điểm File A', 'Điểm File B', 'Chênh lệch', 'Ghi chú',
  ];
  ws.columns = headers.map((h, i) => ({
    key: `col${i}`,
    width: [15, 25, 25, 12, 12, 22, 12, 12, 12, 35][i] || 15,
  }));

  addTitle(ws, '🔴 DANH SÁCH ĐIỂM KHÁC NHAU GIỮA 2 FILE', headers.length);
  styleHeader(ws, ws.addRow(headers).number, headers.length);

  if (differentScores.length === 0) {
    const r = ws.addRow(['✅ Không có điểm khác nhau — hai file hoàn toàn khớp!']);
    r.getCell(1).font = { color: { argb: 'FF00AA00' }, bold: true, size: 12 };
    return;
  }

  differentScores.forEach((d, i) => {
    const scoreA = parseFloat(String(d.scoreA).replace(',', '.'));
    const scoreB = parseFloat(String(d.scoreB).replace(',', '.'));
    const diff   = (!isNaN(scoreA) && !isNaN(scoreB)) ? (scoreA - scoreB).toFixed(4) : 'N/A';

    const row = ws.addRow([
      d.mssv, d.hotenA, d.hotenB, d.lopA, d.lopB,
      d.columnLabel, d.scoreA, d.scoreB, diff,
      d.hasIdentityWarning ? '⚠️ Có cảnh báo thông tin SV' : '',
    ]);
    styleDataRow(ws, row.number, headers.length, i % 2 === 0);

    // Highlight the score cells (col 7 = File A score, col 8 = File B score)
    [7, 8].forEach((c) => {
      row.getCell(c).fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.RED_FILL } };
      row.getCell(c).font   = { bold: true, color: { argb: 'FFCC0000' } };
      row.getCell(c).border = {
        top: { style: 'medium', color: { argb: COLORS.RED_BORDER } },
        left: { style: 'medium', color: { argb: COLORS.RED_BORDER } },
        bottom: { style: 'medium', color: { argb: COLORS.RED_BORDER } },
        right: { style: 'medium', color: { argb: COLORS.RED_BORDER } },
      };
    });

    // Color the diff column
    const diffCell = row.getCell(9);
    if (diff !== 'N/A') {
      diffCell.font = { bold: true, color: { argb: parseFloat(diff) > 0 ? 'FF1F4E79' : 'FFCC0000' } };
    }
  });

  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];
}

async function buildSaiThongTin(workbook, identityWarnings) {
  const ws = workbook.addWorksheet('SAI_THONG_TIN_SV', { tabColor: { argb: 'FFFFFF00' } });
  const headers = ['MSSV', 'Họ tên File A', 'Họ tên File B', 'Lớp File A', 'Lớp File B', 'Loại lỗi', 'Chi tiết'];
  ws.columns = headers.map((h, i) => ({ key: `col${i}`, width: [15, 28, 28, 14, 14, 20, 45][i] || 15 }));

  addTitle(ws, '⚠️ SINH VIÊN CÓ CÙNG MSSV NHƯNG KHÁC TÊN HOẶC LỚP', headers.length);
  styleHeader(ws, ws.addRow(headers).number, headers.length);

  if (identityWarnings.length === 0) {
    ws.addRow(['✅ Không có sai thông tin sinh viên']);
    return;
  }

  identityWarnings.forEach((w, i) => {
    const types   = w.warnings.map((warn) => warn.type === 'NAME_MISMATCH' ? 'Khác tên' : 'Khác lớp').join(', ');
    const details = w.warnings.map((warn) => warn.detail).join(' | ');
    const row     = ws.addRow([w.mssv, w.hotenA, w.hotenB, w.lopA, w.lopB, types, details]);
    styleDataRow(ws, row.number, headers.length, i % 2 === 0);
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.WARN_BG } };
    });
    row.getCell(6).font = { bold: true, color: { argb: COLORS.WARN_TEXT } };
  });
}

async function buildThieuSinhVien(workbook, missingStudents) {
  const ws = workbook.addWorksheet('THIEU_SINH_VIEN', { tabColor: { argb: 'FFFF8C00' } });
  const headers = ['MSSV', 'Họ tên', 'Lớp', 'Ghi chú'];
  ws.columns = headers.map((h, i) => ({ key: `col${i}`, width: [15, 32, 15, 45][i] || 15 }));

  addTitle(ws, '🟠 SINH VIÊN CÓ TRONG FILE A NHƯNG KHÔNG CÓ TRONG FILE B', headers.length);
  styleHeader(ws, ws.addRow(headers).number, headers.length);

  if (missingStudents.length === 0) {
    ws.addRow(['✅ Không có sinh viên thiếu']);
    return;
  }

  missingStudents.forEach((s, i) => {
    const row = ws.addRow([s.mssv, s.hoten, s.lop, 'Có trong File A — thiếu trong File B']);
    styleDataRow(ws, row.number, headers.length, i % 2 === 0);
    row.getCell(1).font = { bold: true, color: { argb: COLORS.ORANGE_TEXT } };
    row.getCell(4).font = { color: { argb: COLORS.ORANGE_TEXT }, bold: true };
  });
}

async function buildDuSinhVien(workbook, extraStudents) {
  const ws = workbook.addWorksheet('DU_SINH_VIEN', { tabColor: { argb: 'FF4472C4' } });
  const headers = ['MSSV', 'Họ tên', 'Lớp', 'Ghi chú'];
  ws.columns = headers.map((h, i) => ({ key: `col${i}`, width: [15, 32, 15, 45][i] || 15 }));

  addTitle(ws, '🔵 SINH VIÊN CÓ TRONG FILE B NHƯNG KHÔNG CÓ TRONG FILE A', headers.length);
  styleHeader(ws, ws.addRow(headers).number, headers.length);

  if (extraStudents.length === 0) {
    ws.addRow(['✅ Không có sinh viên dư']);
    return;
  }

  extraStudents.forEach((s, i) => {
    const row = ws.addRow([s.mssv, s.hoten, s.lop, 'Có trong File B — không có trong File A']);
    styleDataRow(ws, row.number, headers.length, i % 2 === 0);
    row.getCell(1).font = { bold: true, color: { argb: COLORS.BLUE_TEXT } };
    row.getCell(4).font = { color: { argb: COLORS.BLUE_TEXT }, bold: true };
  });
}

async function buildTrungMSSV(workbook, duplicatesA, duplicatesB) {
  const ws = workbook.addWorksheet('TRUNG_MSSV', { tabColor: { argb: 'FF7030A0' } });
  const headers = ['MSSV', 'File', 'Họ tên', 'Lớp', 'Ghi chú'];
  ws.columns = headers.map((h, i) => ({ key: `col${i}`, width: [15, 8, 30, 15, 45][i] || 15 }));

  addTitle(ws, '🟣 CẶP LỚP + MSSV BỊ TRÙNG TRONG FILE — CẦN KIỂM TRA LẠI', headers.length);
  styleHeader(ws, ws.addRow(headers).number, headers.length);

  const allDups = [
    ...duplicatesA.map((d) => ({ ...d, file: 'A' })),
    ...duplicatesB.map((d) => ({ ...d, file: 'B' })),
  ];

  if (allDups.length === 0) {
    ws.addRow(['✅ Không có cặp Lớp + MSSV trùng']);
    return;
  }

  let rowNum = 0;
  for (const dup of allDups) {
    for (const entry of dup.entries) {
      const row = ws.addRow([dup.mssv, `File ${dup.file}`, entry.hoten, entry.lop, 'Cặp Lớp + MSSV trùng — cần kiểm tra lại']);
      styleDataRow(ws, row.number, headers.length, rowNum % 2 === 0);
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.PURPLE_FILL } };
      });
      row.getCell(1).font = { color: { argb: COLORS.PURPLE_TEXT }, bold: true };
      rowNum++;
    }
  }
}

// ===== HIGHLIGHT SHEET BUILDER =====
/**
 * Builds FILE_A_HIGHLIGHT or FILE_B_HIGHLIGHT sheet.
 * Copies original data and applies color-coding per cell/row.
 *
 * KEY FIX: diffMap is keyed by (mssv, colIndex) not by label string,
 * so it works correctly even when labels are null or abbreviated.
 */
async function buildHighlight(
  workbook, sheetName, fileLabel,
  headers, rows,
  identityMapping, scoreMappings,
  side,
  comparisonResult
) {
  const ws = workbook.addWorksheet(sheetName, {
    tabColor: { argb: side === 'a' ? 'FF1F4E79' : 'FF375623' },
  });

  const {
    differentScores, identityWarnings,
    missingStudents, extraStudents,
    duplicatesA, duplicatesB,
  } = comparisonResult;

  // ===== BUILD LOOKUP MAPS =====

  // diffMap: Map<identityKey, Set<colIndex>> — which score cols differ for each student
  // identityKey is now normalized MSSV (MSSV-first matching)
  const diffMap = new Map();
  for (const d of differentScores) {
    const key = d.identityKey || normalizeMSSV(d.mssv);
    const colIdx = side === 'a' ? d.colIndexA : d.colIndexB;
    if (!key) continue;
    if (colIdx === null || colIdx === undefined) continue;
    if (!diffMap.has(key)) diffMap.set(key, new Set());
    diffMap.get(key).add(colIdx);
  }

  const warnSet    = new Set(identityWarnings.map((w) => w.identityKey || normalizeMSSV(w.mssv)));
  const missingSet = new Set(missingStudents.map((s) => s.identityKey || normalizeMSSV(s.mssv)));
  const extraSet   = new Set(extraStudents.map((s) => s.identityKey || normalizeMSSV(s.mssv)));
  const dupSet     = new Set([
    ...duplicatesA.map((d) => d.identityKey || normalizeMSSV(d.mssv)),
    ...duplicatesB.map((d) => d.identityKey || normalizeMSSV(d.mssv)),
  ]);

  // Column indices for identity fields (on this side)
  const mssvColIdx  = side === 'a' ? identityMapping.mssv.a    : identityMapping.mssv.b;
  const hotenColIdx = side === 'a' ? identityMapping.hoten?.a  : identityMapping.hoten?.b;
  const lopColIdx   = side === 'a' ? identityMapping.lop?.a    : identityMapping.lop?.b;

  // ===== SHEET SETUP =====
  ws.columns = headers.map((h, i) => ({
    key: `col${i}`,
    width: Math.max(10, Math.min(35, String(h || '').length + 4)),
  }));

  addTitle(ws, `${fileLabel} — Dữ liệu gốc có đánh dấu kết quả so sánh`, headers.length);

  // Legend
  ws.addRow([
    '📌 Chú thích:',
    '🔴 Ô đỏ = điểm khác nhau',
    '🟡 Ô vàng = tên/lớp lệch (cùng MSSV)',
    '🟠 Dòng cam = SV thiếu trong File B',
    '🔵 Dòng xanh = SV dư trong File B',
    '🟣 Dòng tím = MSSV bị trùng',
  ]).eachCell((cell) => {
    cell.font = { italic: true, size: 9, color: { argb: 'FF475569' } };
  });
  ws.addRow([]);

  // Header row
  const headerRow = ws.addRow(headers);
  styleHeader(ws, headerRow.number, headers.length);

  // ===== DATA ROWS =====
  for (let i = 0; i < rows.length; i++) {
    const row    = rows[i];
    const values = headers.map((_, colIdx) => row[colIdx] ?? '');
    const excelRow = ws.addRow(values);
    styleDataRow(ws, excelRow.number, headers.length, i % 2 === 0);

    // Lookup key = normalized MSSV (matches gradeComparator key)
    const identityKey = normalizeMSSV(row[mssvColIdx] ?? '');
    if (!identityKey) continue;

    // === PRIORITY 1: Trùng MSSV → tô tím toàn dòng ===
    if (dupSet.has(identityKey)) {
      excelRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.PURPLE_FILL } };
        cell.font = { color: { argb: COLORS.PURPLE_TEXT }, bold: true };
      });
      continue;
    }

    // === PRIORITY 2: SV thiếu (chỉ File A) → tô cam toàn dòng ===
    if (side === 'a' && missingSet.has(identityKey)) {
      excelRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ORANGE_FILL } };
      });
      excelRow.getCell(mssvColIdx + 1).font = { bold: true, color: { argb: COLORS.ORANGE_TEXT } };
      continue;
    }

    // === PRIORITY 3: SV dư (chỉ File B) → tô xanh toàn dòng ===
    if (side === 'b' && extraSet.has(identityKey)) {
      excelRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.BLUE_FILL } };
      });
      excelRow.getCell(mssvColIdx + 1).font = { bold: true, color: { argb: COLORS.BLUE_TEXT } };
      continue;
    }

    // === PRIORITY 4: Tô từng ô điểm khác → đỏ + viền đỏ đậm ===
    const diffCols = diffMap.get(identityKey);
    if (diffCols && diffCols.size > 0) {
      for (const colIdx of diffCols) {
        const cell = excelRow.getCell(colIdx + 1); // ExcelJS is 1-based
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.RED_FILL } };
        cell.font = { bold: true, color: { argb: 'FFCC0000' } };
        // Thick red border — clearly marks the different cell
        cell.border = {
          top:    { style: 'medium', color: { argb: COLORS.RED_BORDER } },
          left:   { style: 'medium', color: { argb: COLORS.RED_BORDER } },
          bottom: { style: 'medium', color: { argb: COLORS.RED_BORDER } },
          right:  { style: 'medium', color: { argb: COLORS.RED_BORDER } },
        };
      }
    }

    // === PRIORITY 5: Sai thông tin (tên/lớp) → tô ô tên + lớp màu vàng ===
    if (warnSet.has(identityKey)) {
      if (hotenColIdx !== null && hotenColIdx !== undefined) {
        const cell = excelRow.getCell(hotenColIdx + 1);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.WARN_BG } };
        cell.font = { color: { argb: COLORS.WARN_TEXT }, bold: true };
      }
      if (lopColIdx !== null && lopColIdx !== undefined) {
        excelRow.getCell(lopColIdx + 1).fill = {
          type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.WARN_BG },
        };
      }
    }
  }

  // Freeze header row so it's always visible when scrolling
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: headerRow.number }];
}

module.exports = { generateResultExcel };
