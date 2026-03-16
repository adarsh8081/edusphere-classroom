import { usersRepository } from "./users.repository";
import { classesService } from "../classes/classes.service";

export class UsersService {
    async searchUsers(query: string, currentUserId: string, currentUserRole: string) {
        const q = query.toLowerCase().trim();
        if (!q || q.length < 2) return [];

        const userClasses = await classesService.getClassesForUser(currentUserId, currentUserRole);
        const seenIds = new Set<string>([currentUserId]);
        const results: any[] = [];

        for (const cls of userClasses) {
            const roster = await classesService.getClassRoster(cls.id);
            for (const member of roster) {
                if (!seenIds.has(member.id) && (member.name.toLowerCase().includes(q) || member.email.toLowerCase().includes(q))) {
                    seenIds.add(member.id);
                    results.push({ id: member.id, name: member.name, email: member.email, role: member.role });
                }
            }
        }
        return results.slice(0, 10);
    }

    async getProfile(userId: string) {
        const profile = await usersRepository.getUser(userId);
        if (!profile) return null;

        const { password: _, ...safeProfile } = profile as any;
        return safeProfile;
    }

    async updateProfile(userId: string, data: any) {
        const updated = await usersRepository.updateUserProfile(userId, data);
        const { password: _, ...safeUser } = updated as any;
        return safeUser;
    }
}

export const usersService = new UsersService();
