/**
 * Comparison Controller
 * Handles all API endpoints for the grade comparison workflow
 */
const { v4: uuidv4 } = require('uuid');

const { getSheetNames, readRawRows, readDataFromSheet } = require('../services/excel/excelReader');
const { detectHeaderRow } = require('../services/analyzer/headerDetector');
const { analyzeAllColumns, suggestMapping } = require('../services/analyzer/columnAnalyzer');
const { compareGrades } = require('../services/comparator/gradeComparator');
const { generateResultExcel } = require('../services/excel/excelWriter');
const { JobStore } = require('../utils/jobStore');
const { TemplateStore } = require('../utils/templateStore');
const { createError } = require('../middlewares/error.middleware');

/**
 * POST /api/comparisons/upload
 * Upload 2 Excel files
 */
async function uploadFiles(req, res) {
  if (!req.files || !req.files.fileA || !req.files.fileB) {
    throw createError('Vui lòng upload đủ 2 file Excel (fileA và fileB)', 'VALIDATION_ERROR');
  }

  const fileA = req.files.fileA[0];
  const fileB = req.files.fileB[0];
  const uploadId = uuidv4();

  // Validate files can be opened
  let sheetsA, sheetsB;
  try {
    sheetsA = getSheetNames(fileA.buffer);
  } catch (e) {
    throw createError(`File A không đọc được: ${e.message}`, 'FILE_ERROR');
  }
  try {
    sheetsB = getSheetNames(fileB.buffer);
  } catch (e) {
    throw createError(`File B không đọc được: ${e.message}`, 'FILE_ERROR');
  }

  JobStore.createUpload({
    uploadId,
    fileABuffer: fileA.buffer,
    fileBBuffer: fileB.buffer,
    fileAName: fileA.originalname,
    fileBName: fileB.originalname,
    fileASize: fileA.size,
    fileBSize: fileB.size,
    sheetsA,
    sheetsB,
  });

  res.json({
    success: true,
    uploadId,
    fileAInfo: { name: fileA.originalname, size: fileA.size, sheets: sheetsA },
    fileBInfo: { name: fileB.originalname, size: fileB.size, sheets: sheetsB },
  });
}

/**
 * POST /api/comparisons/:uploadId/analyze
 * Analyze headers and suggest column mappings
 */
async function analyzeFiles(req, res) {
  const { uploadId } = req.params;
  const { sheetA, sheetB } = req.body;

  const upload = JobStore.getUpload(uploadId);
  if (!upload) throw createError('Upload session không tồn tại', 'NOT_FOUND');
  if (!sheetA || !sheetB) throw createError('Vui lòng chọn sheet cho cả 2 file', 'VALIDATION_ERROR');

  // Read raw rows for header detection
  const rawA = readRawRows(upload.fileABuffer, sheetA, 60);
  const rawB = readRawRows(upload.fileBBuffer, sheetB, 60);

  // Detect header rows
  const headerDetA = detectHeaderRow(rawA.rawRows);
  const headerDetB = detectHeaderRow(rawB.rawRows);

  // Read data with detected headers
  const dataA = readDataFromSheet(upload.fileABuffer, sheetA, headerDetA.headerRowIndex);
  const dataB = readDataFromSheet(upload.fileBBuffer, sheetB, headerDetB.headerRowIndex);

  // Analyze columns
  const colsA = analyzeAllColumns(dataA.headers, dataA.rows, dataA.maxCols);
  const colsB = analyzeAllColumns(dataB.headers, dataB.rows, dataB.maxCols);

  // Suggest mapping
  const suggestion = suggestMapping(colsA, colsB);

  // Check for matching template
  const matchedTemplate = await TemplateStore.findMatching(dataA.headers, dataB.headers);

  const previewA = dataA.rows.slice(0, 8).map((row) =>
    dataA.headers.map((_, i) => row[i] ?? '')
  );
  const previewB = dataB.rows.slice(0, 8).map((row) =>
    dataB.headers.map((_, i) => row[i] ?? '')
  );

  // Store analysis in upload session for run step
  upload.sheetA = sheetA;
  upload.sheetB = sheetB;
  upload.headerRowA = headerDetA.headerRowIndex;
  upload.headerRowB = headerDetB.headerRowIndex;
  upload.headersA = dataA.headers;
  upload.headersB = dataB.headers;
  upload.totalRowsA = dataA.totalDataRows;
  upload.totalRowsB = dataB.totalDataRows;

  res.json({
    success: true,
    fileA: {
      sheet: sheetA,
      detectedHeaderRow: headerDetA.headerRowIndex,
      headerConfidence: headerDetA.confidence,
      headers: dataA.headers,
      totalDataRows: dataA.totalDataRows,
      columns: colsA,
      preview: previewA,
    },
    fileB: {
      sheet: sheetB,
      detectedHeaderRow: headerDetB.headerRowIndex,
      headerConfidence: headerDetB.confidence,
      headers: dataB.headers,
      totalDataRows: dataB.totalDataRows,
      columns: colsB,
      preview: previewB,
    },
    suggestedMapping: suggestion,
    matchedTemplate: matchedTemplate
      ? { id: matchedTemplate.template.id, name: matchedTemplate.template.templateName, similarity: matchedTemplate.similarity }
      : null,
  });
}

/**
 * POST /api/comparisons/:uploadId/run
 * Create and run comparison job
 */
