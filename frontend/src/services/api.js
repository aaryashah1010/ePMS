import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('epms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('epms_token');
      localStorage.removeItem('epms_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// --- Auth ---
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  changePassword: (oldPassword, newPassword) => api.post('/auth/change-password', { oldPassword, newPassword }),
};

// --- Users ---
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  getProfile: () => api.get('/users/profile'),
  getReportees: () => api.get('/users/reportees'),
  getReviewees: () => api.get('/users/reviewees'),
  getAppraisees: () => api.get('/users/appraisees'),
};

// --- Cycles ---
export const cycleAPI = {
  getAll: (params) => api.get('/cycles', { params }),
  getActive: () => api.get('/cycles/active'),
  getById: (id) => api.get(`/cycles/${id}`),
  create: (data) => api.post('/cycles', data),
  update: (id, data) => api.put(`/cycles/${id}`, data),
  delete: (id) => api.delete(`/cycles/${id}`),
  advancePhase: (id) => api.post(`/cycles/${id}/advance-phase`),
  close: (id) => api.post(`/cycles/${id}/close`),
  getPendingWork: (id) => api.get(`/cycles/${id}/pending-work`),
};

// --- KPA ---
export const kpaAPI = {
  create: (cycleId, data) => api.post(`/kpa/cycle/${cycleId}`, data),
  getMy: (cycleId) => api.get(`/kpa/cycle/${cycleId}/my`),
  update: (id, data) => api.put(`/kpa/${id}`, data),
  delete: (id) => api.delete(`/kpa/${id}`),
  submit: (cycleId) => api.post(`/kpa/cycle/${cycleId}/submit`),
  getTeam: (cycleId) => api.get(`/kpa/cycle/${cycleId}/team`),
  getEmployee: (cycleId, userId) => api.get(`/kpa/cycle/${cycleId}/employee/${userId}`),
  review: (cycleId, userId, action, remarks) => api.post(`/kpa/cycle/${cycleId}/employee/${userId}/review`, { action, remarks }),
};

// --- Mid Year ---
export const midYearAPI = {
  getMy: (cycleId) => api.get(`/mid-year/cycle/${cycleId}/my`),
  save: (cycleId, data) => api.post(`/mid-year/cycle/${cycleId}`, data),
  submit: (cycleId) => api.post(`/mid-year/cycle/${cycleId}/submit`),
  getTeam: (cycleId) => api.get(`/mid-year/cycle/${cycleId}/team`),
  addRemarks: (cycleId, userId, remarks, rating) => api.post(`/mid-year/cycle/${cycleId}/employee/${userId}/remarks`, { remarks, rating }),
  getEmployee: (cycleId, userId) => api.get(`/mid-year/cycle/${cycleId}/employee/${userId}`),
};

// --- Appraisal ---
export const appraisalAPI = {
  getMy: (cycleId) => api.get(`/appraisal/cycle/${cycleId}/my`),
  updateSelf: (cycleId, achievements) => api.put(`/appraisal/cycle/${cycleId}/self-assessment`, { achievements }),
  submit: (cycleId) => api.post(`/appraisal/cycle/${cycleId}/submit`),
  getEmployee: (cycleId, userId) => api.get(`/appraisal/cycle/${cycleId}/employee/${userId}`),
  saveKpaRatings: (appraisalId, ratings) => api.post(`/appraisal/${appraisalId}/kpa-ratings`, { ratings }),
  saveAttributeRatings: (appraisalId, ratings) => api.post(`/appraisal/${appraisalId}/attribute-ratings`, { ratings }),
  reportingDone: (cycleId, userId, remarks) => api.post(`/appraisal/cycle/${cycleId}/employee/${userId}/reporting-done`, { remarks }),
  reviewingDone: (cycleId, userId, remarks) => api.post(`/appraisal/cycle/${cycleId}/employee/${userId}/reviewing-done`, { remarks }),
  acceptingDone: (cycleId, userId, remarks) => api.post(`/appraisal/cycle/${cycleId}/employee/${userId}/accepting-done`, { remarks }),
  getTeam: (cycleId) => api.get(`/appraisal/cycle/${cycleId}/team`),
  finalizeAll: (cycleId) => api.post(`/appraisal/cycle/${cycleId}/finalize-all`),
};

// --- Reports ---
export const reportAPI = {
  individual: (cycleId, userId) => api.get(`/reports/cycle/${cycleId}/individual/${userId}`),
  department: (cycleId, department) => api.get(`/reports/cycle/${cycleId}/department`, { params: { department } }),
  distribution: (cycleId) => api.get(`/reports/cycle/${cycleId}/distribution`),
  progress: (cycleId) => api.get(`/reports/cycle/${cycleId}/progress`),
  exportIndividual: (cycleId, userId) => api.get(`/reports/cycle/${cycleId}/individual/${userId}/export`, { responseType: 'blob' }),
  exportDepartment: (cycleId, department) => api.get(`/reports/cycle/${cycleId}/department/export`, { params: { department }, responseType: 'blob' }),
};

// --- Attributes ---
export const attributeAPI = {
  getAll: (params) => api.get('/attributes', { params }),
  create: (data) => api.post('/attributes', data),
  update: (id, data) => api.put(`/attributes/${id}`, data),
  delete: (id) => api.delete(`/attributes/${id}`),
};

// --- Audit ---
export const auditAPI = {
  getMy: () => api.get('/audit/my'),
  getAll: (params) => api.get('/audit', { params }),
};
