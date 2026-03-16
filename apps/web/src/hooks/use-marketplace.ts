import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@edusphere/api-client";
import { type MarketplaceItem, type MarketplacePurchase } from "@edusphere/types";
import { useToast } from "@/hooks/use-toast";

export function useMarketplace(filters?: { category?: string, sellerId?: string }) {
    return useQuery<MarketplaceItem[]>({
        queryKey: [api.marketplace.list.path, filters],
        queryFn: async () => {
            const url = new URL(window.location.origin + api.marketplace.list.path);
            if (filters?.category) url.searchParams.append('category', filters.category);
            if (filters?.sellerId) url.searchParams.append('sellerId', filters.sellerId);

            const res = await fetch(url.toString());
            if (!res.ok) throw new Error("Failed to fetch marketplace items");
            return res.json();
        }
    });
}

export function useMarketplaceItem(itemId: string) {
    return useQuery<MarketplaceItem>({
        queryKey: [api.marketplace.get.path, itemId],
        queryFn: async () => {
            const res = await fetch(buildUrl(api.marketplace.get.path, { itemId }));
            if (!res.ok) throw new Error("Item not found");
            return res.json();
        },
        enabled: !!itemId
    });
}

export function useCreateMarketplaceItem() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(api.marketplace.create.path, {
                method: api.marketplace.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to create listing");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.marketplace.list.path] });
            toast({ title: "Success", description: "Resource published to marketplace!" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });
}

export function usePurchaseItem() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (itemId: string) => {
            const res = await fetch(buildUrl(api.marketplace.purchase.path, { itemId }), {
                method: api.marketplace.purchase.method
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Purchase failed");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.marketplace.purchases.path] });
            queryClient.invalidateQueries({ queryKey: [api.marketplace.list.path] });
            toast({ title: "Unlocked!", description: "Resource is now available in your collection." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });
}

export function useUserPurchases() {
    return useQuery<MarketplaceItem[]>({
        queryKey: [api.marketplace.purchases.path],
        queryFn: async () => {
            const res = await fetch(api.marketplace.purchases.path);
            if (!res.ok) throw new Error("Failed to fetch purchases");
            return res.json();
        }
    });
}
