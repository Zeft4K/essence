import { clearCookie } from '../_lib.js';
export default async function handler(req, res){
  clearCookie(res);
  res.writeHead(302, { Location: '/' });
  res.end();
}
