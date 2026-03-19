import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { deleteUserByEmail } from '../helpers/seed.helper';

describe('Security: Role Injection at Registration', () => {
    const testEmails: string[] = [];

    afterAll(async () => {
        for (const email of testEmails) {
            await deleteUserByEmail(email);
        }
    });

    it('strips role:teacher and assigns student on registration', async () => {
        const email = `test.teacher-inject.${Date.now()}@edusphere.test`;
        testEmails.push(email);

        const res = await request(app)
            .post('/api/register')
            .send({
                name: 'Injected Teacher',
                email,
                password: 'TestPass123!',
                role: 'teacher'
            });
        
        expect(res.status).toBe(201);
        expect(res.body.role).toBe('student');
    });

    it('strips role:super_admin and assigns student on registration', async () => {
        const email = `test.admin-inject.${Date.now()}@edusphere.test`;
        testEmails.push(email);

        const res = await request(app)
            .post('/api/register')
            .send({
                name: 'Injected Admin',
                email,
                password: 'TestPass123!',
                role: 'super_admin'
            });
        
        expect(res.status).toBe(201);
        expect(res.body.role).toBe('student');
    });

    it('assigns student role when no role field is sent', async () => {
        const email = `test.no-role.${Date.now()}@edusphere.test`;
        testEmails.push(email);

        const res = await request(app)
            .post('/api/register')
            .send({
                name: 'No Role User',
                email,
                password: 'TestPass123!'
            });
        
        expect(res.status).toBe(201);
        expect(res.body.role).toBe('student');
    });
});
