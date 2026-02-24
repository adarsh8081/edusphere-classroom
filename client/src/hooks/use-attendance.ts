import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
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
