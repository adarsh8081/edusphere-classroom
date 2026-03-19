import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { loginAs, cookieHeader, TEST_USERS } from '../helpers/auth.helper';
import { 
  seedUser, deleteUserByEmail, 
  seedClass, deleteClassById 
} from '../helpers/seed.helper';

describe('Security: Wellbeing IDOR (/api/wellbeing/stats/:classId)', () => {
    let classId: string;
    let teacherId: string;

    const studentData = { ...TEST_USERS.student, email: `wellbeing.idor.s.${TEST_USERS.student.email}`, name: 'Student', role: 'student' as const };
    const teacherData = { ...TEST_USERS.teacher, email: `wellbeing.idor.t.${TEST_USERS.teacher.email}`, name: 'Teacher', role: 'teacher' as const };
    const teacher2Data = { ...TEST_USERS.teacher2, email: `wellbeing.idor.t2.${TEST_USERS.teacher2.email}`, name: 'Teacher 2', role: 'teacher' as const };

    beforeAll(async () => {
        await seedUser(studentData);
        const teacher = await seedUser(teacherData);
        await seedUser(teacher2Data);
        
        teacherId = teacher.id;
        const cls = await seedClass(teacherId);
        classId = cls.id;
    });

    afterAll(async () => {
        await deleteClassById(classId);
        await deleteUserByEmail(studentData.email);
        await deleteUserByEmail(teacherData.email);
        await deleteUserByEmail(teacher2Data.email);
    });

    it('returns 401 for unauthenticated requests', async () => {
        const res = await request(app).get(`/api/wellbeing/stats/${classId}`);
        expect(res.status).toBe(401);
    });

    it('returns 403 for students', async () => {
        const cookie = await loginAs(studentData.email, studentData.password);
        const res = await request(app)
            .get(`/api/wellbeing/stats/${classId}`)
            .set(cookieHeader(cookie));
        
        expect(res.status).toBe(403);
    });

    it('returns 403 for a teacher who does not own the class', async () => {
        const cookie = await loginAs(teacher2Data.email, teacher2Data.password);
        const res = await request(app)
            .get(`/api/wellbeing/stats/${classId}`)
            .set(cookieHeader(cookie));
        
        expect(res.status).toBe(403);
    });

    it('returns 200 for the teacher who owns the class', async () => {
        const cookie = await loginAs(teacherData.email, teacherData.password);
        const res = await request(app)
            .get(`/api/wellbeing/stats/${classId}`)
            .set(cookieHeader(cookie));
        
        expect(res.status).toBe(200);
    });
});
