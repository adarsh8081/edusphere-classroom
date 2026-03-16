import { authService } from './services/api-server/src/modules/auth/auth.service';
import dotenv from 'dotenv';
dotenv.config();

async function testRegister() {
    try {
        console.log("Testing registration logic...");
        const result = await authService.registerUser({
            name: "Test Auditor",
            email: "test_auditor_" + Date.now() + "@example.com",
            password: "Password123",
            role: "teacher"
        });
        console.log("Registration successful:", result);
    } catch (err) {
        console.error("Registration failed:", err);
    } finally {
        process.exit();
    }
}

testRegister();
