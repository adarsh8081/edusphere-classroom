import { db } from "../../core/database/db";
import { users } from "@edusphere/types";
import { eq } from "drizzle-orm";

export class UsersRepository {
    async getUser(id: string) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }

    async updateUserProfile(id: string, data: Partial<typeof users.$inferInsert>) {
        const [updated] = await db.update(users)
            .set(data)
            .where(eq(users.id, id))
            .returning();
        return updated;
    }
}

export const usersRepository = new UsersRepository();
