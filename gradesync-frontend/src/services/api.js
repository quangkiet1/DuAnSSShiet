/**
 * API Service - All calls to the GradeSync backend
 */
import axios from 'axios';

// Dùng biến môi trường khi deploy, hoặc localhost khi chạy dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2min for large files
});

// Request interceptor
API.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor - unwrap success responses
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Lỗi kết nối server';
    const enriched = new Error(message);
    enriched.statusCode = error.response?.status;
    enriched.details = error.response?.data?.details;
    return Promise.reject(enriched);
  }
);

// ===== Comparison APIs =====

export const uploadFiles = (fileA, fileB, onProgress) => {
  const formData = new FormData();
  formData.append('fileA', fileA);
  formData.append('fileB', fileB);
  return API.post('/comparisons/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress) onProgress(Math.round((evt.loaded / evt.total) * 100));
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
  `http://localhost:5000/api/comparisons/jobs/${jobId}/download`;

export const getHistory = () => API.get('/comparisons/history');

// ===== Template APIs =====

export const getTemplates = () => API.get('/templates');

export const createTemplate = (data) => API.post('/templates', data);

export const deleteTemplate = (id) => API.delete(`/templates/${id}`);

export default API;
