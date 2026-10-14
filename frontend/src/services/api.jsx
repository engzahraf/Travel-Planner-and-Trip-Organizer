const API_BASE = 'http://localhost:5000/api';
export const BASE_URL = 'http://localhost:5000';

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'LKR', symbol: 'Rs.', label: 'LKR (Rs.)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
  { code: 'CAD', symbol: 'C$', label: 'CAD (C$)' }
];

export const getCurrencySymbol = (currency = 'USD') => {
  switch (currency) {
    case 'LKR':
      return 'Rs.';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'JPY':
      return '¥';
    case 'SGD':
      return 'S$';
    case 'INR':
      return '₹';
    case 'AUD':
      return 'A$';
    case 'CAD':
      return 'C$';
    default:
      return currency || '$';
  }
};

export const formatCurrency = (amount, currency = 'USD') => {
  const val = Number(amount || 0);
  const formattedVal = val.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  // Strict specification requirement:
  // "LKR must always display: Rs. 300,000 not: LKR 300,000"
  switch (currency) {
    case 'LKR':
      return `Rs. ${formattedVal}`;
    case 'USD':
      return `$${formattedVal}`;
    case 'EUR':
      return `€${formattedVal}`;
    case 'GBP':
      return `£${formattedVal}`;
    case 'JPY':
      return `¥${formattedVal}`;
    case 'SGD':
      return `S$${formattedVal}`;
    case 'INR':
      return `₹${formattedVal}`;
    case 'AUD':
      return `A$${formattedVal}`;
    case 'CAD':
      return `C$${formattedVal}`;
    default:
      return `${currency} ${formattedVal}`;
  }
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('traval_token');
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData (don't set Content-Type header so browser sets multipart boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};
