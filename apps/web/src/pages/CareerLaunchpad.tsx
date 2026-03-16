import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@edusphere/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
    Target, Zap, Award, Clock, ChevronRight, Layout, Database, Cpu,
    BarChart3, CheckCircle2, Lock, ArrowRight, TrendingUp, Flame, BookOpen, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

const FALLBACK_PATHS = [
    {
        id: "p1", title: "Full-Stack Web Architect",
        description: "Master modern web development with Next.js, TypeScript, and Distributed Systems.",
        category: "web_dev", difficulty: "Intermediate", estimatedHours: 120, milestonesCount: 12
    },
    {
        id: "p2", title: "AI & Machine Learning Engineer",
        description: "From Linear Algebra to Transformer Architectures. Build the future of intelligence.",
        category: "ai", difficulty: "Advanced", estimatedHours: 250, milestonesCount: 18
    },
    {
        id: "p3", title: "Data Systems & Analytics",
        description: "Understand data pipelines, big data processing, and predictive visualization.",
        category: "data", difficulty: "Beginner", estimatedHours: 80, milestonesCount: 8
    },
    {
        id: "p4", title: "Cloud & DevOps Engineering",
        description: "Docker, Kubernetes, CI/CD pipelines, and cloud-native architecture at scale.",
        category: "web_dev", difficulty: "Advanced", estimatedHours: 160, milestonesCount: 14
    },
];

const CATEGORY_ICONS: Record<string, any> = { web_dev: Zap, ai: Cpu, data: Database };
const DIFFICULTY_COLORS: Record<string, string> = {
    Beginner: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    Intermediate: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    Advanced: "text-rose-400 bg-rose-400/10 border-rose-400/20",
};

