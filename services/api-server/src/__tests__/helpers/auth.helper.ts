import request from 'supertest';
import { app } from '../../index'; // Exported from index.ts

/**
 * Logs in with given credentials, returns the session cookie string
 */
export async function loginAs(
  email: string, 
  password: string
): Promise<string> {
  const res = await request(app)
    .post('/api/login')
    .send({ email, password });
  
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email} (status ${res.status})`);
  }
  
  const cookies = res.headers['set-cookie'];
  if (!cookies) throw new Error(`Login failed for ${email} (no cookies)`);
  return Array.isArray(cookies) ? cookies.join('; ') : cookies;
}

/**
 * Returns supertest .set() compatible cookie header
 */
export function cookieHeader(cookie: string) {
  return { Cookie: cookie };
}

/**
 * Seed users for testing — returns { email, password } for each role
 */
export const TEST_USERS = {
  student: {
    email: 'test.student@edusphere.test',
    password: 'TestPass123!',
  },
  teacher: {
    email: 'test.teacher@edusphere.test',
    password: 'TestPass123!',
  },
  teacher2: {
    email: 'test.teacher2@edusphere.test',
    password: 'TestPass123!',
  },
};
