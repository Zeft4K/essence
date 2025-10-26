import { verify, json } from '../_lib.js';

export default async function handler(req, res){
  const ses = verify(req);
  if (!ses) return json(res, 401, { error:'not authenticated' });

  const allowed = ['Onyx Guard', 'Diamond Gear'];
  const hasRole = (ses.roles || []).some(r => allowed.includes(r));
  if (!hasRole) return json(res, 403, { error:'forbidden' });

  json(res, 200, { secret:'✨ onyx intel' });
}