export default function CareerLaunchpad() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("all");

    // Fetch all career paths
    const { data: paths = [] } = useQuery({
        queryKey: [api.career.list.path, activeTab],
        queryFn: async () => {
            const url = activeTab === "all" ? api.career.list.path : `${api.career.list.path}?category=${activeTab}`;
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) return [];
            return res.json();
        }
    });

    // Fetch user's enrolled paths
    const { data: myProgress = [] } = useQuery({
        queryKey: [api.career.progress.path],
        queryFn: async () => {
            const res = await fetch(api.career.progress.path, { credentials: "include" });
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!user,
    });

    const enrollMutation = useMutation({
        mutationFn: async (pathId: string) => {
            const res = await apiRequest("POST", api.career.enroll.path.replace(":pathId", pathId), {});
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.career.progress.path] });
            toast({ title: "🎯 Enrolled!", description: "You've joined this career path. Start learning now." });
        },
        onError: () => {
            toast({ variant: "destructive", title: "Enrollment failed. Please try again." });
        }
    });

    const displayPaths = paths.length ? paths : FALLBACK_PATHS;
    const enrolledIds = new Set(myProgress.map((p: any) => p.progress?.pathId || p.pathId));

    const categories = [
        { id: "all", label: "All Paths", icon: Layout },
        { id: "web_dev", label: "Web Dev", icon: Zap },
        { id: "ai", label: "AI/ML", icon: Cpu },
        { id: "data", label: "Data Science", icon: Database }
    ];

    const stats = [
        { label: "Enrolled Paths", value: String(myProgress.length || 0), icon: Target, color: "text-primary" },
        { label: "Skills Gained", value: String(myProgress.length * 3 || 0), icon: Award, color: "text-amber-500" },
        { label: "Est. Hours", value: `${myProgress.length * 40 || 0}h`, icon: Clock, color: "text-emerald-500" },
        { label: "Streak", value: `${Math.max(1, myProgress.length * 4)} Days`, icon: Flame, color: "text-orange-500" },
    ];

    return (
        <div className="min-h-screen relative z-20 pt-4 pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <h1 className="text-5xl font-display font-extrabold tracking-tight mb-2">
                        Career <span className="text-primary">Launchpad</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">Structured learning paths to take you from student to professional.</p>
                </motion.div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {stats.map((stat, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}>
                            <Card className="glass-panel border-white/10 p-4 flex items-center gap-4 group hover:-translate-y-1 transition-all">
                                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{stat.label}</p>
                                    <p className="text-2xl font-display font-bold">{stat.value}</p>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Main Path Grid */}
                    <div className="flex-1 space-y-8">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <h2 className="text-3xl font-display font-bold">Training <span className="text-primary">Paths</span></h2>
                            <div className="flex gap-2 flex-wrap">
                                {categories.map((cat) => (
                                    <Button key={cat.id} variant={activeTab === cat.id ? "default" : "outline"}
                                        onClick={() => setActiveTab(cat.id)}
                                        className={`rounded-full px-4 font-bold transition-all text-sm ${activeTab === cat.id ? "shadow-lg shadow-primary/20" : "border-white/10"}`}
                                    >
                                        <cat.icon className="w-3.5 h-3.5 mr-1.5" />{cat.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {displayPaths.map((path: any, idx: number) => {
                                const Icon = CATEGORY_ICONS[path.category] || BookOpen;
                                const isEnrolled = enrolledIds.has(path.id);
                                const difficultyStyle = DIFFICULTY_COLORS[path.difficulty] || "";
                                return (
                                    <motion.div key={path.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.07, duration: 0.4 }}>
                                        <Card className="holographic-card border-white/10 rounded-[2rem] group flex flex-col h-full hover:-translate-y-2 transition-all duration-500 overflow-hidden relative">
                                            {isEnrolled && (
                                                <div className="absolute top-4 left-4 z-10">
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest">
                                                        <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Enrolled
                                                    </Badge>
                                                </div>
                                            )}
                                            <div className="h-28 bg-gradient-to-br from-primary/10 to-transparent relative p-6 flex items-end">
                                                <Badge className={`absolute top-4 right-4 border text-[10px] font-bold uppercase tracking-wider ${difficultyStyle}`}>
                                                    {path.difficulty}
                                                </Badge>
                                                <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                            </div>
                                            <CardHeader className="pt-3 relative z-10 flex-1">
                                                <CardTitle className="text-xl font-bold mb-2">{path.title}</CardTitle>
                                                <p className="text-muted-foreground text-sm leading-relaxed">{path.description}</p>
                                                <div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-t border-white/5 pt-4 mt-4">
                                                    <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {path.estimatedHours}h</div>
                                                    <div className="flex items-center gap-1.5"><BarChart3 className="w-3 h-3" /> {path.milestonesCount} milestones</div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="relative z-10 pb-5 mt-auto">
                                                {isEnrolled ? (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-xs font-bold"><span>Progress</span><span className="text-primary">In Progress</span></div>
                                                        <Progress value={35} className="h-1.5 bg-white/5 rounded-full" />
                                                        <Button variant="outline" className="w-full h-11 rounded-xl font-bold border-primary/20 text-primary hover:bg-primary/10">
                                                            Continue Learning <ChevronRight className="ml-2 w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        className="w-full h-11 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all font-bold group-hover:scale-[1.02]"
                                                        onClick={() => enrollMutation.mutate(path.id)}
                                                        disabled={enrollMutation.isPending}
                                                    >
                                                        {enrollMutation.isPending ? "Enrolling..." : <><span>Enroll Now</span><ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Sidebar: Progress */}
                    <aside className="lg:w-80 space-y-6">
                        <Card className="glass-panel border-white/10 rounded-[2.5rem] p-6 group">
                            <CardHeader className="px-0 pt-0 border-b border-white/5 pb-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-bold">My Progress</CardTitle>
                                    <TrendingUp className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
                                </div>
                            </CardHeader>

                            {myProgress.length === 0 ? (
                                <div className="text-center py-8 space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                        <Sparkles className="w-6 h-6 text-primary" />
                                    </div>
                                    <p className="text-sm font-medium">No paths enrolled yet</p>
                                    <p className="text-xs text-muted-foreground">Enroll in a path to start tracking your progress here.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {myProgress.slice(0, 3).map((item: any, i: number) => {
                                        const p = item.path || item;
                                        return (
                                            <div key={i} className="space-y-2">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                                                    <span className="truncate max-w-[160px]">{p.title}</span>
                                                    <span className="text-primary">In Progress</span>
                                                </div>
                                                <Progress value={Math.min(30 + i * 15, 85)} className="h-2 bg-white/5 rounded-full" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <Button variant="outline" className="w-full mt-6 rounded-xl border-white/10 hover:bg-white/5 font-bold">
                                View Full Roadmap
                            </Button>
                        </Card>

                        {/* Certificate Card */}
                        <Card className="glass-panel border-white/10 rounded-[2.5rem] p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-center space-y-4 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Award className="w-12 h-12 text-indigo-400 mx-auto drop-shadow-[0_0_10px_rgba(129,140,248,0.4)]" />
                            <h3 className="text-lg font-bold">Get Certified</h3>
                            <p className="text-xs text-muted-foreground">Complete any path to earn a cryptographically signed certificate of mastery.</p>
                            <Button className="w-full rounded-full bg-white text-black hover:bg-white/90 font-bold border-none">Learn More</Button>
                        </Card>
                    </aside>
                </div>
            </main>
        </div>
    );
}
