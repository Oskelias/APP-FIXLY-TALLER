(function() {
  'use strict';

  const API_ORIGIN = (window.FIXLY_API_BASE && String(window.FIXLY_API_BASE).trim()) || 'https://api.fixlytaller.com';
  window.FIXLY_API_BASE = API_ORIGIN;
  window.API_ORIGIN = API_ORIGIN;

  function resolveURL(path) {
    if (/^https?:\/\//i.test(path)) return path;
    return `${API_ORIGIN}${path}`;
  }

  async function safeParseJSON(response) {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (_) {
      return { raw: text };
    }
  }

  window.apiFetch = async function(path, options = {}) {
    const {
      method = 'GET',
      body,
      auth = true,
      headers = {},
      ...rest
    } = options;

    const finalHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    const token = window.FixlyAuth?.getAnyToken?.();
    if (auth && token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(resolveURL(path), {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      ...rest
    });

    const data = await safeParseJSON(response);

    if (response.status === 401) {
      if (window.FixlyAuth?.logout) {
        await window.FixlyAuth.logout({ reload: false });
      }
      const err = new Error('Sesión no autorizada');
      err.status = 401;
      err.data = data;
      throw err;
    }

    if (!response.ok) {
      const err = new Error((data && (data.error || data.message)) || `HTTP ${response.status}`);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  };
})();
