import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import {
    Target,
    Zap,
    Award,
    Clock,
    ChevronRight,
    Layout,
    Database,
    Cpu,
    BarChart3,
    CheckCircle2,
    Lock,
    ArrowRight,
    TrendingUp,
    Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function CareerLaunchpad() {
    const [activeTab, setActiveTab] = useState("all");

    const { data: paths, isLoading } = useQuery({
        queryKey: [api.career.list.path, activeTab],
        queryFn: async () => {
            const url = activeTab === "all" ? api.career.list.path : `${api.career.list.path}?category=${activeTab}`;
            const res = await fetch(url);
            return res.json();
        }
    });

    // Mocking paths if empty
    const displayPaths = paths?.length ? paths : [
        {
            id: "p1",
            title: "Full-Stack Web Architect",
            description: "Master modern web development with Next.js, TypeScript, and Distributed Systems.",
            category: "web_dev",
            difficulty: "Intermediate",
            estimatedHours: 120,
            milestonesCount: 12
        },
        {
            id: "p2",
            title: "AI & Machine Learning Engineer",
            description: "From Linear Algebra to Transformer Architectures. Build the future of intelligence.",
            category: "ai",
            difficulty: "Advanced",
            estimatedHours: 250,
            milestonesCount: 18
        },
        {
            id: "p3",
            title: "Data Systems & Analytics",
            description: "Understand data pipelines, big data processing, and predictive visualization.",
            category: "data",
            difficulty: "Beginner",
            estimatedHours: 80,
            milestonesCount: 8
        }
    ];

    const categories = [
        { id: "all", label: "All Paths", icon: Layout },
        { id: "web_dev", label: "Web Dev", icon: Zap },
        { id: "ai", label: "AI/ML", icon: Cpu },
        { id: "data", label: "Data Science", icon: Database }
    ];

    return (
        <div className="min-h-screen relative z-20 pt-4 pb-20">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: "Skills Gained", value: "8", icon: Award, color: "text-primary" },
                        { label: "Ongoing Paths", value: "2", icon: Target, color: "text-amber-500" },
                        { label: "Focus Hours", value: "48h", icon: Clock, color: "text-emerald-500" },
                        { label: "Learning Streak", value: "12 Days", icon: Flame, color: "text-orange-500" }
                    ].map((stat, idx) => (
                        <Card key={idx} className="glass-panel border-white/10 p-4 flex items-center gap-4 group">
                            <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{stat.label}</p>
                                <p className="text-2xl font-display font-bold">{stat.value}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row gap-10">

                    {/* Main: Path Grid */}
                    <div className="flex-1 space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-display font-bold">Training <span className="text-primary">Paths</span></h2>
                            <div className="flex gap-2">
                                {categories.map((cat) => (
                                    <Button
                                        key={cat.id}
                                        variant={activeTab === cat.id ? "default" : "outline"}
                                        onClick={() => setActiveTab(cat.id)}
                                        className={`rounded-full px-5 font-bold transition-all
                            ${activeTab === cat.id ? "shadow-lg shadow-primary/20" : "border-white/10"}`}
                                    >
                                        <cat.icon className="w-4 h-4 mr-2" />
                                        {cat.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {displayPaths.map((path: any, idx: number) => (
                                <motion.div
                                    key={path.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                                >
                                    <Card className="holographic-card border-white/10 rounded-[2rem] group flex flex-col h-full hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                                        <div className="h-32 bg-gradient-to-br from-primary/10 to-transparent relative p-6">
                                            <Badge className="absolute top-6 right-6 bg-white/5 hover:bg-white/10 border-white/10 text-xs text-foreground uppercase tracking-wider font-bold">
                                                {path.difficulty}
                                            </Badge>
                                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 mb-3 group-hover:scale-110 transition-transform">
                                                {path.category === 'web_dev' ? <Zap /> : path.category === 'ai' ? <Cpu /> : <Database />}
                                            </div>
                                        </div>

                                        <CardHeader className="pt-0 relative z-10 flex-1">
                                            <CardTitle className="text-2xl font-bold mb-3">{path.title}</CardTitle>
                                            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                                                {path.description}
                                            </p>

                                            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-t border-white/5 pt-4">
                                                <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {path.estimatedHours} Hours</div>
                                                <div className="flex items-center gap-1.5"><BarChart3 className="w-3 h-3" /> {path.milestonesCount} Milestones</div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="relative z-10 pb-6 mt-auto">
                                            <Button className="w-full h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all font-bold text-lg group-hover:scale-[1.02]">
                                                Enroll Now <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Personal Progress */}
                    <aside className="lg:w-80 space-y-6">
                        <Card className="glass-panel border-white/10 rounded-[2.5rem] p-6 group">
                            <CardHeader className="px-0 pt-0 border-b border-white/5 pb-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-bold">Current Progress</CardTitle>
                                    <TrendingUp className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
                                </div>
                            </CardHeader>
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                                        <span>Full-Stack Architect</span>
                                        <span className="text-primary">65%</span>
                                    </div>
                                    <Progress value={65} className="h-2 bg-white/5 rounded-full ring-1 ring-white/5" indicatorClassName="bg-gradient-to-r from-primary to-cyan-400 rounded-full" />
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Milestones</h4>
                                    <div className="space-y-3">
                                        {[
                                            { label: "Distributed Systems Intro", date: "Yesterday", completed: true },
                                            { label: "Next.js Security Patterns", date: "In Progress", completed: false },
                                            { label: "Redshift Optimization", date: "Locked", completed: false, locked: true }
                                        ].map((m, i) => (
                                            <div key={i} className={`flex items-start gap-3 p-3 rounded-2xl transition-all border ${m.completed ? "bg-primary/5 border-primary/20" : "bg-white/5 border-white/5 hover:bg-white/10"}`}>
                                                <div className="mt-0.5">
                                                    {m.locked ? <Lock className="w-4 h-4 text-muted-foreground/50" /> : m.completed ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <div className="w-4 h-4 rounded-full border-2 border-primary/50 border-t-transparent animate-spin"></div>}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-xs font-bold leading-none ${m.locked ? "text-muted-foreground" : "text-foreground"}`}>{m.label}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-1">{m.date}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full mt-8 rounded-xl border-white/10 hover:bg-white/5 font-bold">
                                View Full Roadmap
                            </Button>
                        </Card>

                        {/* Ad-style card */}
                        <Card className="glass-panel border-white/10 rounded-[2.5rem] p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-center space-y-4 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Award className="w-12 h-12 text-indigo-400 mx-auto drop-shadow-[0_0_10px_rgba(129,140,248,0.4)]" />
                            <h3 className="text-lg font-bold">Get Certified</h3>
                            <p className="text-xs text-muted-foreground">Complete any path to earn a cryptographically signed certificate of mastery.</p>
                            <Button className="w-full rounded-full bg-white text-black hover:bg-white/90 font-bold border-none">
                                Learn More
                            </Button>
                        </Card>
                    </aside>

                </div>
            </main>
        </div>
    );
}
