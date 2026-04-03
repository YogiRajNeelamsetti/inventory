const IST_TIME_ZONE = 'Asia/Kolkata';

const toIstDate = (dateString) => {
  if (!dateString) return null;

  if (dateString instanceof Date) {
    return dateString;
  }

  const raw = String(dateString).trim();
  if (!raw) return null;

  const hasTimezone = /(Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const normalized = hasTimezone
    ? raw
    : isDateOnly
      ? `${raw}T00:00:00+05:30`
      : `${raw}+05:30`;

  return new Date(normalized);
};

// Format currency in Indian Rupees
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format date
export const formatDate = (dateString) => {
  const date = toIstDate(dateString);
  if (!date || Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: IST_TIME_ZONE,
  }).format(date);
};

// Format datetime
export const formatDateTime = (dateString) => {
  const date = toIstDate(dateString);
  if (!date || Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: IST_TIME_ZONE,
  }).format(date);
};

// Calculate days pending
export const daysPending = (dateString) => {
  const date = toIstDate(dateString);
  if (!date || Number.isNaN(date.getTime())) return 0;

  const now = new Date();
  const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  return diff;
};

// Format phone number
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

// Validate GST number
export const isValidGST = (gst) => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst);
};

// Validate phone number
export const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Handle API errors
export const handleApiError = (error) => {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (error?.error?.message) {
    return error.error.message;
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generate bill number
export const generateBillNumber = (id) => {
  return `BILL-${String(id).padStart(6, '0')}`;
};

// Calculate profit percentage
export const calculateProfitPercent = (selling, cost) => {
  if (cost === 0) return 0;
  return ((selling - cost) / cost) * 100;
};

// Get payment status badge color
export const getPaymentStatusColor = (status) => {
  const colors = {
    paid: 'green',
    pending: 'red',
    partial: 'orange',
  };
  return colors[status] || 'gray';
};

// Get order status badge color
export const getOrderStatusColor = (status) => {
  const colors = {
    received: 'green',
    pending: 'orange',
    cancelled: 'red',
  };
  return colors[status] || 'gray';
};

// Export data to CSV
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};
