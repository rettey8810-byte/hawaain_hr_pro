import { differenceInDays, parseISO, format, isValid } from 'date-fns';

export const calculateDaysRemaining = (expiryDate) => {
  if (!expiryDate) return null;
  const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
  if (!isValid(expiry)) return null;
  return differenceInDays(expiry, new Date());
};

export const getDocumentStatus = (expiryDate) => {
  const daysRemaining = calculateDaysRemaining(expiryDate);
  if (daysRemaining === null) return { status: 'unknown', label: 'Unknown', color: 'gray' };
  if (daysRemaining <= 0) return { status: 'expired', label: 'Expired', color: 'red' };
  if (daysRemaining <= 30) return { status: 'expiring_soon', label: 'Expiring Soon', color: 'red' };
  if (daysRemaining <= 60) return { status: 'warning', label: 'Warning', color: 'yellow' };
  if (daysRemaining <= 90) return { status: 'notice', label: 'Notice', color: 'blue' };
  return { status: 'valid', label: 'Valid', color: 'green' };
};

export const getStatusBadgeClass = (status) => {
  const classes = {
    valid: 'bg-green-100 text-green-800 border-green-200',
    notice: 'bg-blue-100 text-blue-800 border-blue-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    expiring_soon: 'bg-orange-100 text-orange-800 border-orange-200',
    expired: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    unknown: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return classes[status] || classes.unknown;
};

export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, formatStr);
};

export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const filterDocuments = (documents, filters) => {
  return documents.filter(doc => {
    if (filters.status && doc.status !== filters.status) return false;
    if (filters.department && doc.department !== filters.department) return false;
    if (filters.location && doc.location !== filters.location) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchableText = `${doc.name} ${doc.email} ${doc.department}`.toLowerCase();
      if (!searchableText.includes(searchLower)) return false;
    }
    return true;
  });
};

export const formatCurrency = (value, currency = 'USD') => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
};
