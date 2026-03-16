import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@edusphere/api-client";
import { type InsertTopic, type InsertAssignment, type InsertSubmission } from "@edusphere/types";
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
    mutationFn: async ({ classId, data }: { classId: string; data: any }) => {
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
    mutationFn: async ({ assignmentId, data }: { assignmentId: string; data: any }) => {
      const url = buildUrl(api.submissions.create.path, { assignmentId });
      const res = await fetch(url, {
        method: api.submissions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, assignmentId }),
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
export function useResources(topicId: string) {
  return useQuery({
    queryKey: [api.resources.list.path, topicId],
    queryFn: async () => {
      const url = buildUrl(api.resources.list.path, { topicId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch resources");
      return api.resources.list.responses[200].parse(await res.json());
    },
    enabled: !!topicId,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ topicId, data }: { topicId: string; data: any }) => {
      const url = buildUrl(api.resources.create.path, { topicId });
      const res = await fetch(url, {
        method: api.resources.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create resource");
      return api.resources.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.resources.list.path, variables.topicId] });
      toast({ title: "Material added" });
    },
  });
}

export function useUpdateResourceVersion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ resourceId, fileUrl, fileType }: { resourceId: string, fileUrl: string, fileType?: string }) => {
      const res = await fetch(`/api/resources/${resourceId}/version`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl, fileType }),
      });
      if (!res.ok) throw new Error("Failed to update resource version");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.resources.list.path] });
      toast({ title: "Version updated", description: "The resource file has been updated, and the old version was archived." });
    },
  });
}

export function useSummarize() {
  return useMutation({
    mutationFn: async (data: { resourceId?: string, text: string }) => {
      const res = await fetch(api.ai.summarize.path, {
        method: api.ai.summarize.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to summarize");
      return res.json();
    }
  });
}

export function useSuggestTags() {
  return useMutation({
    mutationFn: async (data: { text: string }) => {
      const res = await fetch(api.ai.suggestTags.path, {
        method: api.ai.suggestTags.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to suggest tags");
      return res.json();
    }
  });
}

export function useRecommendations(resourceId: string) {
  return useQuery({
    queryKey: [api.resources.recommendations.path, resourceId],
    queryFn: async () => {
      const url = buildUrl(api.resources.recommendations.path, { resourceId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      return api.resources.recommendations.responses[200].parse(await res.json());
    },
    enabled: !!resourceId,
  });
}

export function useGenerateLessonPlan() {
  return useMutation({
    mutationFn: async (data: { topic: string, grade: string, duration: string, objectives: string }) => {
      const res = await fetch(api.ai.lessonPlan.path, {
        method: api.ai.lessonPlan.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to generate lesson plan");
      return res.json();
    }
  });
}

export function useGenerateQuiz() {
  return useMutation({
    mutationFn: async (data: { topic: string }) => {
      const res = await fetch(api.ai.generateQuiz.path, {
        method: api.ai.generateQuiz.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to generate quiz");
      return res.json();
    }
  });
}

export function useAssignmentReviews(assignmentId: string) {
  return useQuery({
    queryKey: ["/api/assignments", assignmentId, "reviews"],
    queryFn: async () => {
      const res = await fetch(`/api/assignments/${assignmentId}/reviews`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
    enabled: !!assignmentId,
  });
}

export function useModerateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ reviewId, data }: { reviewId: string; data: { score: string; isFlagged: boolean } }) => {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to moderate review");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: "Review Moderated", description: "The peer review has been updated." });
    },
  });
}

export function useCheckPlagiarism() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ submissionId, assignmentId }: { submissionId: string; assignmentId: string }) => {
      const url = buildUrl(api.submissions.checkPlagiarism.path, { submissionId });
      const res = await fetch(url, {
        method: api.submissions.checkPlagiarism.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to check plagiarism");
      return api.submissions.checkPlagiarism.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.submissions.list.path, variables.assignmentId] });
      toast({ title: "Analysis Complete", description: "Originality report is ready." });
    },
  });
}
