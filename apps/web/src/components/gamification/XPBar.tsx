import { useGamification } from "@/hooks/use-gamification";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Star, ChevronUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const LEVEL_NAMES = ["", "Apprentice", "Scholar", "Expert", "Mentor", "Legend"];
const LEVEL_ICONS = ["", "📚", "🎓", "⚡", "🔥", "👑"];
const LEVEL_COLORS = ["", "#6B7280", "#3B82F6", "#8B5CF6", "#F59E0B", "#10B981"];

export function XPBar() {
    const { user } = useAuth();
    const { data: gam, isLoading } = useGamification();

    if (!user || isLoading || !gam) return null;

    const { totalXp, level, progressPercent, streak, nextLevelXp, levelName } = gam;
    const levelColor = LEVEL_COLORS[level] ?? "#6B7280";
    const levelIcon = LEVEL_ICONS[level] ?? "📚";

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2.5 cursor-pointer group select-none"
                    >
                        {/* Level badge */}
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 shadow-lg group-hover:scale-110 transition-transform"
                            style={{ borderColor: levelColor, boxShadow: `0 0 12px ${levelColor}40` }}
                        >
                            {levelIcon}
                        </div>

                        {/* XP progress bar */}
                        <div className="hidden sm:flex flex-col gap-0.5 min-w-[80px]">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: levelColor }}>
                                    {levelName}
                                </span>
                                <span className="text-[9px] text-muted-foreground font-bold">{totalXp} XP</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${levelColor}80, ${levelColor})` }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                            </div>
                        </div>

                        {/* Streak */}
                        {streak > 0 && (
                            <div className="flex items-center gap-0.5 text-orange-400">
                                <Flame className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold">{streak}</span>
                            </div>
                        )}
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px] p-3">
                    <div className="space-y-2">
                        <div className="font-bold text-sm">{levelIcon} Level {level} — {levelName}</div>
                        <div className="text-xs text-muted-foreground">{totalXp} XP total · {nextLevelXp - totalXp} XP to next level</div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
                        </div>
                        {streak > 0 && (
                            <div className="flex items-center gap-1 text-orange-400 text-xs font-bold">
                                <Flame className="w-3 h-3" /> {streak}-day streak! Keep it up.
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
