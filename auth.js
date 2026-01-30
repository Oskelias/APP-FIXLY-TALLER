/**
 * FIXLY AUTH - Frontend Mínimo
 * Sistema de autenticación simple para HTML estático
 */

(function() {
  'use strict';
  
  // Configurar URL de tu API
  const API_BASE = window.FIXLY_API_BASE || 'http://localhost:8787';
  
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
      const response = await fetch(`${API_BASE}/auth/login`, {
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
    logout() {
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
      
      const response = await fetch(`${API_BASE}/auth/me`, {
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
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(`${API_BASE}${url}`, {
      ...options,
      headers
    });
  };
  
  // ============================================
  // PROTECCIÓN AUTOMÁTICA
  // ============================================
  
  document.addEventListener('DOMContentLoaded', function() {
    // Si estamos en la página de login, no hacer nada
    if (window.location.pathname.includes('login.html')) {
      return;
    }
    
    // Si no está autenticado, redirigir a login
    if (!window.FixlyAuth.isAuthenticated()) {
      window.location.href = 'login.html';
    }
  });
  
})();
