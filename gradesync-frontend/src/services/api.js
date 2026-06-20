/**
 * API Service - All calls to the GradeSync backend
 *
 * Khi chạy Vite dev server (localhost:5173):
 *   → Gọi /api/... để Vite proxy chuyển tiếp đến localhost:5000
 *   → KHÔNG dùng http://localhost:5000 trực tiếp (bị CORS block trong browser)
 *
 * Khi build production / Electron:
 *   → VITE_API_URL có thể set trong .env để override
 */
import axios from 'axios';

// Khi có VITE_API_URL (deploy production) → dùng đó
// Khi dev với Vite proxy → dùng relative '/api' để đi qua proxy
// Khi chạy trong Electron (file://) → fallback http://localhost:5000/api
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // Electron: window.location.protocol === 'file:' hoặc app:
  if (typeof window !== 'undefined' && window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
    return 'http://localhost:5000/api';
  }
  // Dev / Production web: dùng relative URL, Vite proxy sẽ forward
  return '/api';
};

const API_URL = getApiUrl();

const API = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 phút cho file lớn
});

// Request interceptor
API.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor - unwrap success responses và format lỗi
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Lỗi kết nối server';
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      message = 'Không thể kết nối đến server. Vui lòng kiểm tra backend đang chạy.';
    } else if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.message) {
      message = error.message;
    }
    const enriched = new Error(message);
    enriched.statusCode = error.response?.status;
    enriched.details = error.response?.data?.details;
    return Promise.reject(enriched);
  }
);

// ── Download URL helper ───────────────────────────────────────────────────────
// Trả về URL đầy đủ để tải file (dùng trong window.open)
const getDownloadBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
    return 'http://localhost:5000/api';
  }
  // Web: dùng origin hiện tại + /api (đi qua Vite proxy hoặc server trực tiếp)
  return `${window.location.origin}/api`;
};

// ── Comparison APIs ───────────────────────────────────────────────────────────

export const uploadFiles = (fileA, fileB, onProgress) => {
  const formData = new FormData();
  formData.append('fileA', fileA);
  formData.append('fileB', fileB);
  return API.post('/comparisons/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });
};

export const getSheets = (uploadId) =>
  API.get(`/comparisons/${uploadId}/sheets`);

export const analyzeFiles = (uploadId, sheetA, sheetB) =>
  API.post(`/comparisons/${uploadId}/analyze`, { sheetA, sheetB });

export const runComparison = (uploadId, payload) =>
  API.post(`/comparisons/${uploadId}/run`, payload, {
    timeout: 180000,
  });

export const getJobStatus = (jobId) =>
  API.get(`/comparisons/jobs/${jobId}/status`);

export const downloadResult = (jobId) =>
  `${getDownloadBase()}/comparisons/jobs/${jobId}/download`;

export const getHistory = () => API.get('/comparisons/history');

// ── Template APIs ─────────────────────────────────────────────────────────────

export const getTemplates = () => API.get('/templates');

export const createTemplate = (data) => API.post('/templates', data);

export const deleteTemplate = (id) => API.delete(`/templates/${id}`);

export default API;
