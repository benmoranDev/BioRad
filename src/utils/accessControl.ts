import { User } from '../types';

export interface AccessValidityStatus {
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number;
  enrolledAtFormatted: string;
  expiresAtFormatted: string;
  totalAccessDays: number;
}

/**
 * Parses dates formatted as 'DD/MM/YYYY' or ISO string
 */
export function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day, 23, 59, 59);
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Checks whether the student's 2-month (60-day) access period has expired
 */
export function checkUserAccessValidity(user?: User | null): AccessValidityStatus {
  if (!user || user.role !== 'student') {
    return {
      isExpired: false,
      isExpiringSoon: false,
      daysRemaining: 999,
      enrolledAtFormatted: 'Acesso Ilimitado',
      expiresAtFormatted: 'Vitalício',
      totalAccessDays: 60
    };
  }

  // If user explicitly marked as expired
  if (user.isAccessExpired) {
    return {
      isExpired: true,
      isExpiringSoon: false,
      daysRemaining: 0,
      enrolledAtFormatted: user.enrolledAt || '01/01/2026',
      expiresAtFormatted: user.expiresAt || '01/03/2026',
      totalAccessDays: user.accessPeriodDays || 60
    };
  }

  const now = new Date();

  // If user has an explicit expiresAt date
  if (user.expiresAt) {
    const expDate = parseDate(user.expiresAt);
    if (expDate) {
      const diffMs = expDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isExpired = daysRemaining <= 0;
      const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;

      return {
        isExpired,
        isExpiringSoon,
        daysRemaining: Math.max(0, daysRemaining),
        enrolledAtFormatted: user.enrolledAt || new Date(expDate.getTime() - 60 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        expiresAtFormatted: user.expiresAt,
        totalAccessDays: user.accessPeriodDays || 60
      };
    }
  }

  // If user has enrolledAt or createdAt
  const enrolledDate = parseDate(user.enrolledAt || user.createdAt);
  const baseDate = enrolledDate || new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // default to 10 days ago (active)
  const accessDays = user.accessPeriodDays || 60; // 2 months standard
  const expDate = new Date(baseDate.getTime() + accessDays * 24 * 60 * 60 * 1000);

  const diffMs = expDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining <= 0;
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;

  return {
    isExpired,
    isExpiringSoon,
    daysRemaining: Math.max(0, daysRemaining),
    enrolledAtFormatted: baseDate.toLocaleDateString('pt-BR'),
    expiresAtFormatted: expDate.toLocaleDateString('pt-BR'),
    totalAccessDays: accessDays
  };
}
