import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Globe,
    Users,
    Layout,
    Zap,
    Target,
    MessageSquare,
    ArrowRight,
    Sparkles,
    TrendingUp,
    Award,
    ShoppingBag
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function EcosystemHub() {
    const cards = [
        {
            title: "Classroom Hub",
            description: "Manage your academic courses, assignments, and real-time class streams.",
            icon: Layout,
            link: "/",
            color: "from-blue-500 to-cyan-400",
            stats: "12 Active Classes"
        },
        {
            title: "Collaborative Guilds",
            description: "Join Discord-like study groups and real-time collaboration channels.",
            icon: Users,
            link: "/guilds",
            color: "from-purple-500 to-indigo-400",
            stats: "48 New Messages"
        },
        {
            title: "Knowledge Forums",
            description: "Reddit-style community sharing. Upvote, discuss, and learn together.",
            icon: Globe,
            link: "/forums",
            color: "from-orange-500 to-rose-400",
            stats: "1.2k Weekly Posts"
        },
        {
            title: "Career Launchpad",
            description: "Technical training paths and job readiness preparation.",
            icon: Target,
            link: "/career",
            color: "from-emerald-500 to-teal-400",
            stats: "3 Skills Mastered"
        },
        {
            title: "Teacher Marketplace",
            description: "Discover and unlock premium lesson plans, quizzes, and community resources.",
            icon: ShoppingBag,
            link: "/marketplace",
            color: "from-amber-500 to-yellow-400",
            stats: "250+ New Assets"
        }
    ];

    return (
        <div className="min-h-screen relative z-10 pt-4 pb-20">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Hero Section */}
                <div className="relative mb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-6">
                            <Sparkles className="w-4 h-4" />
                            <span>The Unified Learning Ecosystem</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-display font-extrabold mb-6 tracking-tight">
                            Welcome to <span className="text-gradient">EduSphere</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            A centralized academic landscape. No more tab fatigue.
                            One ecosystem for classroom management, peer collaboration, and career growth.
                        </p>
                    </motion.div>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {cards.map((card, idx) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                        >
                            <Link href={card.link}>
                                <Card className="group h-full holographic-card cursor-pointer hover:-translate-y-2 transition-all duration-500 border-white/10 overflow-hidden">
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 blur-3xl group-hover:opacity-30 transition-opacity`}></div>

                                    <CardHeader className="relative z-10 space-y-4">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg border border-white/20`}>
                                            <card.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-bold">{card.title}</CardTitle>
                                            <p className="text-muted-foreground mt-2 leading-relaxed">
                                                {card.description}
                                            </p>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="relative z-10">
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2 text-sm font-bold text-primary">
                                                <TrendingUp className="w-4 h-4" />
                                                <span>{card.stats}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-primary font-bold transition-transform group-hover:translate-x-1">
                                                Enter Room <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Career & Mindfulness Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 glass-panel border-white/10 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-1 space-y-6">
                                <h2 className="text-3xl font-display font-bold">Accelerate Your <span className="text-primary">Career</span></h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Our Career Launchpad uses intelligent tracking to identify your strengths
                                    and recommend technical training paths that bridge the gap to employment.
                                </p>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
                                        <Award className="w-4 h-4" /> Skill Certified
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-bold border border-blue-500/20">
                                        <Zap className="w-4 h-4" /> Tech Training
                                    </div>
                                </div>
                                <Link href="/career">
                                    <Button className="rounded-full px-8 h-12 hover-elevate shadow-lg shadow-primary/20">
                                        Browse Paths
                                    </Button>
                                </Link>
                            </div>
                            <div className="w-full md:w-64 h-64 bg-primary/5 rounded-[2rem] border border-primary/20 flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent animate-pulse"></div>
                                <Target className="w-24 h-24 text-primary relative z-10 drop-shadow-[0_0_15px_rgba(23,226,255,0.4)] group-hover:scale-110 transition-transform duration-500" />
                            </div>
                        </div>
                    </Card>

                    <Card className="glass-panel border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between items-center text-center group">
                        <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-cyan-500/20">
                            <MessageSquare className="w-10 h-10 text-cyan-500" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold italic tracking-tight">Need a breather?</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Step away from the noise. Our Zen Mode helps you refocus with guided
                                breathing and binaural study beats.
                            </p>
                        </div>
                        <Button variant="outline" className="mt-8 rounded-full px-6 border-white/10 hover:bg-white/5 font-bold">
                            Start Zen Session
                        </Button>
                    </Card>
                </div>
            </main>
        </div>
    );
}
