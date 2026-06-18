/**
 * Job Store
 * Keeps uploaded file buffers in memory only, and persists job metadata to PostgreSQL.
 */
const { initDatabase, query } = require('../config/database');

const jobs = new Map();
const uploads = new Map();

function toJob(row) {
  return {
    id: row.id,
    uploadId: row.upload_id,
    status: row.status,
    progress: row.progress,
    progressMessage: row.progress_message,
    result: row.result_json,
    resultBuffer: null,
    resultFileName: null,
    error: row.error,
    fileAName: row.file_a_name,
    fileBName: row.file_b_name,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function normalizeJob(job) {
  return {
    ...job,
    progress: job.progress ?? 0,
    progressMessage: job.progressMessage || '',
    result: job.result ?? null,
    error: job.error ?? null,
    createdAt: job.createdAt || new Date(),
    completedAt: job.completedAt || null,
  };
}

function logFallback(operation, err) {
  console.error(`[JobStore] PostgreSQL ${operation} failed, using memory fallback:`, err.message);
}

function getUploadRetentionMs() {
  const hours = parseFloat(process.env.UPLOAD_RETENTION_HOURS || '2');
  const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 2;
  return safeHours * 60 * 60 * 1000;
}

function cleanupExpiredUploads() {
  const cutoff = Date.now() - getUploadRetentionMs();
  for (const [id, upload] of uploads.entries()) {
    if (new Date(upload.createdAt).getTime() < cutoff) {
      uploads.delete(id);
    }
  }
}

async function persistJob(job) {
  if (!(await initDatabase())) return;

  const normalized = normalizeJob(job);
  await query(
    `
      INSERT INTO comparison_jobs (
        id, upload_id, status, progress, progress_message, result_json, error,
        file_a_name, file_b_name, created_at, completed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        progress = EXCLUDED.progress,
        progress_message = EXCLUDED.progress_message,
        result_json = EXCLUDED.result_json,
        error = EXCLUDED.error,
        file_a_name = EXCLUDED.file_a_name,
        file_b_name = EXCLUDED.file_b_name,
        completed_at = EXCLUDED.completed_at
    `,
    [
      normalized.id,
      normalized.uploadId || null,
      normalized.status,
      normalized.progress,
      normalized.progressMessage,
      JSON.stringify(normalized.result),
      normalized.error,
      normalized.fileAName || null,
      normalized.fileBName || null,
      normalized.createdAt,
      normalized.completedAt,
    ]
  );
}

class JobStore {
  static createUpload(data) {
    cleanupExpiredUploads();
    const id = data.uploadId;
    uploads.set(id, { ...data, createdAt: new Date() });
    return uploads.get(id);
  }

  static getUpload(uploadId) {
    cleanupExpiredUploads();
    return uploads.get(uploadId) || null;
  }

  static deleteUpload(uploadId) {
    return uploads.delete(uploadId);
  }

  static async createJob(jobId, uploadId, metadata = {}) {
    const job = {
      id: jobId,
      uploadId,
      status: 'pending',
      progress: 0,
      progressMessage: 'Dang khoi tao...',
      result: null,
      resultBuffer: null,
      resultFileName: null,
      error: null,
      fileAName: metadata.fileAName || null,
      fileBName: metadata.fileBName || null,
      createdAt: new Date(),
      completedAt: null,
    };
    jobs.set(jobId, job);

    try {
      await persistJob(job);
    } catch (err) {
      logFallback('createJob', err);
    }

    return job;
  }

  static async getJob(jobId) {
    const memoryJob = jobs.get(jobId);
    if (memoryJob) return memoryJob;

    if (await initDatabase()) {
      try {
        const result = await query('SELECT * FROM comparison_jobs WHERE id = $1', [jobId]);
        if (result.rows[0]) {
          const job = toJob(result.rows[0]);
          jobs.set(job.id, job);
          return job;
        }
      } catch (err) {
        logFallback('getJob', err);
      }
    }

    return null;
  }

  static async updateJob(jobId, updates) {
    let job = jobs.get(jobId);
    if (!job) {
      job = await this.getJob(jobId);
    }
    if (!job) return null;

    Object.assign(job, updates);
    jobs.set(jobId, job);

    try {
      await persistJob(job);
    } catch (err) {
      logFallback('updateJob', err);
    }

    return job;
  }

  static async listJobs() {
    if (await initDatabase()) {
      try {
        const result = await query('SELECT * FROM comparison_jobs ORDER BY created_at DESC');
        const seen = new Set();
        const dbJobs = result.rows.map((row) => {
          const job = toJob(row);
          const memoryJob = jobs.get(job.id);
          seen.add(job.id);
          return memoryJob ? { ...job, ...memoryJob } : job;
        });

        const memoryOnlyJobs = [...jobs.values()].filter((job) => !seen.has(job.id));
        return [...dbJobs, ...memoryOnlyJobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } catch (err) {
        logFallback('listJobs', err);
      }
    }

    return [...jobs.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

module.exports = { JobStore };
