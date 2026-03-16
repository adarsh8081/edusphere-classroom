import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@edusphere/api-client";
import { useToast } from "@/hooks/use-toast";

export function useAttendance(classId: string, date?: string) {
  return useQuery({
    queryKey: [api.attendance.list.path, classId, date],
    queryFn: async () => {
      let url = buildUrl(api.attendance.list.path, { classId });
      if (date) {
        url += `?date=${encodeURIComponent(date)}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return api.attendance.list.responses[200].parse(await res.json());
    },
    enabled: !!classId,
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ classId, date, records }: { classId: string; date: string; records: { studentId: string; status: 'present' | 'absent' | 'late' }[] }) => {
      const url = buildUrl(api.attendance.mark.path, { classId });
      const res = await fetch(url, {
        method: api.attendance.mark.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, records }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save attendance");
      return api.attendance.mark.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.attendance.list.path, variables.classId, variables.date] });
      toast({ title: "Attendance saved successfully" });
    },
  });
}
export function useActiveSession(classId: string) {
  return useQuery({
    queryKey: ["/api/classes", classId, "attendance", "active"],
    queryFn: async () => {
      const res = await fetch(`/api/classes/${classId}/attendance/active`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!classId,
    refetchInterval: 10_000, // Poll for live sessions
  });
}

export function useStartAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (classId: string) => {
      const res = await fetch("/api/attendance/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to start session");
      return res.json();
    },
    onSuccess: (_, classId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", classId, "attendance", "active"] });
      toast({ title: "🚀 Attendance Started!", description: "QR code is now live for 10 minutes." });
    },
  });
}

export function useScanAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { qrCode: string; latitude?: number; longitude?: number }) => {
      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to mark attendance");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/me"] }); // Update XP
      toast({
        title: "✅ Check-in Success!",
        description: `You've been marked present. Earned ${data.xpAwarded} XP!`
      });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Check-in Failed", description: error.message });
    }
  });
}

export function useSessionStats(sessionId: string | null) {
  return useQuery({
    queryKey: ["/api/attendance/session", sessionId, "stats"],
    queryFn: async () => {
      if (!sessionId) return null;
      const res = await fetch(`/api/attendance/session/${sessionId}/stats`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!sessionId,
    refetchInterval: 5000, // Frequent updates for live roster
  });
}
