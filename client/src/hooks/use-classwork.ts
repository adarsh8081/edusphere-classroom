import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTopic, type InsertAssignment, type InsertSubmission } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useTopics(classId: string) {
  return useQuery({
    queryKey: [api.topics.list.path, classId],
    queryFn: async () => {
      const url = buildUrl(api.topics.list.path, { classId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch topics");
      return api.topics.list.responses[200].parse(await res.json());
    },
    enabled: !!classId,
  });
}

export function useAssignments(classId: string) {
  return useQuery({
    queryKey: [api.assignments.list.path, classId],
    queryFn: async () => {
      const url = buildUrl(api.assignments.list.path, { classId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return api.assignments.list.responses[200].parse(await res.json());
    },
    enabled: !!classId,
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ classId, data }: { classId: string; data: InsertTopic }) => {
      const url = buildUrl(api.topics.create.path, { classId });
      const res = await fetch(url, {
        method: api.topics.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create topic");
      return api.topics.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.topics.list.path, variables.classId] });
      toast({ title: "Topic created" });
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ classId, data }: { classId: string; data: InsertAssignment & { dueDate?: string } }) => {
      const url = buildUrl(api.assignments.create.path, { classId });
      const res = await fetch(url, {
        method: api.assignments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create assignment");
      return api.assignments.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.assignments.list.path, variables.classId] });
      toast({ title: "Assignment created" });
    },
  });
}

export function useSubmissions(assignmentId: string) {
  return useQuery({
    queryKey: [api.submissions.list.path, assignmentId],
    queryFn: async () => {
      const url = buildUrl(api.submissions.list.path, { assignmentId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return api.submissions.list.responses[200].parse(await res.json());
    },
    enabled: !!assignmentId,
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ assignmentId, data }: { assignmentId: string; data: InsertSubmission }) => {
      const url = buildUrl(api.submissions.create.path, { assignmentId });
      const res = await fetch(url, {
        method: api.submissions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit assignment");
      return api.submissions.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.submissions.list.path, variables.assignmentId] });
      toast({ title: "Work submitted successfully!" });
    },
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ submissionId, assignmentId, grade, feedback }: { submissionId: string; assignmentId: string; grade: number; feedback?: string }) => {
      const url = buildUrl(api.submissions.grade.path, { submissionId });
      const res = await fetch(url, {
        method: api.submissions.grade.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, feedback }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save grade");
      return api.submissions.grade.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.submissions.list.path, variables.assignmentId] });
      toast({ title: "Grade saved" });
    },
  });
}
