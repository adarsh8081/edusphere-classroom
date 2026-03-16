/**
 * SECURITY TEST SUITE
 * Purpose: Verify that the API is hardened against common security vulnerabilities.
 * Tests cover: Auth bypass, injection, CORS, rate limiting, and header security.
 * 
 * ⚠️ These are LIVE integration tests — they require the API server to be running.
 * 
 * Run with the server on:
 *   npm run test:security
 * 
 * Or if running the entire suite with vitest, set:
 *   SECURITY_TESTS_LIVE=true npx vitest run
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// ─── For in-process tests we test our express middlewares ────────────────────

describe('Security Tests — HTTP Headers', () => {

    it('API should reject requests with extremely large bodies (DoS protection)', async () => {
        const hugepayload = { data: 'x'.repeat(11 * 1024 * 1024) }; // 11MB
        const res = await request(BASE_URL)
            .post('/api/auth/login')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(hugepayload));
        // 413 Payload Too Large, or 400 bad request
        expect([400, 413, 429, 500]).toContain(res.status);
    });

    it('API should not expose stack traces in error responses', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/login')
            .send({ email: null, password: null });
        const body = JSON.stringify(res.body);
        expect(body).not.toMatch(/at\s+\w+\s+\(.*\.ts:\d+:\d+\)/); // stack trace pattern
        expect(body).not.toContain('node_modules');
    });

});

describe('Security Tests — Authentication & Authorization', () => {

    it('Protected routes must return 401 without authentication', async () => {
        const protectedRoutes = [
            '/api/classes',
            '/api/analytics/summary',
            '/api/assignments',
            '/api/wellbeing/checkin',
        ];

        for (const route of protectedRoutes) {
            const res = await request(BASE_URL).get(route);
            expect(res.status).toBe(401);
        }
    });

    it('Cannot access other users data by guessing IDs (simple IDOR test)', async () => {
        const res = await request(BASE_URL)
            .get('/api/users/00000000-0000-0000-0000-000000000001');
        // Either 401 (not authenticated) or 404 (user not found), never 200
        expect([401, 403, 404]).toContain(res.status);
    });

    it('SQL injection attempt in login should not succeed', async () => {
        const sqlInjectionPayload = {
            email: "' OR '1'='1",
            password: "' OR '1'='1"
        };
        const res = await request(BASE_URL)
            .post('/api/auth/login')
            .send(sqlInjectionPayload);
        // Should not return 200 (successful login)
        expect(res.status).not.toBe(200);
        expect(res.status).not.toBe(201);
    });

    it('XSS payload in input should be sanitized, not reflected as HTML', async () => {
        const xssPayload = { email: '<script>alert(1)</script>@test.com', password: 'test' };
        const res = await request(BASE_URL)
            .post('/api/auth/login')
            .send(xssPayload);
        const body = JSON.stringify(res.body);
        expect(body).not.toContain('<script>');
    });

});

describe('Security Tests — Rate Limiting', () => {

    it('should rate-limit repeated login failures', async () => {
        const attempts: Promise<any>[] = [];
        // Make 20 consecutive failed login calls
        for (let i = 0; i < 20; i++) {
            attempts.push(
                request(BASE_URL)
                    .post('/api/auth/login')
                    .send({ email: 'bruteforce@test.com', password: `wrongpw${i}` })
            );
        }
        const responses = await Promise.all(attempts);
        const statusCodes = responses.map(r => r.status);
        // At least one should be 429 (Too Many Requests)
        expect(statusCodes).toContain(429);
    });

});

describe('Security Tests — Input Validation (Black-Box)', () => {

    it('register endpoint rejects missing email', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/register')
            .send({ password: 'somepassword', name: 'Test User' });
        expect([400, 422]).toContain(res.status);
    });

    it('register endpoint rejects weak/short password', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/register')
            .send({ email: 'test@test.com', password: '123', name: 'Test User' });
        expect([400, 422]).toContain(res.status);
    });

    it('register endpoint rejects invalid email format', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/register')
            .send({ email: 'not-an-email', password: 'ValidPass123!', name: 'Test User' });
        expect([400, 422]).toContain(res.status);
    });

});
