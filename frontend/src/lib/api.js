/** База API: в dev — `/api` (прокси Vite), в проде — `VITE_API_URL` + `/api` */
function getApiBase() {
  const u = import.meta.env.VITE_API_URL?.trim();
  if (u) return `${u.replace(/\/$/, '')}/api`;
  return '/api';
}

const BASE_URL = getApiBase();

const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
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

export const api = {
  getMenu: async () => {
    const response = await fetch(`${BASE_URL}/menu`);
    if (!response.ok) throw new Error('Failed to fetch menu');
    return response.json();
  },

  getReviews: async () => {
    const response = await fetch(`${BASE_URL}/reviews`);
    if (!response.ok) return [];
    return response.json();
  },

  submitReview: async (data) => {
    const response = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to submit review');
    return response.json();
  },

  login: async (email, password) => {
    const response = await fetchWithTimeout(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }, 8000);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Ошибка входа');
    }
    return response.json();
  },

  register: async (name, email, phone, password) => {
    const response = await fetchWithTimeout(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }),
    }, 10000);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Ошибка регистрации');
    }
    return response.json();
  },

  createReservation: async (data) => {
    const response = await fetch(`${BASE_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to create reservation');
    }
    return response.json();
  },

  checkAvailability: async (date, time) => {
    const response = await fetch(`${BASE_URL}/reservations/availability?date=${date}&time=${time}`);
    if (!response.ok) throw new Error('Failed to check availability');
    return response.json();
  },

  getPromoStatus: async (email) => {
    const response = await fetch(`${BASE_URL}/promo-status?email=${encodeURIComponent(email)}`);
    if (!response.ok) {
      return {
        look20_available: true,
        look15_available: false,
        has_found_easter_egg: false,
        lookrun_available: false,
        lookrun_used: false,
      };
    }
    return response.json();
  },

  claimRunnerReward: async (email, score) => {
    const response = await fetch(`${BASE_URL}/user/runner-reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), score }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const detail = err.detail;
      const msg = Array.isArray(detail) ? detail[0] : detail;
      throw new Error(typeof msg === 'string' ? msg : 'Не удалось сохранить награду');
    }
    return response.json();
  },

  createOrder: async (data) => {
    const response = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to create order');
    }
    return response.json();
  },

  // --- User-specific endpoints ---
  getUserReservations: async (userId) => {
    const response = await fetch(`${BASE_URL}/reservations/user/${userId}`);
    if (!response.ok) return [];
    return response.json();
  },

  cancelReservation: async (id) => {
    const res = await fetch(`${BASE_URL}/reservations/${id}/cancel`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Не удалось отменить бронь');
  },

  getUserOrders: async (userId) => {
    const response = await fetch(`${BASE_URL}/orders/user/${userId}`);
    if (!response.ok) return [];
    return response.json();
  },

  getUserReviews: async (userId) => {
    const response = await fetch(`${BASE_URL}/reviews/user/${userId}`);
    if (!response.ok) return [];
    return response.json();
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to send reset code');
    }
    return response.json();
  },

  resetPassword: async (data) => {
    const response = await fetch(`${BASE_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to reset password');
    }
    return response.json();
  },

  markEasterEggAsFound: async (email) => {
    const response = await fetch(`${BASE_URL}/user/found-easter-egg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error('Failed to mark easter egg');
    return response.json();
  },
};
