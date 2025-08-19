// JavaScript para WebApp - Versión Estática
console.log('🚀 WebApp estática cargada correctamente!');

// Configuración de URLs base para diferentes entornos
const API_CONFIG = {
    // URLs para diferentes entornos - cambiar según necesidad
    production: 'https://3000-ih9v909pz4sfbryy81ft1-6532622b.e2b.dev',
    local: 'http://localhost:3000',
    custom: '' // Agregar tu URL personalizada aquí
};

// Detectar entorno actual
function getCurrentBaseURL() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return API_CONFIG.local;
    } else if (API_CONFIG.custom) {
        return API_CONFIG.custom;
    } else {
        return API_CONFIG.production;
    }
}

const BASE_URL = getCurrentBaseURL();

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
    if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cargando...';
        button.disabled = true;
    }

    try {
        const fullURL = `${BASE_URL}${endpoint}`;
        console.log(`🔍 Llamando a: ${fullURL}`);
        
        const response = await axios.get(fullURL, {
            timeout: 10000 // 10 segundos timeout
        });
        
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
            errorMsg = `Error de conexión: No se pudo conectar a ${BASE_URL}`;
        } else {
            errorMsg = `Error: ${error.message}`;
        }
        
        showResult(errorMsg, true);
        console.error(`❌ Error en API ${endpoint}:`, error);
        
        showConnectionInfo(`${BASE_URL}${endpoint}`, false);
        
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
    console.log(`🌐 Base URL configurada: ${BASE_URL}`);

    // Botón para probar API Hello
    const testApiButton = document.getElementById('test-api');
    if (testApiButton) {
        testApiButton.addEventListener('click', () => {
            callAPI('/api/hello', 'test-api');
        });
    }

    // Botón para probar API Status
    const testStatusButton = document.getElementById('test-status');
    if (testStatusButton) {
        testStatusButton.addEventListener('click', () => {
            callAPI('/api/status', 'test-status');
        });
    }

    // Botón para probar API Local (para desarrollo)
    const testLocalButton = document.getElementById('test-local');
    if (testLocalButton) {
        testLocalButton.addEventListener('click', async () => {
            const button = testLocalButton;
            const originalText = button.innerHTML;
            
            try {
                button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Probando...';
                button.disabled = true;
                
                // Crear un objeto de prueba local
                const localData = {
                    message: 'Prueba local exitosa',
                    timestamp: new Date().toISOString(),
                    environment: 'static',
                    status: 'success',
                    note: 'Esta es una respuesta simulada para pruebas locales'
                };
                
                // Simular delay de red
                await new Promise(resolve => setTimeout(resolve, 800));
                
                showResult(localData, false);
                console.log('✅ Prueba local exitosa:', localData);
                
            } catch (error) {
                showResult('Error en prueba local: ' + error.message, true);
                console.error('❌ Error en prueba local:', error);
            } finally {
                button.innerHTML = originalText;
                button.disabled = false;
            }
        });
    }

    // Mostrar mensaje inicial
    showResult({
        message: 'Sistema listo para pruebas',
        info: 'Haz clic en cualquier botón para probar la funcionalidad',
        baseURL: BASE_URL,
        environment: BASE_URL.includes('localhost') ? 'Local' : 'Cloud'
    }, false);
});

// Funciones globales para debug
window.webappDebug = {
    testAPI: () => callAPI('/api/hello', null),
    testStatus: () => callAPI('/api/status', null),
    checkConnection: async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/status`, { timeout: 5000 });
            console.log('🟢 Conexión OK:', response.data);
            return true;
        } catch (error) {
            console.log('🔴 Conexión falló:', error.message);
            return false;
        }
    },
    setCustomURL: (url) => {
        API_CONFIG.custom = url;
        console.log(`🔧 URL personalizada configurada: ${url}`);
        console.log('Recarga la página para aplicar los cambios');
    },
    info: () => {
        console.log('🔧 WebApp Debug Info');
        console.log(`- Base URL: ${BASE_URL}`);
        console.log('- Framework: Hono');
        console.log('- Platform: Cloudflare Pages');
        console.log('- Version: 1.0.0');
        console.log('- Build: Static HTML');
        console.log('- Environment:', BASE_URL.includes('localhost') ? 'Local' : 'Cloud');
    }
};

console.log('🔧 Debug functions available:');
console.log('- webappDebug.testAPI()');
console.log('- webappDebug.testStatus()'); 
console.log('- webappDebug.checkConnection()');
console.log('- webappDebug.setCustomURL("your-url")');
console.log('- webappDebug.info()');