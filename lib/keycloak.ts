import { decodeJwt } from 'jose';

function cfg() {
  return {
    url:          process.env.KEYCLOAK_URL          || '',
    realm:        process.env.KEYCLOAK_REALM         || '',
    clientId:     process.env.KEYCLOAK_CLIENT_ID     || '',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
    appUrl:       process.env.NEXTAUTH_URL            || 'http://localhost:3000',
  };
}

export function isKeycloakEnabled(): boolean {
  const c = cfg();
  return !!(c.url && c.realm && c.clientId && c.clientSecret);
}

function base(url: string, realm: string) {
  return `${url}/realms/${realm}/protocol/openid-connect`;
}

export function buildAuthUrl(state: string): string {
  const c = cfg();
  const params = new URLSearchParams({
    client_id:    c.clientId,
    response_type: 'code',
    scope:        'openid email profile',
    redirect_uri: `${c.appUrl}/api/auth/keycloak/callback`,
    state,
  });
  return `${base(c.url, c.realm)}/auth?${params}`;
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  id_token: string;
  refresh_token?: string;
}> {
  const c = cfg();
  const res = await fetch(`${base(c.url, c.realm)}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     c.clientId,
      client_secret: c.clientSecret,
      code,
      redirect_uri:  `${c.appUrl}/api/auth/keycloak/callback`,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Keycloak token exchange failed: ${err}`);
  }
  return res.json();
}

export interface KCClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
}

export function parseIdToken(idToken: string): KCClaims {
  return decodeJwt(idToken) as KCClaims;
}

export function buildKeycloakLogoutUrl(postLogoutUri?: string): string {
  const c = cfg();
  const params = new URLSearchParams({ client_id: c.clientId });
  if (postLogoutUri) params.set('post_logout_redirect_uri', postLogoutUri);
  return `${base(c.url, c.realm)}/logout?${params}`;
}
