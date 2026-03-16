import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTutor } from "@/hooks/use-tutor";
import { Sparkles, AlertTriangle, BookOpen, ChevronRight, BrainCircuit, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function TutorCards({ classId }: { classId: string }) {
    const { recommendations, studyPlan, analyzePerformance } = useTutor(classId);

    if (recommendations.isLoading || studyPlan.isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-[200px] w-full rounded-3xl" />
                <Skeleton className="h-[200px] w-full rounded-3xl" />
            </div>
        );
    }

    const gaps = recommendations.data || [];
    const plan = studyPlan.data?.planJson;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <BrainCircuit size={20} />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">Personal AI Tutor</h3>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => analyzePerformance.mutate()}
                    disabled={analyzePerformance.isPending}
                >
                    <Sparkles size={14} className={analyzePerformance.isPending ? "animate-pulse" : ""} />
                    Refresh Analysis
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Learning Gaps / Recommendations ── */}
                <div className="lg:col-span-2 space-y-4">
                    <AnimatePresence mode="popLayout">
                        {gaps.length > 0 ? (
                            gaps.map((gap, index) => (
                                <motion.div
                                    key={gap.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="glass-panel border-white/10 overflow-hidden relative group hover:border-primary/30 transition-all duration-300">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                                        <CardContent className="p-5 flex gap-4 items-start">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/20">
                                                <AlertTriangle size={24} />
                                            </div>
                                            <div className="space-y-1 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-bold text-lg">{gap.subject}</h4>
                                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                                        {gap.confidenceLevel}% Confidence
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {gap.weaknessAnalysis}
                                                </p>
                                                <div className="pt-3 flex flex-wrap gap-2">
                                                    {gap.suggestedResources?.map((res, i) => (
                                                        <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                            <BookOpen size={12} />
                                                            {res}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight size={18} />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        ) : (
                            <Card className="glass-panel border-dashed border-white/10 bg-transparent py-12">
                                <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
                                    <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center text-primary/40">
                                        <Sparkles size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold">No performance gaps yet</p>
                                        <p className="text-xs text-muted-foreground max-w-[200px]">Keep submitting assignments to get personalized recommendations.</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => analyzePerformance.mutate()}>
                                        Analyze My Progress
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Weekly Study Plan ── */}
                <Card className="glass-panel border-white/10 bg-primary/5 backdrop-blur-xl rounded-[2rem] overflow-hidden sticky top-6">
                    <CardHeader className="pb-3 border-b border-white/5">
                        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest font-black opacity-60">
                            <Calendar size={16} className="text-primary" />
                            Weekly Study Plan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {plan ? (
                            <div className="divide-y divide-white/5">
                                {plan.schedule.slice(0, 5).map((day: any, i: number) => (
                                    <div key={i} className="p-4 hover:bg-white/5 transition-colors cursor-pointer group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-black uppercase text-primary/80">{day.day}</span>
                                            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        </div>
                                        <p className="text-sm font-bold truncate">{day.focus}</p>
                                        <div className="flex gap-1 mt-1">
                                            {day.resources.slice(0, 2).map((r: string, j: number) => (
                                                <div key={j} className="text-[9px] text-muted-foreground bg-black/20 px-1.5 py-0.5 rounded italic">
                                                    {r}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <div className="p-4 bg-primary/10">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1 flex items-center gap-1">
                                        <Sparkles size={10} />
                                        AI Tip
                                    </p>
                                    <p className="text-xs italic text-foreground/80 leading-relaxed">
                                        "{plan.aiTip}"
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center space-y-4">
                                <p className="text-xs text-muted-foreground italic">No study plan generated for this week yet.</p>
                                <Button size="sm" variant="link" onClick={() => analyzePerformance.mutate()}>
                                    Generate Plan
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
