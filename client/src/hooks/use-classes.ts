import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertClass, type Class, type User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useClasses() {
  return useQuery<Class[]>({
    queryKey: [api.classes.list.path],
    queryFn: async () => {
      const res = await fetch(api.classes.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch classes");
      return api.classes.list.responses[200].parse(await res.json());
    },
  });
}

export function useClass(classId: string) {
  return useQuery<Class>({
    queryKey: [api.classes.get.path, classId],
    queryFn: async () => {
      const url = buildUrl(api.classes.get.path, { classId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch class");
      return api.classes.get.responses[200].parse(await res.json());
    },
    enabled: !!classId,
  });
}

export function useClassRoster(classId: string) {
  return useQuery<User[]>({
    queryKey: [api.classes.roster.path, classId],
    queryFn: async () => {
      const url = buildUrl(api.classes.roster.path, { classId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch roster");
      return api.classes.roster.responses[200].parse(await res.json());
    },
    enabled: !!classId,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertClass) => {
      const res = await fetch(api.classes.create.path, {
        method: api.classes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create class");
      return api.classes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.classes.list.path] });
      toast({ title: "Class created successfully!" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  });
}

export function useJoinClass() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (classCode: string) => {
      const res = await fetch(api.classes.join.path, {
        method: api.classes.join.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classCode }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to join class");
      }
      return api.classes.join.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.classes.list.path] });
      toast({ title: "Joined class successfully!" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  });
}
