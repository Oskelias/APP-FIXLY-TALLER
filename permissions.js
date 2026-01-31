/**
 * FIXLY ACL - Sistema de Roles y Permisos
 * Control de acceso basado en roles (admin/empleado)
 */

(function() {
  'use strict';

  // ============================================
  // KEYS DE STORAGE
  // ============================================

  const USER_NAME_KEY = 'fixlyUserName';
  const IS_ADMIN_KEY = 'fixlyIsAdmin';

  // ============================================
  // MAPA DE PERMISOS POR EMPLEADO
  // ============================================

  // Secciones permitidas por nombre de empleado
  // Admin tiene acceso a TODO, esto es solo para empleados
  const EMPLOYEE_PERMISSIONS = {
    'Juan Pérez': ['dashboard', 'reparaciones', 'historial'],
    'Ana Silva': ['dashboard', 'reparaciones', 'clientes'],
    'Carlos López': ['dashboard', 'reparaciones', 'historial', 'pedidos'],
    'María García': ['dashboard', 'whatsapp', 'clientes'],
    // Agregar más empleados según necesidad
  };

  // Todas las secciones disponibles
  const ALL_SECTIONS = [
    'dashboard',
    'reparaciones',
    'historial',
    'clientes',
    'whatsapp',
    'pedidos',
    'configuracion'
  ];

  // ============================================
  // FUNCIONES DE ACL
  // ============================================

  /**
   * Verifica si el usuario actual es admin
   * @returns {boolean}
   */
  function isAdmin() {
    return localStorage.getItem(IS_ADMIN_KEY) === 'true';
  }

  /**
   * Obtiene el nombre del usuario actual
   * @returns {string|null}
   */
  function userName() {
    return localStorage.getItem(USER_NAME_KEY) || null;
  }

  /**
   * Guarda los datos del usuario después del login
   * @param {string} name - Nombre del usuario
   * @param {boolean} admin - Si es admin
   */
  function setUser(name, admin = false) {
    localStorage.setItem(USER_NAME_KEY, name);
    localStorage.setItem(IS_ADMIN_KEY, admin ? 'true' : 'false');
  }

  /**
   * Limpia los datos del usuario (logout)
   */
  function clearUser() {
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(IS_ADMIN_KEY);
  }

  /**
   * Verifica si el usuario puede acceder a una sección
   * @param {string} section - Nombre de la sección
   * @returns {boolean}
   */
  function canOpenSection(section) {
    // Admin tiene acceso a todo
    if (isAdmin()) {
      return true;
    }

    const name = userName();
    if (!name) {
      return false;
    }

    // Buscar permisos del empleado
    const perms = EMPLOYEE_PERMISSIONS[name];

    // Si no está en el mapa, acceso denegado
    if (!perms) {
      console.warn(`Usuario "${name}" no tiene permisos configurados`);
      return false;
    }

    return perms.includes(section);
  }

  /**
   * Obtiene la lista de secciones permitidas para el usuario actual
   * @returns {string[]}
   */
  function getAllowedSections() {
    if (isAdmin()) {
      return ALL_SECTIONS;
    }

    const name = userName();
    if (!name) {
      return [];
    }

    return EMPLOYEE_PERMISSIONS[name] || [];
  }

  /**
   * Aplica visibilidad al menú según permisos
   * Oculta items del sidebar que el usuario no puede ver
   */
  function applyMenuVisibility() {
    const allowed = getAllowedSections();

    // Buscar todos los items del menú con data-section
    document.querySelectorAll('[data-section]').forEach(el => {
      const section = el.getAttribute('data-section');
      if (section && !allowed.includes(section)) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
    });

    // También manejar onclick con showSection
    document.querySelectorAll('[onclick*="showSection"]').forEach(el => {
      const match = el.getAttribute('onclick').match(/showSection\([^,]*,\s*['"](\w+)['"]\)/);
      if (match) {
        const section = match[1];
        if (!allowed.includes(section)) {
          el.style.display = 'none';
        } else {
          el.style.display = '';
        }
      }
    });
  }

  /**
   * Wrapper para showSection que verifica permisos
   * @param {Event} event
   * @param {string} sectionName
   * @returns {boolean} true si se permitió, false si se bloqueó
   */
  function guardedShowSection(event, sectionName) {
    if (!canOpenSection(sectionName)) {
      alert(`No tenés permiso para acceder a "${sectionName}"`);
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      return false;
    }
    return true;
  }

  // ============================================
  // EXPONER API GLOBAL
  // ============================================

  window.FixlyACL = {
    isAdmin: isAdmin,
    userName: userName,
    setUser: setUser,
    clearUser: clearUser,
    canOpenSection: canOpenSection,
    getAllowedSections: getAllowedSections,
    applyMenuVisibility: applyMenuVisibility,
    guardedShowSection: guardedShowSection,
    EMPLOYEE_PERMISSIONS: EMPLOYEE_PERMISSIONS,
    ALL_SECTIONS: ALL_SECTIONS
  };

  // Aplicar visibilidad cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    // Pequeño delay para asegurar que el menú esté renderizado
    setTimeout(applyMenuVisibility, 100);
  });

  console.log('FixlyACL cargado');

})();
