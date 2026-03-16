import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketplaceItem } from "@edusphere/types";
import { usePurchaseItem } from "@/hooks/use-marketplace";
import { ShoppingCart, Eye, Download, CheckCircle2 } from "lucide-react";

interface MarketplaceItemCardProps {
    item: MarketplaceItem;
    isPurchased: boolean;
    onPreview?: (item: MarketplaceItem) => void;
}

export function MarketplaceItemCard({ item, isPurchased, onPreview }: MarketplaceItemCardProps) {
    const purchaseMutation = usePurchaseItem();

    const handlePurchase = () => {
        purchaseMutation.mutate(item.id);
    };

    return (
        <Card className="overflow-hidden transition-all hover:shadow-lg border-2 hover:border-primary/50 group">
            <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
                {item.previewUrl ? (
                    <img
                        src={item.previewUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                ) : (
                    <div className="text-muted-foreground flex flex-col items-center">
                        <Eye className="h-10 w-10 mb-2 opacity-20" />
                        <span className="text-xs uppercase tracking-wider font-semibold opacity-50">No Preview</span>
                    </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                        {item.category}
                    </Badge>
                </div>
            </div>

            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
            </CardHeader>

            <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                    {item.description || "No description provided."}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {item.purchaseCount || 0} unlocks
                    </span>
                    <span className="font-bold text-primary text-base">
                        {parseFloat(item.price) === 0 ? "FREE" : `$${item.price}`}
                    </span>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex gap-2">
                {isPurchased ? (
                    <Button variant="outline" className="w-full gap-2 border-green-500/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20" disabled>
                        <CheckCircle2 className="h-4 w-4" />
                        Unlocked
                    </Button>
                ) : (
                    <Button
                        className="w-full gap-2"
                        onClick={handlePurchase}
                        disabled={purchaseMutation.isPending}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        {purchaseMutation.isPending ? "Unlocking..." : "Unlock Now"}
                    </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => onPreview?.(item)}>
                    <Eye className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
