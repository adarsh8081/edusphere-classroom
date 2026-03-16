import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useGamification() {
    return useQuery({
        queryKey: ["/api/gamification/me"],
        queryFn: async () => {
            const res = await fetch("/api/gamification/me", { credentials: "include" });
            if (!res.ok) return null;
            return res.json();
        },
        staleTime: 30_000,
        refetchInterval: 60_000,
    });
}

export function useLeaderboard(classId: string | null) {
    return useQuery({
        queryKey: ["/api/gamification/leaderboard", classId],
        queryFn: async () => {
            if (!classId) return [];
            const res = await fetch(`/api/gamification/leaderboard/${classId}`, { credentials: "include" });
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!classId,
        staleTime: 30_000,
    });
}

export function useAllBadges() {
    return useQuery({
        queryKey: ["/api/gamification/badges"],
        queryFn: async () => {
            const res = await fetch("/api/gamification/badges", { credentials: "include" });
            if (!res.ok) return [];
            return res.json();
        },
        staleTime: 300_000,
    });
}

export function useAwardXP() {
    const qc = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: { userId: string; amount: number; reason: string; classId?: string }) => {
            const res = await apiRequest("POST", "/api/gamification/xp", data);
            return res.json();
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["/api/gamification/me"] });
            qc.invalidateQueries({ queryKey: ["/api/gamification/leaderboard"] });
            if (data.newBadges?.length) {
                data.newBadges.forEach((b: any) => {
                    toast({ title: `🏅 Badge Earned: ${b.name}!`, description: b.description });
                });
            }
        }
    });
}
