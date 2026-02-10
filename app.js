// JavaScript para WebApp - Versión Estática
console.log('🚀 WebApp estática cargada correctamente!');

const API_ORIGIN = window.API_ORIGIN || 'https://api.fixlytaller.com';
const TOKEN_KEYS = ['fixly_token', 'fixlyAuthToken'];

function getToken() {
  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return null;
}

function getRequestConfig(endpoint) {
  const config = { timeout: 10000 };

  if (endpoint.startsWith('/api/')) {
    const token = getToken();
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }
  }

  return config;
}

// Función para mostrar resultados de API
function showResult(result, isError = false) {
  const resultDiv = document.getElementById('api-result');
  if (resultDiv) {
    if (typeof result === 'object') {
      resultDiv.innerHTML = `<pre class="text-sm overflow-x-auto">${JSON.stringify(result, null, 2)}</pre>`;
    } else {
      resultDiv.textContent = result;
    }

    // Aplicar estilos según el resultado
    resultDiv.className = `p-4 rounded-lg min-h-16 ${
      isError
        ? 'bg-red-50 border border-red-200 text-red-700'
        : 'bg-green-50 border border-green-200 text-green-700'
    }`;
  }
}

// Función para realizar llamadas a la API
async function callAPI(endpoint, buttonId) {
  const button = document.getElementById(buttonId);
  let originalText = '';

  if (button) {
    originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cargando...';
    button.disabled = true;
  }

  try {
    const fullURL = `${API_ORIGIN}${endpoint}`;
    console.log(`🔍 Llamando a: ${fullURL}`);

    const response = await axios.get(fullURL, getRequestConfig(endpoint));

    showResult(response.data, false);
    console.log(`✅ API ${endpoint}:`, response.data);

    // Mostrar información adicional
    showConnectionInfo(fullURL, true);

  } catch (error) {
    let errorMsg;

    if (error.code === 'ECONNABORTED') {
      errorMsg = 'Error: Timeout - La solicitud tardó demasiado tiempo';
    } else if (error.response) {
      errorMsg = `Error ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
    } else if (error.request) {
      errorMsg = `Error de conexión: No se pudo conectar a ${API_ORIGIN}`;
    } else {
      errorMsg = `Error: ${error.message}`;
    }

    showResult(errorMsg, true);
    console.error(`❌ Error en API ${endpoint}:`, error);

    showConnectionInfo(`${API_ORIGIN}${endpoint}`, false);

  } finally {
    if (button) {
      button.innerHTML = originalText;
      button.disabled = false;
    }
  }
}

// Función para mostrar información de conexión
function showConnectionInfo(url, success) {
  const infoDiv = document.createElement('div');
  infoDiv.className = `mt-2 p-2 text-xs rounded ${
    success
      ? 'bg-blue-50 text-blue-600 border border-blue-200'
      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
  }`;
  infoDiv.innerHTML = `
        <strong>URL:</strong> ${url}<br>
        <strong>Estado:</strong> ${success ? '✅ Conectado' : '⚠️ Sin conexión'}<br>
        <strong>Timestamp:</strong> ${new Date().toLocaleString()}
    `;

  const resultDiv = document.getElementById('api-result');
  if (resultDiv && !resultDiv.querySelector('.connection-info')) {
    infoDiv.classList.add('connection-info');
    resultDiv.appendChild(infoDiv);
  }
}

// Event listeners cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM cargado');
  console.log(`🌐 API origin configurado: ${API_ORIGIN}`);

  // Botón para probar endpoint de tickets
  const testApiButton = document.getElementById('test-api');
  if (testApiButton) {
    testApiButton.addEventListener('click', () => {
      callAPI('/api/tickets', 'test-api');
    });
  }

  // Botón para probar endpoint de clientes
  const testStatusButton = document.getElementById('test-status');
  if (testStatusButton) {
    testStatusButton.addEventListener('click', () => {
      callAPI('/api/clients', 'test-status');
    });
  }

  // Botón para probar endpoint de estadísticas admin
  const testAdminStatsButton = document.getElementById('test-admin-stats');
  if (testAdminStatsButton) {
    testAdminStatsButton.addEventListener('click', () => {
      callAPI('/api/admin/stats', 'test-admin-stats');
    });
  }

  // Mostrar mensaje inicial
  showResult({
    message: 'Sistema listo para pruebas',
    info: 'Haz clic en cualquier botón para probar la funcionalidad',
    apiOrigin: API_ORIGIN
  }, false);
});

// Funciones globales para debug
window.webappDebug = {
  testAPI: () => callAPI('/api/tickets', null),
  testClients: () => callAPI('/api/clients', null),
  testAdminStats: () => callAPI('/api/admin/stats', null),
  checkConnection: async () => {
    try {
      const response = await axios.get(`${API_ORIGIN}/api/tickets`, getRequestConfig('/api/tickets'));
      console.log('🟢 Conexión OK:', response.data);
      return true;
    } catch (error) {
      console.log('🔴 Conexión falló:', error.message);
      return false;
    }
  },
  info: () => {
    console.log('🔧 WebApp Debug Info');
    console.log(`- API origin: ${API_ORIGIN}`);
    console.log('- Version: 1.0.1');
    console.log('- Build: Static HTML');
  }
};

console.log('🔧 Debug functions available:');
console.log('- webappDebug.testAPI()');
console.log('- webappDebug.testClients()');
console.log('- webappDebug.testAdminStats()');
console.log('- webappDebug.checkConnection()');
console.log('- webappDebug.info()');
