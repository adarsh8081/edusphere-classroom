import { useGamification, useAllBadges } from "@/hooks/use-gamification";
import { usePortfolio } from "@/hooks/use-portfolio";
import { motion } from "framer-motion";
import { Trophy, Lock, Star, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export function BadgesShowcase() {
    const { data: gam } = useGamification();
    const { data: allBadges = [] } = useAllBadges();
    const { portfolio, toggleItem } = usePortfolio();

    const earnedBadgeIds = new Set((gam?.badges ?? []).map((b: any) => b.badge?.id ?? b.id));

    return (
        <Card className="glass-panel border-white/10 rounded-[2rem]">
            <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    Achievements
                    <span className="ml-auto text-xs text-muted-foreground font-normal">
                        {earnedBadgeIds.size}/{allBadges.length} unlocked
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <TooltipProvider>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                        {allBadges.map((badge: any, idx: number) => {
                            const isEarned = earnedBadgeIds.has(badge.id);
                            const earnedEntry = gam?.badges?.find((b: any) => (b.badge?.id ?? b.id) === badge.id);
                            const earnedAt = earnedEntry?.earnedAt;

                            return (
                                <Tooltip key={badge.id}>
                                    <TooltipTrigger asChild>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.04 }}
                                            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all cursor-help
                        ${isEarned
                                                    ? "border-amber-400/30 bg-amber-400/10 hover:scale-105 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                                                    : "border-white/5 bg-white/3 opacity-40 grayscale"
                                                }`}
                                        >
                                            <span className="text-2xl">{badge.icon}</span>
                                            <p className="text-[9px] font-bold text-center leading-tight line-clamp-2">{badge.name}</p>
                                            {isEarned && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center z-10">
                                                    <span className="text-[8px] text-black font-bold">✓</span>
                                                </div>
                                            )}

                                            {isEarned && portfolio && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border bg-background shadow-sm z-10 hover:bg-primary hover:text-white transition-colors
                                                  ${portfolio.items?.some((i: any) => i.type === 'badge' && i.referenceId === badge.id) ? 'text-primary border-primary' : 'text-muted-foreground border-white/10'}
                                                `}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleItem({ type: 'badge', referenceId: badge.id, title: badge.name });
                                                    }}
                                                >
                                                    {portfolio.items?.some((i: any) => i.type === 'badge' && i.referenceId === badge.id) ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                                </Button>
                                            )}
                                        </motion.div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[180px] text-center">
                                        <p className="font-bold">{badge.icon} {badge.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                                        {badge.xpBonus > 0 && <p className="text-xs text-primary font-bold mt-1">+{badge.xpBonus} XP bonus</p>}
                                        {isEarned && earnedAt && (
                                            <p className="text-[10px] text-emerald-400 mt-1">
                                                Earned {new Date(earnedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                        {!isEarned && <p className="text-[10px] text-muted-foreground mt-1 italic">Locked</p>}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
}
