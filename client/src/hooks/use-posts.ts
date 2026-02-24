import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertPost, type InsertComment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function usePosts(classId: string) {
  return useQuery({
    queryKey: [api.posts.list.path, classId],
    queryFn: async () => {
      const url = buildUrl(api.posts.list.path, { classId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch posts");
      return api.posts.list.responses[200].parse(await res.json());
    },
    enabled: !!classId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ classId, data }: { classId: string; data: InsertPost }) => {
      const url = buildUrl(api.posts.create.path, { classId });
      const res = await fetch(url, {
        method: api.posts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create post");
      return api.posts.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path, variables.classId] });
      toast({ title: "Posted successfully" });
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, classId, data }: { postId: string; classId: string; data: InsertComment }) => {
      const url = buildUrl(api.comments.create.path, { postId });
      const res = await fetch(url, {
        method: api.comments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return api.comments.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path, variables.classId] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  });
}
