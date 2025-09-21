// DELETE /api/historial/:id — solo dueño con PIN y orden ARCHIVADA
export async function onRequestDelete({ params, request, env }) {
  const id = Number(params.id);
  if (!id) return json({ ok:false, error:'bad_id' }, 400);

  let body = {};
  try { body = await request.json(); } catch (_) {}
  const sent   = (body.owner_pin_hash || '').trim().toLowerCase();
  const stored = (env.OWNER_PIN_HASH || '').trim().toLowerCase();

  if (!stored || !sent || !safeEq(stored, sent)) {
    return json({ ok:false, error:'unauthorized' }, 403);
  }

  const row = await env.DB.prepare('SELECT archived FROM reparaciones WHERE id=?')
                          .bind(id).first();
  if (!row)          return json({ ok:false, error:'not_found' }, 404);
  if (!row.archived) return json({ ok:false, error:'not_archived' }, 409);

  await env.DB.batch([
    env.DB.prepare('DELETE FROM historial     WHERE orden_id=?').bind(id),
    env.DB.prepare('DELETE FROM reparaciones  WHERE id=? AND archived=1').bind(id),
  ]);

  return json({ ok:true });
}

function json(obj, status=200){
  return new Response(JSON.stringify(obj), { status, headers:{'content-type':'application/json'} });
}
function safeEq(a,b){
  if (a.length !== b.length) return false;
  let r=0; for (let i=0;i<a.length;i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r===0;
}

