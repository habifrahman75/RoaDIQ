/**
 * src/services/api.js
 *
 * Central API layer for RoadIQ frontend.
 * All backend calls originate here — never import axios directly in components.
 *
 * Environment variables:
 *   VITE_API_BASE_URL  – base URL of the FastAPI backend (default: http://localhost:8000)
 *   VITE_USE_MOCK      – set to "true" to use mock data (development)
 */

import axios from 'axios';
import * as mock from '../mock/data';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ── Axios instance ────────────────────────────────────────────────────────────
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token when available
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('roadiq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise error messages
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ── Delay helper for mock realism ─────────────────────────────────────────────
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// ── API methods ───────────────────────────────────────────────────────────────

/**
 * Dashboard
 */
export const getDashboardStats = async () => {
  if (USE_MOCK) { await delay(); return mock.dashboardStats; }
  return client.get('/api/dashboard/stats');
};

/**
 * Reports
 */
export const getReports = async (params = {}) => {
  if (USE_MOCK) { await delay(); return mock.reports; }
  return client.get('/api/reports', { params });
};

export const getReport = async (id) => {
  if (USE_MOCK) {
    await delay();
    const report = mock.reports.find((r) => r._id === id || r.id === id);
    if (!report) throw new Error('Report not found');
    return report;
  }
  return client.get(`/api/reports/${id}`);
};

export const updateReportStatus = async (id, status) => {
  if (USE_MOCK) {
    await delay(300);
    return { success: true, id, status };
  }
  return client.put(`/api/reports/${id}/status`, { status });
};

/**
 * Road Segments
 */
export const getRoadSegments = async () => {
  if (USE_MOCK) { await delay(); return mock.roadSegments; }
  return client.get('/api/road-segments');
};

/**
 * Priority Queue
 */
export const getPriorityQueue = async () => {
  if (USE_MOCK) { await delay(); return mock.priorityQueue; }
  return client.get('/api/priority');
};

/**
 * Repair Verification
 */
export const submitVerification = async (formData) => {
  if (USE_MOCK) {
    await delay(1000);
    return mock.verificationResult;
  }
  return client.post('/api/verify-repair', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getVerifications = async () => {
  if (USE_MOCK) { await delay(); return mock.verifications; }
  return client.get('/api/verifications');
};

/**
 * Auth (placeholder — wire to real backend when available)
 */
export const login = async (credentials) => {
  if (USE_MOCK) {
    await delay(600);
    if (
      credentials.email === 'admin@roadiq.gov' &&
      credentials.password === 'admin123'
    ) {
      return { token: 'mock-jwt-token', user: mock.currentUser };
    }
    throw new Error('Invalid credentials');
  }
  return client.post('/api/auth/login', credentials);
};

export const logout = async () => {
  localStorage.removeItem('roadiq_token');
  localStorage.removeItem('roadiq_user');
};
