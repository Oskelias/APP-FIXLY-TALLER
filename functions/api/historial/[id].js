/**
 * DELETE /api/historial/:id
 * Solo permite borrar si:
 * 1. Se envía el header X-Master-Key con la clave correcta
 * 2. La orden está archivada (archived=1)
 *
 * La clave maestra se configura en la variable de entorno MASTER_KEY
 */

export async function onRequestDelete({ params, request, env }) {
  const id = Number(params.id);
  if (!id) {
    return json({ ok: false, error: 'bad_id' }, 400);
  }

  // Leer X-Master-Key del header
  const sentKey = (request.headers.get('X-Master-Key') || '').trim();
  const storedKey = (env.MASTER_KEY || '').trim();

  // Validar que existe la clave maestra configurada
  if (!storedKey) {
    console.error('MASTER_KEY no configurada en environment');
    return json({ ok: false, error: 'server_config_error' }, 500);
  }

  // Validar clave
  if (!sentKey || !safeEq(storedKey, sentKey)) {
    return json({ ok: false, error: 'unauthorized' }, 403);
  }

  // Verificar que la orden existe y está archivada
  const row = await env.DB.prepare('SELECT archived FROM reparaciones WHERE id=?')
    .bind(id)
    .first();

  if (!row) {
    return json({ ok: false, error: 'not_found' }, 404);
  }

  if (!row.archived) {
    return json({ ok: false, error: 'not_archived' }, 409);
  }

  // Borrar historial y reparación
  await env.DB.batch([
    env.DB.prepare('DELETE FROM historial WHERE orden_id=?').bind(id),
    env.DB.prepare('DELETE FROM reparaciones WHERE id=? AND archived=1').bind(id),
  ]);

  return json({ ok: true });
}

// Helper para respuesta JSON
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Master-Key, X-Tenant-Id, X-Location-Id'
    }
  });
}

// Comparación segura contra timing attacks
function safeEq(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Handler para OPTIONS (CORS preflight)
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Master-Key, X-Tenant-Id, X-Location-Id',
      'Access-Control-Max-Age': '86400'
    }
  });
}
