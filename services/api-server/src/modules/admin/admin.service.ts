import { adminRepository } from "./admin.repository";
import { authRepository } from "../auth/auth.repository";
import { authService } from "../auth/auth.service";

export class AdminService {
    async createUser(input: any) {
        const { name, email, password, role } = input;

        const existing = await authRepository.getUserByEmail(email);
        if (existing) throw new Error("Email already exists");

        const hashedPassword = await authService.hashPassword(password);
        const newUser = await authRepository.createUser({ name, email, password: hashedPassword, role, provider: "local" });
        return newUser;
    }

    async promoteSelf(userId: string) {
        return await adminRepository.updateUserRole(userId, "super_admin");
    }

    async getStats() {
        return await adminRepository.getAdminStats();
    }

    async getAllUsers(role?: string, search?: string) {
        return await adminRepository.getAllUsers(role, search);
    }

    async updateUserRole(userId: string, role: string) {
        return await adminRepository.updateUserRole(userId, role);
    }

    async deleteUser(userId: string, currentAdminId: string) {
        if (userId === currentAdminId) throw new Error("Cannot delete your own account");
        await adminRepository.deleteUser(userId);
    }

    async getAllClasses() {
        return await adminRepository.getAllClassesAdmin();
    }

    async deleteClass(classId: string) {
        await adminRepository.deleteClass(classId);
    }

    async getRecentActivity(limit: number) {
        return await adminRepository.getRecentActivity(limit);
    }

    async getFlaggedWellbeing() {
        return await adminRepository.getAllFlaggedWellbeing();
    }
}

export const adminService = new AdminService();
