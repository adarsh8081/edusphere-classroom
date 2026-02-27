import { GoogleGenerativeAI } from "@google/generative-ai";

// ──────────────────────────────────────────────────────────────────────────────
// Multi-key rotation — supports up to 3 free-tier Gemini keys.
// On a 429 / RESOURCE_EXHAUSTED error the request instantly rotates to the
// next key instead of waiting. Exponential backoff only kicks in once all keys
// are exhausted for the current request.
// ──────────────────────────────────────────────────────────────────────────────
const GEMINI_KEYS = [
    process.env.GOOGLE_GEMINI_API_KEY,
    process.env.GOOGLE_GEMINI_API_KEY_2,
    process.env.GOOGLE_GEMINI_API_KEY_3,
].filter(Boolean) as string[];

if (GEMINI_KEYS.length === 0) {
    console.warn("[AI] No Gemini API key configured. AI features will be disabled.");
}

// One client per key, round-robin index tracked per process lifetime.
const genAIClients = GEMINI_KEYS.map(key => new GoogleGenerativeAI(key));
let currentKeyIndex = 0;

function getModel() {
    if (genAIClients.length === 0) return null;
    return genAIClients[currentKeyIndex].getGenerativeModel({ model: "gemini-2.0-flash-lite" });
}

function rotateKey() {
    if (genAIClients.length > 1) {
        currentKeyIndex = (currentKeyIndex + 1) % genAIClients.length;
        console.log(`[AI] Rotating to Gemini key index ${currentKeyIndex}`);
    }
}

// Legacy accessor used below — always returns the active model.
const model = new Proxy({} as ReturnType<GoogleGenerativeAI["getGenerativeModel"]>, {
    get(_target, prop) {
        const m = getModel();
        if (!m) throw new Error("No Gemini API key configured");
        return (m as any)[prop];
    }
});

