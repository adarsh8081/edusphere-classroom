import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useAtRiskStudents(classId: string) {
    return useQuery({
        queryKey: [api.analytics.atRisk.path, classId],
        queryFn: async () => {
            const url = buildUrl(api.analytics.atRisk.path, { classId });
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch at-risk students");
            return res.json();
        },
        enabled: !!classId,
    });
}

export function useRunRiskAssessment() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (classId: string) => {
            const url = buildUrl(api.analytics.riskAssessment.path, { classId });
            const res = await fetch(url, { method: 'POST' });
            if (!res.ok) throw new Error("Failed to run risk assessment");
            return res.json();
        },
        onSuccess: (_, classId) => {
            queryClient.invalidateQueries({ queryKey: [api.analytics.atRisk.path, classId] });
            toast({ title: "Assessment complete", description: "Student risk scores have been updated." });
        }
    });
}
