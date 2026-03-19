import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "../../core/database/db";
import { users, classes, type User } from "@edusphere/types";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Creates a test user directly in the DB with a hashed password
 */
export async function seedUser(data: {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'teacher' | 'super_admin';
}): Promise<any> {
  const hashedPassword = await hashPassword(data.password);
  const [user] = await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: data.role,
  }).returning();
  return user;
}

/**
 * Deletes a user by email
 */
export async function deleteUserByEmail(email: string): Promise<void> {
  await db.delete(users).where(eq(users.email, email));
}

/**
 * Creates a test class owned by a given teacherId
 */
export async function seedClass(teacherId: string): Promise<any> {
  const [cls] = await db.insert(classes).values({
    name: "Test Class",
    description: "For security regression tests",
    teacherId,
    classCode: `TEST-${Math.random().toString(36).substring(7).toUpperCase()}`,
  } as any).returning();
  return cls;
}

/**
 * Deletes a class by id
 */
export async function deleteClassById(id: string): Promise<void> {
  await db.delete(classes).where(eq(classes.id, id));
}