/**
 * Retry helper with key rotation on 429 errors and exponential backoff
 * once all keys have been tried.
 */
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    const totalAttempts = maxRetries * Math.max(genAIClients.length, 1);
    let backoffAttempt = 0;

    for (let attempt = 0; attempt <= totalAttempts; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            const message = error?.message || String(error);
            const is429 = message.includes("429") || message.includes("Too Many Requests") || message.includes("RESOURCE_EXHAUSTED");

            if (!is429 || attempt === totalAttempts) throw error;

            if (genAIClients.length > 1) {
                // Try rotating to the next key first — instant retry.
                rotateKey();
                console.log(`[AI] Rate limited on key ${currentKeyIndex - 1}, switching to key ${currentKeyIndex}`);
            } else {
                // Only one key: fall back to exponential backoff.
                backoffAttempt++;
                const delayMatch = message.match(/retry in ([\d.]+)/i);
                const baseDelay = delayMatch ? parseFloat(delayMatch[1]) * 1000 : 2000 * Math.pow(2, backoffAttempt);
                const waitMs = Math.min(baseDelay + Math.random() * 1000, 60_000);
                console.log(`[AI] Rate limited, retrying in ${Math.round(waitMs)}ms (attempt ${backoffAttempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, waitMs));
            }
        }
    }
    throw new Error("Unreachable");
}

export class AIService {
    static async analyzeSentiment(text: string): Promise<{ sentiment: string; score: number }> {
        try {
            if (!process.env.GOOGLE_GEMINI_API_KEY) {
                return { sentiment: "neutral", score: 0.5 };
            }

            const prompt = `Analyze the sentiment of the following text and categorize it as "positive", "neutral", or "negative". Also provide a sentiment score between 0 and 1, where 1 is extremely positive and 0 is extremely negative. 
      Return the result strictly as a JSON object: {"sentiment": "string", "score": number}.
      
      Text: "${text}"`;

            const result = await retryWithBackoff(() => model.generateContent(prompt));
            const response = await result.response;
            const jsonStr = response.text().replace(/```json|```/g, "").trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Sentiment analysis error:", error);
            return { sentiment: "neutral", score: 0.5 };
        }
    }

    static async suggestTags(content: string): Promise<string[]> {
        try {
            if (!process.env.GOOGLE_GEMINI_API_KEY) return ["education"];

            const prompt = `Suggest a list of 3-5 relevant educational tags for the following content. Return the result strictly as a JSON array of strings.
      
      Content: "${content.substring(0, 5000)}"`;

            const result = await retryWithBackoff(() => model.generateContent(prompt));
            const response = await result.response;
            const jsonStr = response.text().replace(/```json|```/g, "").trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Tag suggestion error:", error);
            return ["education"];
        }
    }

    static async summarize(content: string): Promise<string> {
        try {
            if (!process.env.GOOGLE_GEMINI_API_KEY) return "No summary available.";

            const prompt = `Summarize the following educational content in 3-5 concise bullet points.
      
      Content: "${content.substring(0, 10000)}"`;

            const result = await retryWithBackoff(() => model.generateContent(prompt));
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error("Summarization error:", error);
            return "Failed to generate summary.";
        }
    }

    static async generateQuiz(content: string): Promise<any[]> {
        try {
            if (!process.env.GOOGLE_GEMINI_API_KEY) return [];

            const prompt = `Generate 5 multiple-choice questions based on the following content. Each question should have 4 options and a correct answer index (0-3). 
      Return the result strictly as a JSON array of objects: [{"question": "text", "options": ["a", "b", "c", "d"], "answerIndex": number}].
      
      Content: "${content.substring(0, 8000)}"`;

            const result = await retryWithBackoff(() => model.generateContent(prompt));
            const response = await result.response;
            const jsonStr = response.text().replace(/```json|```/g, "").trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Quiz generation error:", error);
            return [];
        }
    }

    static async generateLessonPlan(topic: string, grade: string, duration: string, objectives?: string): Promise<string> {
        try {
            if (!process.env.GOOGLE_GEMINI_API_KEY) return "AI service unavailable.";

            const prompt = `Create a structured lesson plan for the following:
      Topic: ${topic}
      Grade Level: ${grade}
      Duration: ${duration}
      Objectives: ${objectives || "Not specified"}
      
      Include: Introduction, Main Activity (with timing), Guided Practice, Independent Practice, and an Exit Ticket. Use Markdown for formatting.`;

            const result = await retryWithBackoff(() => model.generateContent(prompt));
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error("Lesson plan generation error:", error);
            return "Failed to generate lesson plan.";
        }
    }

    static async embedText(text: string): Promise<number[] | null> {
        try {
            if (GEMINI_KEYS.length === 0) return null;
            const embedModel = genAIClients[currentKeyIndex].getGenerativeModel({ model: "gemini-embedding-001" });
            const result = await retryWithBackoff(() =>
                embedModel.embedContent({
                    content: { parts: [{ text }], role: "user" },
                    taskType: "RETRIEVAL_QUERY" as any,
                })
            );
            return result.embedding.values;
        } catch (error) {
            console.error("Embedding generation error:", (error as any).message || error);
            return null;
        }
    }

    static async chatWithContext(question: string, contextChunks: string[], history: { role: string, parts: { text: string }[] }[] = []): Promise<string> {
        try {
            if (!process.env.GOOGLE_GEMINI_API_KEY) return "AI service unavailable. Please configure your API key.";

            // Ensure history has valid format: only include complete pairs and filter empty parts
            const validHistory = history.filter(h =>
                h.parts && h.parts.length > 0 && h.parts.every(p => p.text && p.text.trim())
            );

            const chatSession = model.startChat({
                history: validHistory.length > 0 ? validHistory : undefined,
            });

            const contextText = contextChunks.length > 0
                ? contextChunks.map((chunk, i) => `[Context ${i + 1}]:\n${chunk}`).join("\n\n")
                : "No specific class materials available.";

            const prompt = `You are Edu, a helpful teaching assistant bot for EduSphere Classroom. Answer the student's question helpfully and clearly. Use the context below if relevant.

Context from class materials:
${contextText}

Student question: ${question}`;

            const result = await retryWithBackoff(() => chatSession.sendMessage(prompt));
            return result.response.text();
        } catch (error: any) {
            const message = error?.message || String(error);
            console.error("Bot chat error:", message);

            if (message.includes("429") || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
                return "I'm temporarily unavailable due to high demand. Please try again in a minute or two.";
            }
            return "Sorry, I am having trouble processing your request right now.";
        }
    }
}
