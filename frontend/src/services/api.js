/**
 * src/services/api.js
 * RoadIQ — Central API layer.
 * VITE_USE_MOCK=true uses deterministic mock data.
 * All functions return Promises for seamless real-backend swap.
 */

import axios from 'axios';
import * as mock from '../mock/data';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const client = axios.create({ baseURL: BASE_URL, timeout: 15000, headers: { 'Content-Type': 'application/json' } });
client.interceptors.request.use((config) => { const token = localStorage.getItem('roadiq_token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
client.interceptors.response.use((res) => res.data, (err) => { const msg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Unexpected error'; return Promise.reject(new Error(msg)); });

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginAsRole = async (role) => {
  await delay(400);
  if (role === 'authority') return { token: 'mock-auth-token', user: mock.authorityUser };
  if (role === 'contributor') return { token: 'mock-contrib-token', user: mock.contributorUser };
  throw new Error('Invalid role');
};

export const login = async (credentials) => {
  if (USE_MOCK) {
    await delay(600);
    if (credentials.email === 'admin@roadiq.gov' && credentials.password === 'admin123') return { token: 'mock-jwt-token', user: mock.authorityUser };
    throw new Error('Invalid credentials');
  }
  return client.post('/api/auth/login', credentials);
};

export const logout = async () => { localStorage.removeItem('roadiq_token'); localStorage.removeItem('roadiq_user'); };

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardStats = async () => {
  if (USE_MOCK) { await delay(); return mock.dashboardStats; }
  return client.get('/api/dashboard/stats');
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const getReports = async (params = {}) => {
  if (USE_MOCK) {
    await delay();
    let data = [...mock.reports];
    if (params.submitted_by) data = data.filter((r) => r.submitted_by === params.submitted_by);
    if (params.road_segment_id) data = data.filter((r) => r.road_segment_id === params.road_segment_id);
    if (params.status) data = data.filter((r) => r.status === params.status);
    return data;
  }
  return client.get('/api/reports', { params });
};

export const getReport = async (id) => {
  if (USE_MOCK) {
    await delay();
    const report = mock.reports.find((r) => r._id === id);
    if (!report) throw new Error('Report not found');
    return report;
  }
  return client.get(`/api/reports/${id}`);
};

export const submitReport = async (formData) => {
  if (USE_MOCK) {
    await delay(800);
    return { success: true, report_id: 'RIQ-1060', message: 'Report submitted for AI analysis' };
  }
  return client.post('/api/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const analyzeReport = async (evidenceData) => {
  if (USE_MOCK) {
    await delay(2200);
    return mock.newSubmissionAIResult;
  }
  return client.post('/api/reports/analyze', evidenceData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const updateReportStatus = async (id, status) => {
  if (USE_MOCK) { await delay(300); return { success: true, id, status }; }
  return client.put(`/api/reports/${id}/status`, { status });
};

// ── Road Segments ─────────────────────────────────────────────────────────────
export const getRoadSegments = async () => {
  if (USE_MOCK) { await delay(); return mock.roadSegments; }
  return client.get('/api/roads');
};

export const getRoadSegment = async (id) => {
  if (USE_MOCK) {
    await delay();
    const seg = mock.roadSegments.find((s) => s.id === id);
    if (!seg) throw new Error('Road segment not found');
    return seg;
  }
  return client.get(`/api/roads/${id}`);
};

export const getRoadHistory = async (id) => {
  if (USE_MOCK) {
    await delay();
    return mock.roadHistory[id] || [];
  }
  return client.get(`/api/roads/${id}/history`);
};

export const getRoadReports = async (id) => {
  if (USE_MOCK) {
    await delay();
    return mock.reports.filter((r) => r.road_segment_id === id);
  }
  return client.get(`/api/roads/${id}/reports`);
};

// ── Priority Queue ─────────────────────────────────────────────────────────────
export const getPriorityQueue = async () => {
  if (USE_MOCK) { await delay(); return mock.priorityQueue; }
  return client.get('/api/priority');
};

// ── Recurring Damage ──────────────────────────────────────────────────────────
export const getRecurringDamage = async () => {
  if (USE_MOCK) { await delay(); return mock.recurringDamage; }
  return client.get('/api/recurring-damage');
};

// ── Repairs ───────────────────────────────────────────────────────────────────
export const getRepairs = async () => {
  if (USE_MOCK) { await delay(); return mock.repairs; }
  return client.get('/api/repairs');
};

export const getRepair = async (id) => {
  if (USE_MOCK) {
    await delay();
    const rep = mock.repairs.find((r) => r.id === id);
    if (!rep) throw new Error('Repair not found');
    return rep;
  }
  return client.get(`/api/repairs/${id}`);
};

export const assignRepair = async (reportId, data) => {
  if (USE_MOCK) { await delay(500); return { success: true, repair_id: 'REP-NEW', message: 'Repair assigned' }; }
  return client.post('/api/repairs', { report_id: reportId, ...data });
};

export const updateRepairStatus = async (id, status) => {
  if (USE_MOCK) { await delay(300); return { success: true, id, status }; }
  return client.patch(`/api/repairs/${id}`, { status });
};

// ── Repair Verification ────────────────────────────────────────────────────────
export const submitVerification = async (formData) => {
  if (USE_MOCK) { await delay(2000); return mock.verificationResult; }
  return client.post('/api/verify-repair', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const getVerifications = async () => {
  if (USE_MOCK) { await delay(); return mock.verifications; }
  return client.get('/api/verifications');
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = async (role) => {
  if (USE_MOCK) {
    await delay();
    return role === 'authority' ? mock.authorityNotifications : mock.contributorNotifications;
  }
  return client.get('/api/notifications');
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const getAnalytics = async () => {
  if (USE_MOCK) { await delay(); return mock.analyticsData; }
  return client.get('/api/analytics');
};

// ── Contributor Stats ─────────────────────────────────────────────────────────
export const getContributorStats = async (userId) => {
  if (USE_MOCK) {
    await delay();
    return { points: 240, reports_submitted: 12, ai_verified: 9, resolved: 6, needs_evidence: 1, under_review: 1, under_repair: 1 };
  }
  return client.get(`/api/contributors/${userId}/stats`);
};
