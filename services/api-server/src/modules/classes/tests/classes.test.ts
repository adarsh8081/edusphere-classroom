import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { classesController } from '../classes.controller';
import { classesService } from '../classes.service';

// Mock service
vi.mock('../classes.service', () => ({
    classesService: {
        createClass: vi.fn(),
        getClassesForUser: vi.fn(),
    }
}));

const app = express();
app.use(express.json());

// Mock auth middleware for testing
const mockAuth = (req: any, res: any, next: any) => {
    req.user = { id: 'teacher1', role: 'teacher' };
    next();
};

app.post('/api/classes', mockAuth, classesController.create);
app.get('/api/classes', mockAuth, classesController.list);

describe('Classes Controller Integration', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('create should return 201 when successful', async () => {
        vi.mocked(classesService.createClass).mockResolvedValue({ id: 'class1', name: 'Math 101', teacherId: 'teacher1', joinCode: 'XYZ123' } as any);

        const res = await request(app).post('/api/classes').send({
            name: 'Math 101',
            description: 'Intro to Math'
        });

        expect(res.status).toBe(201);
        expect(res.body.joinCode).toBe('XYZ123');
    });

    it('list should return a list of user classes', async () => {
        vi.mocked(classesService.getClassesForUser).mockResolvedValue([
            { class: { id: 'class1', name: 'Math 101' }, role: 'teacher' } as any
        ]);

        const res = await request(app).get('/api/classes');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].class.name).toBe('Math 101');
    });

});
