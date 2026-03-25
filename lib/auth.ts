import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'sarorders-secret-key-change-in-production-please'
);
const COOKIE = 'sarorders_token';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string | null;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(req?: NextRequest): Promise<JWTPayload | null> {
  try {
    let token: string | undefined;
    if (req) {
      token = req.cookies.get(COOKIE)?.value;
    } else {
      const jar = await cookies();
      token = jar.get(COOKIE)?.value;
    }
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function hashPassword(pw: string): string {
  return bcrypt.hashSync(pw, 10);
}

export function checkPassword(pw: string, hash: string): boolean {
  return bcrypt.compareSync(pw, hash);
}

export const COOKIE_NAME = COOKIE;
