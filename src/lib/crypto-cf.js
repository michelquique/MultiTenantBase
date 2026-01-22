// Funciones de crypto compatibles con Cloudflare Workers (Web Crypto API)

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const key = await crypto.subtle.importKey(
    'raw', data, { name: 'PBKDF2' }, false, ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key, 256
  );
  
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

export async function comparePassword(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  const key = await crypto.subtle.importKey(
    'raw', data, { name: 'PBKDF2' }, false, ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key, 256
  );
  
  const computedHash = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHash === hashHex;
}

export async function signJWT(payload, secret, expiresIn = '24h') {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (parseInt(expiresIn) * 3600);
  
  const fullPayload = { ...payload, iat: now, exp };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(fullPayload)).replace(/=/g, '');
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC', key, encoder.encode(`${encodedHeader}.${encodedPayload}`)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export async function verifyJWT(token, secret) {
  const [header, payload, signature] = token.split('.');
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  
  const signatureBytes = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  
  const isValid = await crypto.subtle.verify(
    'HMAC', key, signatureBytes, encoder.encode(`${header}.${payload}`)
  );
  
  if (!isValid) throw new Error('Invalid token');
  
  const decoded = JSON.parse(atob(payload));
  if (decoded.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  
  return decoded;
}
