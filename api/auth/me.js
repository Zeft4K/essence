import { verify, json } from '../_lib.js';
export default async function handler(req, res){
  const ses = verify(req);
  if (!ses) return json(res, 401, { user:null });
  json(res, 200, { user: ses });
}
