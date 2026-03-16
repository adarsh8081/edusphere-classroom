import { useLeaderboard } from "@/hooks/use-gamification";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Trophy, Flame, Crown, Medal, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RANK_ICONS = [
    <Crown className="w-4 h-4 text-yellow-400" />,
    <Medal className="w-4 h-4 text-slate-300" />,
    <Award className="w-4 h-4 text-amber-600" />,
];

const LEVEL_ICONS: Record<number, string> = { 1: "📚", 2: "🎓", 3: "⚡", 4: "🔥", 5: "👑" };
const LEVEL_COLORS: Record<number, string> = { 1: "#6B7280", 2: "#3B82F6", 3: "#8B5CF6", 4: "#F59E0B", 5: "#10B981" };

interface LeaderboardPanelProps {
    classId: string;
}

export function LeaderboardPanel({ classId }: LeaderboardPanelProps) {
    const { user } = useAuth();
    const { data: leaderboard = [], isLoading } = useLeaderboard(classId);

    return (
        <Card className="glass-panel border-white/10 rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Class Leaderboard
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="space-y-3 p-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-14 glass-panel rounded-xl animate-pulse" />)}
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm px-4">
                        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        No XP earned yet. Be the first!
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {leaderboard.map((entry: any, idx: number) => {
                            const isMe = entry.userId === user?.id;
                            const levelColor = LEVEL_COLORS[entry.level] ?? "#6B7280";
                            return (
                                <motion.div
                                    key={entry.userId}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${isMe ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-white/3"}`}
                                >
                                    {/* Rank */}
                                    <div className="w-7 flex items-center justify-center flex-shrink-0">
                                        {idx < 3 ? RANK_ICONS[idx] : (
                                            <span className="text-xs font-bold text-muted-foreground">#{entry.rank}</span>
                                        )}
                                    </div>

                                    {/* Avatar / Level */}
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0"
                                        style={{ borderColor: levelColor, background: `${levelColor}20` }}
                                    >
                                        {entry.avatarUrl
                                            ? <img src={entry.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                            : <span>{LEVEL_ICONS[entry.level] ?? "📚"}</span>
                                        }
                                    </div>

                                    {/* Name + level */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate ${isMe ? "text-primary" : ""}`}>
                                            {entry.name} {isMe && <span className="text-[10px] text-primary/70">(You)</span>}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                            {entry.levelInfo?.name ?? "Apprentice"}
                                        </p>
                                    </div>

                                    {/* XP + streak */}
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-bold" style={{ color: levelColor }}>{entry.totalXp} XP</p>
                                        {entry.streak > 0 && (
                                            <div className="flex items-center justify-end gap-0.5 text-orange-400">
                                                <Flame className="w-2.5 h-2.5" />
                                                <span className="text-[10px] font-bold">{entry.streak}</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
