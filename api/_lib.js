import jwt from 'jsonwebtoken';

export const COOKIE = process.env.COOKIE_NAME || 'te_sess';
const SEC = process.env.JWT_SECRET;

export function sendCookie(res, payload){
  const token = jwt.sign(payload, SEC, { expiresIn: '7d' });
  const isProd = process.env.NODE_ENV === 'production';
  const cookie = [
    `${COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    isProd ? 'Secure' : '',
    'Max-Age=604800'
  ].filter(Boolean).join('; ');
  res.setHeader('Set-Cookie', cookie);
}

export function clearCookie(res){
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
}

export function parseCookie(req){
  const h = req.headers.cookie || '';
  const m = h.match(new RegExp(`${COOKIE}=([^;]+)`));
  return m ? m[1] : null;
}

export function verify(req){
  try{
    const token = parseCookie(req);
    if (!token) return null;
    return jwt.verify(token, SEC);
  } catch { return null; }
}

export function json(res, code, obj){
  res.statusCode = code;
  res.setHeader('Content-Type','application/json');
  res.end(JSON.stringify(obj));
}
