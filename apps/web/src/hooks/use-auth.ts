import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@edusphere/api-client";
import { type InsertUser, type User } from "@edusphere/types";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.auth.me.responses[200].parse(await res.json());
    },
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof api.auth.login.input>) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

      try {
        const res = await fetch(api.auth.login.path, {
          method: api.auth.login.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (!res.ok) {
          if (res.status === 401) throw new Error("Invalid email or password");
          throw new Error("Failed to login");
        }
        return api.auth.login.responses[200].parse(await res.json());
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error("Request timed out. The server is taking too long. Please try again.");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.auth.me.path], data);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Login failed", description: err.message });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

      try {
        const res = await fetch(api.auth.register.path, {
          method: api.auth.register.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
          credentials: "include",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Registration failed");
        }
        return api.auth.register.responses[201].parse(await res.json());
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error("Request timed out. The server is taking too long. Please try again.");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.auth.me.path], data);
      toast({ title: "Account created!", description: "Welcome to EduSphere." });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Registration failed", description: err.message });
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to logout");
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      queryClient.clear();
      toast({ title: "Logged out", description: "You have been logged out successfully." });
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
