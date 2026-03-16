import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Portfolio, type PortfolioItem } from "@edusphere/types";
import { useToast } from "@/hooks/use-toast";

export function usePortfolio() {
    const { toast } = useToast();

    const portfolioQuery = useQuery<Portfolio & { items: PortfolioItem[] }>({
        queryKey: ["/api/portfolio/me"],
    });

    const updatePortfolioMutation = useMutation({
        mutationFn: async (data: Partial<Portfolio>) => {
            const res = await apiRequest("PATCH", "/api/portfolio/me", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/portfolio/me"] });
            toast({ title: "Portfolio updated", description: "Your visibility settings have been saved." });
        },
    });

    const toggleItemMutation = useMutation({
        mutationFn: async (data: { type: string, referenceId: string, title: string }) => {
            const res = await apiRequest("POST", "/api/portfolio/toggle-item", data);
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/portfolio/me"] });
            toast({
                title: data.action === 'added' ? "Added to Portfolio" : "Removed from Portfolio",
                description: data.action === 'added' ? "This item is now visible on your public profile." : "This item has been hidden."
            });
        },
    });

    return {
        portfolio: portfolioQuery.data,
        isLoading: portfolioQuery.isLoading,
        updatePortfolio: updatePortfolioMutation.mutate,
        toggleItem: toggleItemMutation.mutate,
        isUpdating: updatePortfolioMutation.isPending || toggleItemMutation.isPending,
    };
}

export function usePublicPortfolio(slug: string | undefined) {
    return useQuery<{ portfolio: Portfolio, user: any, items: any[] }>({
        queryKey: [`/api/portfolio/public/${slug}`],
        enabled: !!slug,
    });
}
