import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { loginAs, cookieHeader, TEST_USERS } from '../helpers/auth.helper';
import { seedUser, deleteUserByEmail } from '../helpers/seed.helper';

describe('Security: Admin Backdoor (promote-self)', () => {
    const studentData = {
        ...TEST_USERS.student,
        email: `admin.backdoor.${TEST_USERS.student.email}`,
        name: 'Test Student',
        role: 'student' as const
    };

    beforeAll(async () => {
        await seedUser(studentData);
    });

    afterAll(async () => {
        await deleteUserByEmail(studentData.email);
    });

    it('blocks promote-self in production environment', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        
        try {
            const cookie = await loginAs(studentData.email, studentData.password);
            const res = await request(app)
                .post('/api/admin/promote-self')
                .set(cookieHeader(cookie));
            
            // Should be 403 (Forbidden) or 404 (Not Found) in production
            expect([403, 404]).toContain(res.status);
        } finally {
            process.env.NODE_ENV = originalEnv;
        }
    });

    it('blocks promote-self in development without DEV_SECRET header', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        
        try {
            const cookie = await loginAs(studentData.email, studentData.password);
            const res = await request(app)
                .post('/api/admin/promote-self')
                .set(cookieHeader(cookie));
            
            expect(res.status).toBe(403);
            expect(res.body.error).toMatch(/Invalid or missing developer secret/i);
        } finally {
            process.env.NODE_ENV = originalEnv;
        }
    });

    it('blocks promote-self in development with wrong DEV_SECRET', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        
        try {
            const cookie = await loginAs(studentData.email, studentData.password);
            const res = await request(app)
                .post('/api/admin/promote-self')
                .set(cookieHeader(cookie))
                .set('x-dev-secret', 'totally-wrong-secret');
            
            expect(res.status).toBe(403);
            expect(res.body.error).toMatch(/Invalid or missing developer secret/i);
        } finally {
            process.env.NODE_ENV = originalEnv;
        }
    });

    it('allows promote-self in development with correct DEV_SECRET', async () => {
        const originalEnv = process.env.NODE_ENV;
        const originalSecret = process.env.DEV_SECRET;
        process.env.NODE_ENV = 'development';
        process.env.DEV_SECRET = 'test-dev-secret';
        
        try {
            const cookie = await loginAs(studentData.email, studentData.password);
            const res = await request(app)
                .post('/api/admin/promote-self')
                .set(cookieHeader(cookie))
                .set('x-dev-secret', 'test-dev-secret');
            
            expect(res.status).toBe(200);
            expect(res.body.user.role).toBe('super_admin');
        } finally {
            process.env.NODE_ENV = originalEnv;
            process.env.DEV_SECRET = originalSecret;
        }
    });
});
