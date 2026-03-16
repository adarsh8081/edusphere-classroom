import { useState } from "react";
import { useMarketplace, useUserPurchases } from "@/hooks/use-marketplace";
import { MarketplaceItemCard } from "@/components/marketplace/MarketplaceItemCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Sparkles, BookOpen, GraduationCap, LayoutPanelLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
    { id: "all", label: "All Resources", icon: LayoutPanelLeft },
    { id: "mathematics", label: "Mathematics", icon: BookOpen },
    { id: "science", label: "Science", icon: Sparkles },
    { id: "humanities", label: "Humanities", icon: GraduationCap },
    { id: "arts", label: "Arts & Music", icon: Filter },
];

export default function MarketplacePage() {
    const [activeCategory, setActiveCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const { data: items, isLoading } = useMarketplace(
        activeCategory === "all" ? undefined : { category: activeCategory }
    );
    const { data: purchases } = useUserPurchases();

    const filteredItems = items?.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const purchasedIds = new Set(purchases?.map(p => p.id) || []);

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-primary/10 p-8 mb-12 border border-primary/20">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <GraduationCap size={200} />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30 border-none px-3 py-1">
                        Teacher Community
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Resource Marketplace
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        Discover, share, and unlock high-quality educational resources created by educators worldwide.
                    </p>

                    <div className="flex gap-2 p-1 bg-background rounded-2xl border shadow-sm max-w-lg">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search lesson plans, quizzes, slides..."
                                className="border-none focus-visible:ring-0 pl-10 h-11"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button className="rounded-xl h-11 px-6 font-semibold shadow-md">
                            Search
                        </Button>
                    </div>
                </div>
            </div>

            {/* Category Navigation */}
            <Tabs defaultValue="all" className="mb-12" onValueChange={setActiveCategory}>
                <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                        <TabsTrigger
                            key={cat.id}
                            value={cat.id}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border rounded-full px-6 py-2.5 h-auto transition-all hover:bg-muted"
                        >
                            <div className="flex items-center gap-2">
                                <cat.icon className="h-4 w-4" />
                                {cat.label}
                            </div>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Resource Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="aspect-video rounded-xl" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </div>
            ) : filteredItems?.length === 0 ? (
                <div className="text-center py-24 bg-muted/30 rounded-3xl border-2 border-dashed">
                    <div className="inline-flex items-center justify-center p-6 bg-background rounded-full mb-4 shadow-sm border">
                        <Search className="h-10 w-10 text-muted-foreground opacity-50" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">No resources found</h2>
                    <p className="text-muted-foreground">Try adjusting your search or filters to find what you're looking for.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems?.map((item) => (
                        <MarketplaceItemCard
                            key={item.id}
                            item={item}
                            isPurchased={purchasedIds.has(item.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

import { Badge } from "@/components/ui/badge";
