
/**
 * FIXLY AUTH - Frontend Mínimo
 * Sistema de autenticación simple para HTML estático
 */

(function() {
  'use strict';

  // --------------------------------------------------------------------------------
  // Configuración flexible de la base de la API
  //
  // Si necesitas apuntar a un servidor distinto al de producción (por ejemplo,
  // un backend local), define window.FIXLY_API_BASE o guarda una clave
  // 'fixly_api_base' en el localStorage antes de cargar este script. Si ninguna
  // está definida se usará la URL de producción.
  // --------------------------------------------------------------------------------
  const DEFAULT_API = 'https://api.fixlytaller.com';
  const storedBase = typeof localStorage !== 'undefined' ? localStorage.getItem('fixly_api_base') : null;
  const API_ORIGIN = window.API_ORIGIN || window.FIXLY_API_BASE || storedBase || DEFAULT_API;
  window.FIXLY_API_BASE = API_ORIGIN;
  window.API_ORIGIN = API_ORIGIN;

  function joinUrl(base, path) {
  const b = String(base || '').trim().replace(/\/+\$/,'');
  const p = String(path || '').startsWith('/') ? String(path || '') : `/${String(path || '')}`;
  return `${b}${p}`;
}

  // Keys de localStorage
  const TOKEN_KEY = 'fixly_token';
  const LEGACY_TOKEN_KEY = 'fixlyAuthToken';
  const USER_KEY = 'fixly_user';

  function getAnyToken() {
    return (typeof localStorage !== 'undefined') ? (localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || null) : null;
  }

  function clearAuthStorage() {
    if (typeof localStorage === 'undefined') return;
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
    async login(username, password) {
      const url = joinUrl(API_ORIGIN, '/auth/login');
      const payload = { username, password };

      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (_) {
        throw new Error('No se pudo conectar con el servidor');
      }

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        if ((response.status === 401 || response.status === 403)) {
          throw new Error('Credenciales incorrectas');
        }
        throw new Error(body.error || 'Error al iniciar sesión');
      }

      const data = body || {};
      const token = data.token || data.jwt || data.accessToken;
      if (!token) {
        throw new Error('Error al iniciar sesión');
      }

      // Compatibilidad: guardar token en ambas claves
      window.FixlyAuth.setToken(token);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user || {}));
        localStorage.setItem('fixly_me_valid', '1');
      }

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
          await fetch(joinUrl(API_ORIGIN, '/auth/logout'), {
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

      let response;
      try {
        response = await fetch(joinUrl(API_ORIGIN, '/auth/me'), {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (_) {
        // si hay un problema de red, no vaciar las credenciales; simplemente lanzar un error genérico
        throw new Error('No se pudo verificar el token');
      }

      if (!response.ok) {
        const err = new Error('Token inválido');
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        localStorage.setItem('fixly_me_valid', '1');
      }

      return data.user;
    },

    /**
     * Verificar si está autenticado
     */
    isAuthenticated() {
      if (typeof localStorage === 'undefined') return false;
      return !!getAnyToken() && localStorage.getItem('fixly_me_valid') === '1';
    },

    /**
     * Obtener usuario del localStorage
     */
    getUser() {
      if (typeof localStorage === 'undefined') return null;
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Obtener token
     */
    getToken() {
      return getAnyToken() || '';
    },

    /**
     * Guardar token en ambas keys (compatibilidad)
     */
    setToken(token) {
      if (!token || typeof localStorage === 'undefined') return;
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

    const requestURL = /^https?:\/\//i.test(url) ? url : joinUrl(API_ORIGIN, url);

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

    // Comprobar la salud del backend; no provocar logout si falla
    fetch(joinUrl(API_ORIGIN, '/health'))
      .then(r => r.json())
      .then(j => console.log('HEALTH', j))
      .catch(e => console.warn('HEALTH_FAIL', e));

    // No verificar token en la página de login
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
      // sólo limpiar si hay un 401/403; en otros errores (red) mantener la sesión
      if (error && (error.status === 401 || error.status === 403)) {
        window.FixlyAuth.clearAuthStorage();
        window.FixlyAuth.requireAuth();
      } else {
        console.warn('No se pudo validar el token:', error);
      }
    }
  });

})();
