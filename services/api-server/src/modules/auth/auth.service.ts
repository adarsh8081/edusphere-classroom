import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { User, InsertUser } from "@edusphere/types";
import { authRepository } from "./auth.repository";
import { log } from "../../core/logger/index";

const scryptAsync = promisify(scrypt);

export class AuthService {
    async hashPassword(password: string): Promise<string> {
        const salt = randomBytes(16).toString("hex");
        const buf = (await scryptAsync(password, salt, 64)) as Buffer;
        return `${buf.toString("hex")}.${salt}`;
    }

    async comparePasswords(supplied: string, stored: string): Promise<boolean> {
        const [hashed, salt] = stored.split(".");
        const hashedBuf = Buffer.from(hashed, "hex");
        const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
        return timingSafeEqual(hashedBuf, suppliedBuf);
    }

    async findOrCreateOAuthUser(provider: string, providerId: string, email: string, name: string, avatarUrl?: string): Promise<User> {
        let user = await authRepository.getUserByProvider(provider, providerId);
        if (user) return user;

        if (email) {
            user = await authRepository.getUserByEmail(email);
            if (user) return user;
        }

        return await authRepository.createOAuthUser({
            email: email || `${provider}_${providerId}@oauth.local`,
            name: name || "User",
            role: "student",
            provider,
            providerId,
            avatarUrl,
        });
    }

    async registerUser(data: any): Promise<User> {
        const existing = await authRepository.getUserByEmail(data.email);
        if (existing) throw new Error("Email already exists");

        const hashedPassword = await this.hashPassword(data.password);

        // Only include fields that exist in the users table
        const userData = {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: data.role || "student"
        };

        return await authRepository.createUser(userData as any);
    }
}

export const authService = new AuthService();
