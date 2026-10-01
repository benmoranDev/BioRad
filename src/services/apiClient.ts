import { storageService } from './storage';
import { User, Course, Certificate, AuditLog } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_RUST_BACKEND_URL || 'http://localhost:8080/api';

/**
 * Unified API Client for communicating with the Rust Backend (Axum + Supabase)
 */
export const apiClient = {
  /**
   * Healthcheck
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL.replace(/\/api$/, '')}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Authenticate user with the Rust backend
   */
  async login(email: string, password?: string): Promise<{ token: string; user: User } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch (e) {
      console.warn('Rust backend login unavailable, using client-side auth fallback:', e);
    }
    return null;
  },

  /**
   * Fetch courses from Rust backend
   */
  async getCourses(): Promise<Course[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/courses`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Rust backend courses unavailable, using local fallback:', e);
    }
    return storageService.getCourses();
  },

  /**
   * Create new course in Rust backend & Supabase PostgreSQL
   */
  async createCourse(course: Course): Promise<Course> {
    try {
      const res = await fetch(`${API_BASE_URL}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          storageService.addCourse(json.data);
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Rust backend create course unavailable, persisting locally:', e);
    }
    storageService.addCourse(course);
    return course;
  },

  /**
   * Update course in Rust backend & Supabase PostgreSQL
   */
  async updateCourse(courseId: string, updates: Partial<Course>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/courses/${encodeURIComponent(courseId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const existing = storageService.getCourses().find(c => c.id === courseId);
        if (existing) {
          storageService.updateCourse({ ...existing, ...updates });
        }
        return true;
      }
    } catch (e) {
      console.warn('Rust backend update course unavailable, updating locally:', e);
    }
    const existing = storageService.getCourses().find(c => c.id === courseId);
    if (existing) {
      storageService.updateCourse({ ...existing, ...updates });
      return true;
    }
    return false;
  },

  /**
   * Delete course from Rust backend & Supabase PostgreSQL
   */
  async deleteCourse(courseId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/courses/${encodeURIComponent(courseId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        storageService.deleteCourse(courseId);
        return true;
      }
    } catch (e) {
      console.warn('Rust backend delete course unavailable, removing locally:', e);
    }
    storageService.deleteCourse(courseId);
    return true;
  },

  /**
   * Validate Certificate against the Rust backend & Supabase database
   */
  async verifyCertificate(code: string): Promise<Certificate | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/certificates/verify/${encodeURIComponent(code)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Rust backend verification unavailable, using local fallback:', e);
    }
    return storageService.getCertificates().find(c => c.code.toLowerCase() === code.trim().toLowerCase()) || null;
  },

  /**
   * Fetch Audit Logs from the Rust backend
   */
  async getAuditLogs(filters?: { user_id?: string; action?: string; start_date?: string; end_date?: string; page?: number; limit?: number }): Promise<AuditLog[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.user_id) queryParams.set('user_id', filters.user_id);
      if (filters?.action) queryParams.set('action', filters.action);
      if (filters?.start_date) queryParams.set('start_date', filters.start_date);
      if (filters?.end_date) queryParams.set('end_date', filters.end_date);
      if (filters?.page) queryParams.set('page', filters.page.toString());
      if (filters?.limit) queryParams.set('limit', filters.limit.toString());

      const res = await fetch(`${API_BASE_URL}/audit-logs?${queryParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Rust backend audit logs unavailable, using local fallback:', e);
    }
    return storageService.getAuditLogs();
  }
};
