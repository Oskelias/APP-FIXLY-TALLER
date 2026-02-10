/**
 * FIXLY AUTH - Frontend Mínimo
 * Sistema de autenticación simple para HTML estático
 */

(function() {
  'use strict';

  const API_ORIGIN = 'https://api.fixlytaller.com';
  window.API_ORIGIN = API_ORIGIN;

  // Keys de localStorage
  const TOKEN_KEY = 'fixly_token';
  const USER_KEY = 'fixly_user';

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
        const error = await response.json();
        throw new Error(error.error || 'Error al iniciar sesión');
      }

      const data = await response.json();

      // Guardar token y usuario
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      return data;
    },

    /**
     * Logout
     */
    async logout() {
      const token = localStorage.getItem(TOKEN_KEY);

      if (token) {
        try {
          await fetch(`${API_ORIGIN}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (_) {
          // Ignorar error de red en logout remoto y limpiar localmente
        }
      }

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.reload();
    },

    /**
     * Obtener usuario actual
     */
    async getMe() {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        throw new Error('No hay token');
      }

      const response = await fetch(`${API_ORIGIN}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Token inválido');
      }

      const data = await response.json();
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      return data.user;
    },

    /**
     * Verificar si está autenticado
     */
    isAuthenticated() {
      return !!localStorage.getItem(TOKEN_KEY);
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
      return localStorage.getItem(TOKEN_KEY);
    }
  };

  // ============================================
  // FETCH CON AUTH AUTOMÁTICO
  // ============================================

  window.authFetch = async function(url, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token && url.startsWith('/api/')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${API_ORIGIN}${url}`, {
      ...options,
      headers
    });
  };

  // ============================================
  // PROTECCIÓN AUTOMÁTICA
  // ============================================

  document.addEventListener('DOMContentLoaded', function() {
    // Si estamos en la página de login, no hacer nada (más robusto)
    const p = (window.location.pathname || '').toLowerCase();
    if (p.includes('login') || document.getElementById('loginForm')) {
      return;
    }

    // Si no está autenticado, redirigir a login
    if (!window.FixlyAuth.isAuthenticated()) {
      window.location.href = 'login.html';
    }
  });

})();
