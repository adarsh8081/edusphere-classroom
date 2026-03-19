import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { loginAs, cookieHeader, TEST_USERS } from '../helpers/auth.helper';
import { seedUser, deleteUserByEmail } from '../helpers/seed.helper';

describe('Security: Assignment Controller Role Guards', () => {
    let studentCookie: string;
    let teacherCookie: string;

    const studentData = { ...TEST_USERS.student, email: `assignment.guard.s.${TEST_USERS.student.email}`, name: 'Student', role: 'student' as const };
    const teacherData = { ...TEST_USERS.teacher, email: `assignment.guard.t.${TEST_USERS.teacher.email}`, name: 'Teacher', role: 'teacher' as const };

    beforeAll(async () => {
        await seedUser(studentData);
        await seedUser(teacherData);
        
        studentCookie = await loginAs(studentData.email, studentData.password);
        teacherCookie = await loginAs(teacherData.email, teacherData.password);
    });

    afterAll(async () => {
        await deleteUserByEmail(studentData.email);
        await deleteUserByEmail(teacherData.email);
    });

    const endpoints = [
        { name: 'createAssignment', method: 'post', url: '/api/classes/1/assignments' },
        { name: 'gradeSubmission', method: 'patch', url: '/api/submissions/1/grade' },
        { name: 'checkPlagiarism', method: 'post', url: '/api/submissions/1/check-plagiarism' },
    ];

    endpoints.forEach((endpoint) => {
        describe(`Endpoint: ${endpoint.url} (${endpoint.name})`, () => {
            it(`blocks student from calling ${endpoint.name}`, async () => {
                const res = await (request(app) as any)
                    [endpoint.method](endpoint.url)
                    .set(cookieHeader(studentCookie))
                    .send({});
                
                expect(res.status).toBe(403);
                expect(res.body.message).toMatch(/Teacher access required/i);
            });

            it(`does not block teacher from calling ${endpoint.name}`, async () => {
                const res = await (request(app) as any)
                    [endpoint.method](endpoint.url)
                    .set(cookieHeader(teacherCookie))
                    .send({});
                
                // Confirm it's NOT 403. 400 or 422 is expected if body is empty, 
                // but any non-403 means the guard passed.
                expect(res.status).not.toBe(403);
            });
        });
    });
});
