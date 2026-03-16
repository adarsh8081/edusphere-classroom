import { aiRepository } from "./ai.repository";
import { AIService } from "./ai.service";

export class PersonalTutorService {
    /**
     * Analyzes student performance to identify learning gaps.
     */
    static async analyzeStudentPerformance(studentId: string, classId: string) {
        try {
            const submissions = await aiRepository.getUserSubmissionsForClass(classId, studentId);
            const skills = await aiRepository.getStudentSkills(studentId);
            const activities = await aiRepository.getEngagementHeatmap(classId); // Filter for student later
            const studentActivities = activities.filter(a => a.userId === studentId);

            if (submissions.length === 0) {
                return { message: "Not enough data for analysis." };
            }

            const performanceSummary = submissions.map(s => ({
                assignmentId: s.assignmentId,
                grade: s.grade,
                feedback: s.feedback
            }));

            const prompt = `You are an expert educational AI tutor. Analyze the following student performance data and identify their top 2-3 "learning gaps" (topics they struggle with).
            
            Student Performance: ${JSON.stringify(performanceSummary)}
            Student Skills Progress: ${JSON.stringify(skills)}
            Student Activity Logs: ${JSON.stringify(studentActivities.slice(0, 20))}

            Return the result strictly as a JSON array of objects:
            [{
                "subject": "Topic Name",
                "confidenceLevel": number (0-100),
                "weaknessAnalysis": "A short 1-2 sentence explanation of why they are struggling",
                "suggestedResourceIds": ["vague list of what to look for"]
            }]`;

            const result = await AIService.chatWithContext(prompt, ["Analyze student performance trends."]);
            const jsonStr = result.replace(/```json|```/g, "").trim();
            const gaps = JSON.parse(jsonStr);

            for (const gap of gaps) {
                await aiRepository.updateLearningGap({
                    studentId,
                    classId,
                    subject: gap.subject,
                    confidenceLevel: gap.confidenceLevel,
                    weaknessAnalysis: gap.weaknessAnalysis,
                    suggestedResources: gap.suggestedResourceIds,
                    status: 'active'
                });
            }

            return { success: true, count: gaps.length };
        } catch (error) {
            console.error("[TutorService] Error analyzing performance:", error);
            return { error: "Failed to analyze performance" };
        }
    }

    /**
     * Generates a weekly study plan for a student.
     */
    static async generateStudyPlan(studentId: string, classId: string) {
        try {
            const gaps = await aiRepository.getLearningGaps(studentId, classId);
            const assignments = await aiRepository.getAssignments(classId, studentId);
            const currentWeek = new Date().toISOString().split('T')[0];

            const prompt = `Create a 7-day personalized study plan for a student based on their learning gaps and upcoming assignments.
            
            Learning Gaps: ${JSON.stringify(gaps)}
            Upcoming Assignments: ${JSON.stringify(assignments)}

            Return the result strictly as a JSON object:
            {
                "weekStartDate": "${currentWeek}",
                "schedule": [
                    { "day": "Monday", "focus": "Task name", "resources": ["Read Topic 1", "Practice Quiz"] },
                    ... up to Sunday
                ],
                "aiTip": "A generic encouraging tip for the week"
            }`;

            const result = await AIService.chatWithContext(prompt, ["Generate weekly study plan."]);
            const jsonStr = result.replace(/```json|```/g, "").trim();
            const plan = JSON.parse(jsonStr);

            return await aiRepository.createAIStudyPlan({
                studentId,
                classId,
                weekStartDate: currentWeek,
                planJson: plan,
                isCurrent: true
            });
        } catch (error) {
            console.error("[TutorService] Error generating study plan:", error);
            return { error: "Failed to generate study plan" };
        }
    }

    /**
     * Simplifies complex content (EL12).
     */
    static async explainSimply(text: string) {
        try {
            const prompt = `Simplify the following educational content as if you are explaining it to a 12-year-old. Keep it accurate but use analogies and simple language.
            
            Content: "${text.substring(0, 5000)}"`;

            return await AIService.chatWithContext(prompt, ["Simplify educational content."]);
        } catch (error) {
            console.error("[TutorService] Error simplifying content:", error);
            return "Failed to simplify content.";
        }
    }
}
