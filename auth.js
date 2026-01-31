/**
 * FIXLY AUTH - Sistema de Autenticación
 * Login via API, manejo de tokens, logout y protección de rutas
 *
 * REQUIERE: config.js cargado antes
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  // Usar config centralizada o fallback
  const getApiBase = () => (window.FIXLY_CONFIG?.API_BASE) || window.FIXLY_API_BASE || 'https://api.fixlytaller.com';

  // Keys de localStorage
  const TOKEN_KEY = 'fixlyAuthToken';
  const USER_KEY = 'fixly_user';
  const TENANT_KEY = 'fixlyTenantId';
  const LOCATION_KEY = 'fixlyLocationId';
  const DEVICE_KEY = 'fixlyDeviceId';
  const SESSION_KEY = 'fixlySessionJti';

  // ============================================
  // FUNCIONES DE TOKEN
  // ============================================

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function isAuthenticated() {
    return !!getToken();
  }

  // ============================================
  // FUNCIONES DE USUARIO
  // ============================================

  function getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearUser() {
    localStorage.removeItem(USER_KEY);
  }

  // ============================================
  // AUTH FETCH - CON HEADERS Y 401 HANDLING
  // ============================================

  /**
   * Fetch con autenticación automática
   * - Agrega Authorization: Bearer token
   * - Agrega X-Tenant-Id
   * - Agrega X-Location-Id
   * - Si recibe 401 → logout y redirect a login.html
   *
   * @param {string} path - Ruta relativa (ej: /api/historial)
   * @param {object} options - Opciones de fetch
   * @returns {Promise<Response>}
   */
  async function authFetch(path, options = {}) {
    const API_BASE = getApiBase();
    const token = getToken();
    const tenantId = localStorage.getItem(TENANT_KEY);
    const locationId = localStorage.getItem(LOCATION_KEY);

    const config = { ...options };
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };

    // Agregar headers de auth y tenant
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId;
    }
    if (locationId) {
      config.headers['X-Location-Id'] = locationId;
    }

    try {
      const response = await fetch(`${API_BASE}${path}`, config);

      // Si 401 → sesión expirada, logout
      if (response.status === 401) {
        console.warn('Token expirado o inválido, cerrando sesión...');
        logout();
        return response; // Devolver para que el caller pueda manejar
      }

      return response;
    } catch (error) {
      console.error('Error en authFetch:', error);
      throw error;
    }
  }

  // ============================================
  // LOGIN
  // ============================================

  /**
   * Login contra API
   * @param {string} email
   * @param {string} password
   * @param {string} tenantId - Código del taller (opcional, para login público)
   * @returns {Promise<object>} Datos del usuario y token
   */
  async function login(email, password, tenantId = null) {
    const API_BASE = getApiBase();

    const body = { email, password };
    if (tenantId) {
      body.tenantId = tenantId;
    }

    const response = await fetch(`${API_BASE}/auth/public/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.message || 'Credenciales incorrectas');
    }

    const data = await response.json();
    const token = data.token || data.jwt || data.accessToken;

    if (!token) {
      throw new Error('No se recibió token del servidor');
    }

    // Guardar token
    setToken(token);

    // Guardar usuario si viene
    if (data.user) {
      setUser(data.user);

      // Guardar info de ACL si está disponible
      if (window.FixlyACL) {
        const isAdmin = data.user.role === 'admin' || data.user.isAdmin === true;
        window.FixlyACL.setUser(data.user.name || data.user.email, isAdmin);
      }
    }

    return data;
  }

  // ============================================
  // LOGOUT
  // ============================================

  /**
   * Cierra sesión y limpia todo
   */
  function logout() {
    // Limpiar heartbeat si existe
    if (window._fixlyHeartbeat) {
      clearInterval(window._fixlyHeartbeat);
      window._fixlyHeartbeat = null;
    }

    // Limpiar storage
    clearToken();
    clearUser();
    localStorage.removeItem(TENANT_KEY);
    localStorage.removeItem(LOCATION_KEY);
    localStorage.removeItem(DEVICE_KEY);
    localStorage.removeItem(SESSION_KEY);

    // Limpiar ACL
    if (window.FixlyACL) {
      window.FixlyACL.clearUser();
    }

    // Redirect a login
    window.location.href = 'login.html';
  }

  // ============================================
  // GET ME - INFO DEL USUARIO
  // ============================================

  /**
   * Obtiene info del usuario actual desde el backend
   * @returns {Promise<object>}
   */
  async function getMe() {
    const response = await authFetch('/auth/me');

    if (!response.ok) {
      throw new Error('No se pudo obtener información del usuario');
    }

    const data = await response.json();

    if (data.user) {
      setUser(data.user);
    }

    return data;
  }

  // ============================================
  // REQUIRE AUTH - PROTECCIÓN DE RUTAS
  // ============================================

  /**
   * Verifica que el usuario esté autenticado
   * Si no lo está, redirige a login.html
   */
  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  // ============================================
  // EXPONER API GLOBAL
  // ============================================

  window.FixlyAuth = {
    login: login,
    logout: logout,
    getMe: getMe,
    isAuthenticated: isAuthenticated,
    getToken: getToken,
    getUser: getUser,
    requireAuth: requireAuth
  };

  // Exponer authFetch globalmente para compatibilidad
  window.authFetch = authFetch;

  // ============================================
  // PROTECCIÓN AUTOMÁTICA AL CARGAR
  // ============================================

  document.addEventListener('DOMContentLoaded', function() {
    // No proteger la página de login
    const path = (window.location.pathname || '').toLowerCase();
    if (path.includes('login') || document.getElementById('loginForm')) {
      return;
    }

    // Verificar autenticación
    if (!isAuthenticated()) {
      window.location.href = 'login.html';
    }
  });

  console.log('FixlyAuth cargado');

})();
