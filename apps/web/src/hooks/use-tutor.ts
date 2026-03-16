import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LearningGap, AIStudyPlan } from "@edusphere/types";

export function useTutor(classId?: string) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const recommendations = useQuery<LearningGap[]>({
        queryKey: ["/api/tutor/me/recommendations", classId],
        enabled: !!classId,
    });

    const studyPlan = useQuery<AIStudyPlan>({
        queryKey: ["/api/tutor/me/study-plan", classId],
        enabled: !!classId,
    });

    const analyzePerformance = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", `/api/tutor/analyze/${classId}`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tutor/me/recommendations", classId] });
            toast({ title: "Analysis complete", description: "Your learning gaps have been updated." });
        },
        onError: (error: Error) => {
            toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
        },
    });

    const explainSimply = useMutation({
        mutationFn: async (text: string) => {
            const res = await apiRequest("POST", "/api/tutor/explain", { text });
            const data = await res.json();
            return data.explanation as string;
        },
    });

    return {
        recommendations,
        studyPlan,
        analyzePerformance,
        explainSimply,
    };
}
