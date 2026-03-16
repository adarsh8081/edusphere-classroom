import crypto from "crypto";
import { classesRepository } from "./classes.repository";
import { z } from "zod";

export class ClassesService {
    async getClassesForUser(userId: string, role: string) {
        return await classesRepository.getClassesForUser(userId, role);
    }

    async createClass(input: any, teacherId: string) {
        const classCode = crypto.randomBytes(3).toString("hex").toUpperCase();
        return await classesRepository.createClass({ ...input, classCode, teacherId });
    }

    async getClass(classId: string) {
        return await classesRepository.getClass(classId);
    }

    async joinClass(classCode: string, studentId: string) {
        const cls = await classesRepository.getClassByCode(classCode);
        if (!cls) throw new Error("Invalid class code");

        await classesRepository.enrollStudent(cls.id, studentId);
        return cls;
    }

    async updateClass(classId: string, teacherId: string, data: any) {
        return await classesRepository.updateClass(classId, teacherId, data);
    }

    async deleteClass(classId: string, teacherId: string) {
        return await classesRepository.deleteClass(classId, teacherId);
    }

    async getClassRoster(classId: string) {
        return await classesRepository.getClassRoster(classId);
    }
}

export const classesService = new ClassesService();