async function runComparison(req, res) {
  const { uploadId } = req.params;
  const { sheetA, sheetB, headerRowA, headerRowB, identityMapping, scoreMappings, compareRules, saveTemplate, templateName } = req.body;

  const upload = JobStore.getUpload(uploadId);
  if (!upload) throw createError('Upload session không tồn tại', 'NOT_FOUND');

  const isMissingCol = (value) => value === undefined || value === null;

  // Validate identity mapping
  if (isMissingCol(identityMapping?.mssv?.a)) {
    throw createError('Cần chọn cột MSSV cho File A', 'VALIDATION_ERROR');
  }
  if (isMissingCol(identityMapping?.mssv?.b)) {
    throw createError('Cần chọn cột MSSV cho File B', 'VALIDATION_ERROR');
  }
  // Lớp là tuỳ chọn: dùng để cảnh báo CLASS_MISMATCH, không dùng làm key ghép
  if (!scoreMappings || scoreMappings.length === 0) {
    throw createError('Cần chọn ít nhất một cặp cột điểm để so sánh', 'VALIDATION_ERROR');
  }

  const jobId = uuidv4();
  await JobStore.createJob(jobId, uploadId, {
    fileAName: upload.fileAName,
    fileBName: upload.fileBName,
  });

  // Run async background processing using uploaded files
  setImmediate(async () => {
    try {
      await JobStore.updateJob(jobId, { status: 'processing', progress: 5, progressMessage: 'Đang đọc File A...' });

      const hRowA = headerRowA ?? upload.headerRowA ?? 0;
      const hRowB = headerRowB ?? upload.headerRowB ?? 0;
      const usedSheetA = sheetA || upload.sheetA;
      const usedSheetB = sheetB || upload.sheetB;

      const dataA = readDataFromSheet(upload.fileABuffer, usedSheetA, hRowA);
      await JobStore.updateJob(jobId, { progress: 20, progressMessage: 'Đang đọc File B...' });

      const dataB = readDataFromSheet(upload.fileBBuffer, usedSheetB, hRowB);
      await JobStore.updateJob(jobId, { progress: 35, progressMessage: 'Đang chuẩn hóa và ghép sinh viên...' });

      const result = compareGrades(dataA.rows, dataB.rows, identityMapping, scoreMappings, compareRules || {});
      await JobStore.updateJob(jobId, { progress: 70, progressMessage: 'Đang tạo file Excel kết quả...' });

      const resultFileName = `result_${jobId}.xlsx`;
      const resultBuffer = await generateResultExcel(result, dataA.headers, dataB.headers, dataA.rows, dataB.rows, identityMapping, scoreMappings);

      if (saveTemplate && templateName) {
        const tmplId = uuidv4();
        await TemplateStore.save({
          id: tmplId,
          templateName,
          mappingJson: {
            headersA: dataA.headers,
            headersB: dataB.headers,
            identityMapping,
            scoreMappings,
          },
          rulesJson: compareRules || {},
          createdAt: new Date(),
        });
      }

      await JobStore.updateJob(jobId, {
        status: 'done',
        progress: 100,
        progressMessage: 'Hoàn thành!',
        result: result.summary,
        resultBuffer: Buffer.from(resultBuffer),
        resultFileName,
        completedAt: new Date(),
      });
    } catch (err) {
      console.error(`[JOB ${jobId}] Error:`, err);
      await JobStore.updateJob(jobId, {
        status: 'failed',
        progressMessage: `Lỗi: ${err.message}`,
        error: err.message,
        completedAt: new Date(),
      });
    }
  });

  res.json({ success: true, jobId });
}

/**
 * GET /api/comparisons/:uploadId/sheets
 */
async function getSheets(req, res) {
  const { uploadId } = req.params;
  const upload = JobStore.getUpload(uploadId);
  if (!upload) throw createError('Upload session không tồn tại', 'NOT_FOUND');

  res.json({
    success: true,
    uploadId,
    fileAInfo: {
      name: upload.fileAName,
      size: upload.fileASize,
      sheets: upload.sheetsA,
    },
    fileBInfo: {
      name: upload.fileBName,
      size: upload.fileBSize,
      sheets: upload.sheetsB,
    },
  });
}

/**
 * GET /api/comparisons/jobs/:jobId/status
 */
async function getJobStatus(req, res) {
  const { jobId } = req.params;
  const job = await JobStore.getJob(jobId);
  if (!job) throw createError('Job không tồn tại', 'NOT_FOUND');

  res.json({
    success: true,
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    message: job.progressMessage,
    result: job.result,
    error: job.error,
    completedAt: job.completedAt,
  });
}

/**
 * GET /api/comparisons/jobs/:jobId/download
 */
async function downloadResult(req, res) {
  const { jobId } = req.params;
  const job = await JobStore.getJob(jobId);

  if (!job) throw createError('Job không tồn tại', 'NOT_FOUND');
  if (job.status !== 'done') throw createError('File kết quả chưa sẵn sàng', 'VALIDATION_ERROR');
  if (!job.resultBuffer) {
    throw createError('File kết quả chỉ được giữ tạm thời trong bộ nhớ. Vui lòng chạy so sánh lại để tải file mới.', 'NOT_FOUND');
  }

  const fileName = `KetQua_SoSanh_${new Date().toISOString().split('T')[0]}.xlsx`;
  const resultBuffer = Buffer.isBuffer(job.resultBuffer) ? job.resultBuffer : Buffer.from(job.resultBuffer);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', resultBuffer.length);
  res.end(resultBuffer);
}

/**
 * GET /api/comparisons/history
 */
async function getHistory(req, res) {
  const jobs = await JobStore.listJobs();
  res.json({ success: true, jobs: jobs.map((j) => ({
    id: j.id,
    status: j.status,
    progress: j.progress,
    result: j.result,
    error: j.error,
    createdAt: j.createdAt,
    completedAt: j.completedAt,
    downloadAvailable: Boolean(j.resultBuffer),
  })) });
}

module.exports = { uploadFiles, getSheets, analyzeFiles, runComparison, getJobStatus, downloadResult, getHistory };
