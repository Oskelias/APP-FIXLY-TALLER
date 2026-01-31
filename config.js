/**
 * FIXLY CONFIG - Configuración Centralizada
 * Todas las configuraciones globales del frontend
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURACIÓN DE API
  // ============================================

  const API_BASE = window.FIXLY_API_BASE || 'https://api.fixlytaller.com';

  // ============================================
  // HELPERS DE STORAGE POR TENANT
  // ============================================

  /**
   * Obtiene el prefijo del tenant actual
   * @returns {string} El tenantId o 'default'
   */
  function tenantPrefix() {
    return localStorage.getItem('fixlyTenantId') || 'default';
  }

  /**
   * Genera una key de localStorage segregada por tenant
   * @param {string} key - La key base
   * @returns {string} Key con prefijo de tenant
   */
  function skey(key) {
    return `${tenantPrefix()}_${key}`;
  }

  /**
   * Guarda JSON en localStorage segregado por tenant
   * @param {string} key - La key base (sin prefijo)
   * @param {any} value - Valor a guardar (se serializa a JSON)
   */
  function saveTenantJSON(key, value) {
    try {
      localStorage.setItem(skey(key), JSON.stringify(value));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  }

  /**
   * Carga JSON de localStorage segregado por tenant
   * @param {string} key - La key base (sin prefijo)
   * @param {any} defaultValue - Valor por defecto si no existe
   * @returns {any} El valor parseado o defaultValue
   */
  function loadTenantJSON(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(skey(key));
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      console.error('Error cargando de localStorage:', e);
      return defaultValue;
    }
  }

  /**
   * Elimina una key de localStorage segregada por tenant
   * @param {string} key - La key base (sin prefijo)
   */
  function removeTenantKey(key) {
    try {
      localStorage.removeItem(skey(key));
    } catch (e) {
      console.error('Error eliminando de localStorage:', e);
    }
  }

  // ============================================
  // EXPONER CONFIGURACIÓN GLOBAL
  // ============================================

  window.FIXLY_CONFIG = {
    API_BASE: API_BASE,
    tenantPrefix: tenantPrefix,
    skey: skey,
    saveTenantJSON: saveTenantJSON,
    loadTenantJSON: loadTenantJSON,
    removeTenantKey: removeTenantKey
  };

  console.log('FIXLY_CONFIG cargado. API_BASE:', API_BASE);

})();
