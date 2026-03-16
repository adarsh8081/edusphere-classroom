import { AIService } from "../ai/ai.service";
import { wellbeingRepository } from "./wellbeing.repository";

export class WellbeingService {
    /**
     * Analyzes student mood trends and flags potential issues.
     */
    static async analyzeTrends(studentId: string): Promise<{ isFlagged: boolean; analysis: string }> {
        try {
            const history = await wellbeingRepository.getStudentWellbeing(studentId, 7);
            if (history.length < 3) {
                return { isFlagged: false, analysis: "Analyzing trends... (needs at least 3 check-ins)" };
            }

            const moodHistory = history.map(h => ({
                date: h.createdAt,
                mood: h.mood,
                score: h.moodScore,
                notes: h.notes || "No notes"
            }));

            const prompt = `
        Analyze the following student emotional check-in history for the past week. 
        Detect if there is a concerning downward trend in wellbeing (e.g., persistent sadness, high stress, or sudden withdrawal).
        
        Mood History:
        ${JSON.stringify(moodHistory, null, 2)}
        
        Return the result strictly as a JSON object:
        {
          "isFlagged": boolean,
          "analysis": "A concise 1-2 sentence summary of the student's emotional state."
        }
      `;

            const response = await AIService.chatWithContext(prompt, [
                "You are an empathetic school counselor AI helper.",
                "Identify emotional patterns in student check-ins.",
                "Flag students who show consistent signs of distress."
            ]);

            const jsonStr = response.replace(/```json|```/g, "").trim();
            const result = JSON.parse(jsonStr);

            return {
                isFlagged: (result.isFlagged === true || result.isFlagged === "true"),
                analysis: result.analysis || "Stable emotional trend."
            };
        } catch (error) {
            console.error("[WellbeingService] Analysis error:", error);
            return { isFlagged: false, analysis: "AI trend analysis unavailable at this moment." };
        }
    }
}
