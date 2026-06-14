const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

interface JWK {
  kid: string;
  n: string;
  e: string;
  kty: string;
  alg: string;
  use: string;
}

interface TokenPayload {
  sub: string;
  email?: string;
  aud: string;
  iss: string;
  exp: number;
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function getPublicKey(kid: string): Promise<CryptoKey | null> {
  const res = await fetch(FIREBASE_JWKS_URL);
  const { keys }: { keys: JWK[] } = await res.json();
  const jwk = keys.find((k) => k.kid === kid);
  if (!jwk) return null;
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

export async function verifyFirebaseToken(
  token: string,
  projectId: string
): Promise<{ uid: string; email?: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts as [string, string, string];

    const header = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(headerB64))
    ) as { kid: string; alg: string };
    if (header.alg !== 'RS256') return null;

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payloadB64))
    ) as TokenPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    if (payload.aud !== projectId) return null;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;

    const publicKey = await getPublicKey(header.kid);
    if (!publicKey) return null;

    const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlDecode(sigB64);

    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signature,
      signingInput
    );
    if (!valid) return null;

    return { uid: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
