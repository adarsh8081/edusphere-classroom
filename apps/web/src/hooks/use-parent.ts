import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function useParentDashboard() {
    return useQuery({
        queryKey: ["/api/parents/dashboard"],
        queryFn: async () => {
            const res = await fetch("/api/parents/dashboard");
            if (!res.ok) throw new Error("Failed to fetch dashboard");
            return res.json();
        }
    });
}

export function useParentInvitation(token: string) {
    return useQuery({
        queryKey: ["/api/parents/invitation", token],
        queryFn: async () => {
            const res = await fetch(`/api/parents/invitation/${token}`);
            if (!res.ok) throw new Error("Invalid or expired invitation");
            return res.json();
        },
        enabled: !!token
    });
}

export function useInviteParent() {
    return useMutation({
        mutationFn: async (data: { studentId: string; parentEmail: string }) => {
            const res = await apiRequest("POST", "/api/parents/invite", data);
            return res.json();
        }
    });
}

export function useRegisterParent() {
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/parents/register", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        }
    });
}

export function useParentMessages(parentId: string, teacherId: string, studentId: string) {
    return useQuery({
        queryKey: ["/api/parents/messages", parentId, teacherId, studentId],
        queryFn: async () => {
            const res = await fetch(`/api/parents/messages/${parentId}/${teacherId}/${studentId}`);
            if (!res.ok) throw new Error("Failed to fetch messages");
            return res.json();
        },
        enabled: !!parentId && !!teacherId && !!studentId
    });
}

export function useSendParentMessage() {
    return useMutation({
        mutationFn: async (data: { receiverId: string, studentId: string, content: string }) => {
            const res = await apiRequest("POST", "/api/parents/messages", data);
            return res.json();
        },
        onSuccess: (_, variables) => {
            // Invalidate based on the context of the chat
            queryClient.invalidateQueries({ queryKey: ["/api/parents/messages"] });
        }
    });
}
