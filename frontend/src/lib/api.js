function getApiBase() {
  const u = import.meta.env.VITE_API_URL?.trim();
  if (u) return `${u.replace(/\/$/, '')}/api`;
  return '/api';
}

const BASE_URL = getApiBase();

const USER_TOKEN_KEY = 'look_user_token';
const ADMIN_TOKEN_KEY = 'look_admin_token';

export const getToken = () => localStorage.getItem(USER_TOKEN_KEY);
export const setToken = (token) =>
  token ? localStorage.setItem(USER_TOKEN_KEY, token) : localStorage.removeItem(USER_TOKEN_KEY);

export const getAdminToken = () => sessionStorage.getItem(ADMIN_TOKEN_KEY);
export const setAdminToken = (token) =>
  token ? sessionStorage.setItem(ADMIN_TOKEN_KEY, token) : sessionStorage.removeItem(ADMIN_TOKEN_KEY);

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Превышено время ожидания сервера. Пожалуйста, попробуйте позже.');
    }
    throw error;
  }
};

const apiFetch = (url, options = {}, timeout = 10000) =>
  fetchWithTimeout(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
  }, timeout);

export const api = {
  // --- Public ---
  getMenu: async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/menu`);
    if (!res.ok) throw new Error('Failed to fetch menu');
    return res.json();
  },

  getReviews: async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/reviews`);
    if (!res.ok) return [];
    return res.json();
  },

  checkAvailability: async (date, time) => {
    const res = await fetchWithTimeout(`${BASE_URL}/reservations/availability?date=${date}&time=${time}`);
    if (!res.ok) throw new Error('Failed to check availability');
    return res.json();
  },

  getPromoStatus: async (email) => {
    const res = await fetchWithTimeout(`${BASE_URL}/promo-status?email=${encodeURIComponent(email)}`);
    if (!res.ok) return { look20_available: true, look15_available: false, has_found_easter_egg: false, lookrun_available: false, lookrun_used: false };
    return res.json();
  },

  lookupPromo: async (code) => {
    const res = await fetchWithTimeout(`${BASE_URL}/promo/lookup?code=${encodeURIComponent(code)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'ПРОМОКОД НЕ СУЩЕСТВУЕТ');
    }
    return res.json();
  },

  createReservation: async (data) => {
    const res = await apiFetch(`${BASE_URL}/reservations`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create reservation');
    }
    return res.json();
  },

  createOrder: async (data) => {
    const res = await apiFetch(`${BASE_URL}/orders`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create order');
    }
    return res.json();
  },

  // --- Auth ---
  login: async (email, password) => {
    const res = await fetchWithTimeout(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }, 8000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Ошибка входа');
    }
    const data = await res.json();
    setToken(data.token);
    return data;
  },

  register: async (name, email, phone, password) => {
    const res = await fetchWithTimeout(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }),
    }, 10000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Ошибка регистрации');
    }
    const data = await res.json();
    setToken(data.token);
    return data;
  },

  forgotPassword: async (email) => {
    const res = await fetchWithTimeout(`${BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to send reset code');
    }
    return res.json();
  },

  resetPassword: async (data) => {
    const res = await fetchWithTimeout(`${BASE_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to reset password');
    }
    return res.json();
  },

  adminLogin: async (password) => {
    const res = await fetchWithTimeout(`${BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }, 8000);
    if (!res.ok) throw new Error('Неверный пароль');
    const data = await res.json();
    setAdminToken(data.token);
    return data;
  },

  // --- Protected (JWT required) ---
  submitReview: async (data) => {
    const res = await apiFetch(`${BASE_URL}/reviews`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit review');
    }
    return res.json();
  },

  getUserReservations: async (userId) => {
    const res = await apiFetch(`${BASE_URL}/reservations/user/${userId}`);
    if (!res.ok) return [];
    return res.json();
  },

  cancelReservation: async (id) => {
    const res = await apiFetch(`${BASE_URL}/reservations/${id}/cancel`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Не удалось отменить бронь');
  },

  getUserOrders: async (userId) => {
    const res = await apiFetch(`${BASE_URL}/orders/user/${userId}`);
    if (!res.ok) return [];
    return res.json();
  },

  getUserReviews: async (userId) => {
    const res = await apiFetch(`${BASE_URL}/reviews/user/${userId}`);
    if (!res.ok) return [];
    return res.json();
  },

  updateProfile: async (data) => {
    const res = await apiFetch(`${BASE_URL}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Не удалось сохранить профиль');
    }
    return res.json();
  },

  claimRunnerReward: async (score) => {
    const res = await apiFetch(`${BASE_URL}/user/runner-reward`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const detail = err.detail;
      const msg = Array.isArray(detail) ? detail[0] : detail;
      throw new Error(typeof msg === 'string' ? msg : 'Не удалось сохранить награду');
    }
    return res.json();
  },

  markEasterEggAsFound: async () => {
    const res = await apiFetch(`${BASE_URL}/user/found-easter-egg`, { method: 'POST', body: JSON.stringify({}) });
    if (!res.ok) throw new Error('Failed to mark easter egg');
    return res.json();
  },
};
