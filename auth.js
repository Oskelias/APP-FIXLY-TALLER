/**
 * FIXLY AUTH - Frontend Mínimo
 * Sistema de autenticación simple para HTML estático
 */

(function() {
  'use strict';

  const API_ORIGIN = (window.FIXLY_API_BASE && String(window.FIXLY_API_BASE).trim()) || 'https://api.fixlytaller.com';
  window.FIXLY_API_BASE = API_ORIGIN;
  window.API_ORIGIN = API_ORIGIN;

  // Keys de localStorage
  const TOKEN_KEY = 'fixly_token';
  const LEGACY_TOKEN_KEY = 'fixlyAuthToken';
  const USER_KEY = 'fixly_user';

  function getAnyToken() {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || null;
  }

  function clearAuthStorage() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem('fixlytallerLoggedIn');
    localStorage.removeItem('fixlySessionJti');
    localStorage.removeItem('fixly_me_valid');
  }

  function showLoginUI() {
    const loginDiv = document.getElementById('loginScreen');
    const appDiv = document.getElementById('mainApp');
    if (appDiv) appDiv.classList.add('hidden');
    if (loginDiv) {
      loginDiv.classList.remove('hidden');
      return true;
    }
    return false;
  }

  // ============================================
  // API DE AUTENTICACIÓN
  // ============================================

  window.FixlyAuth = {

    /**
     * Login
     */
    async login(email, password) {
      const response = await fetch(`${API_ORIGIN}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Error al iniciar sesión');
      }

      const data = await response.json();

      // Compatibilidad: guardar token en ambas claves
      window.FixlyAuth.setToken(data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem('fixly_me_valid', '1');

      return data;
    },

    /**
     * Logout
     */
    async logout(options = {}) {
      const token = getAnyToken();
      const shouldReload = options.reload !== false;

      if (token) {
        try {
          await fetch(`${API_ORIGIN}/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (_) {
          // Ignorar error de red en logout remoto y limpiar localmente
        }
      }

      window.FixlyAuth.clearAuthStorage();

      try {
        if (typeof window.resetUIAfterLogout === 'function') {
          window.resetUIAfterLogout();
        }
      } catch (_) {}

      if (showLoginUI()) {
        if (window.location.pathname !== '/login') {
          history.replaceState({}, '', '/login');
        }
        return;
      }

      if (shouldReload) {
        window.location.href = 'login.html';
      }
    },

    /**
     * Obtener usuario actual
     */
    async getMe() {
      const token = getAnyToken();

      if (!token) {
        throw new Error('No hay token');
      }

      const response = await fetch(`${API_ORIGIN}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const err = new Error('Token inválido');
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem('fixly_me_valid', '1');

      return data.user;
    },

    /**
     * Verificar si está autenticado
     */
    isAuthenticated() {
      return !!getAnyToken() && localStorage.getItem('fixly_me_valid') === '1';
    },

    /**
     * Obtener usuario del localStorage
     */
    getUser() {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Obtener token
     */
    getToken() {
      return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || '';
    },

    /**
     * Guardar token en ambas keys (compatibilidad)
     */
    setToken(token) {
      if (!token) return;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(LEGACY_TOKEN_KEY, token);
    },

    /**
     * Limpiar almacenamiento de autenticación
     */
    clearAuthStorage() {
      clearAuthStorage();
    },


    /**
     * Obtener token (compatibilidad)
     */
    getAnyToken,

    /**
     * Requiere autenticación para continuar
     */
    requireAuth(options = {}) {
      const token = getAnyToken();
      if (token) return true;

      if (!options.silent) {
        if (!showLoginUI()) {
          const loginPath = options.loginPath || 'login.html';
          window.location.href = loginPath;
        }
      }
      return false;
    }
  };

  // ============================================
  // FETCH CON AUTH AUTOMÁTICO
  // ============================================

  window.authFetch = async function(url, options = {}) {
    const token = getAnyToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token && options.auth !== false) {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestURL = /^https?:\/\//i.test(url) ? url : `${API_ORIGIN}${url}`;

    return fetch(requestURL, {
      ...options,
      headers
    });
  };

  // ============================================
  // PROTECCIÓN AUTOMÁTICA
  // ============================================

  document.addEventListener('DOMContentLoaded', async function() {
    const p = (window.location.pathname || '').toLowerCase();
    if (p.endsWith('/login.html')) {
      return;
    }

    const token = getAnyToken();
    if (!token) {
      window.FixlyAuth.requireAuth();
      return;
    }

    try {
      await window.FixlyAuth.getMe();
    } catch (error) {
      if (error && (error.status === 401 || error.status === 403)) {
        window.FixlyAuth.clearAuthStorage();
        window.FixlyAuth.requireAuth();
        return;
      }
    }
  });

})();
