import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import {
    ArrowBigUp,
    ArrowBigDown,
    MessageCircle,
    Share2,
    Plus,
    TrendingUp,
    Filter,
    Search,
    Award,
    Globe,
    MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

export default function Forums() {
    const queryClient = useQueryClient();
    const [activeCategory, setActiveCategory] = useState("all");

    const { data: posts, isLoading } = useQuery({
        queryKey: [api.forums.list.path, activeCategory],
        queryFn: async () => {
            const url = activeCategory === "all" ? api.forums.list.path : `${api.forums.list.path}?communityId=${activeCategory}`;
            const res = await fetch(url);
            return res.json();
        }
    });

    // Mocking some posts if empty to show the UI
    const displayPosts = posts?.length ? posts : [
        {
            id: "1",
            title: "How to master React in 2026?",
            content: "I've been learning React for 3 months now, but the new RSC patterns are still a bit confusing. Any tips on how to structure large scale apps with zero-latency requirements?",
            author: { name: "Dev_Master", avatarUrl: null },
            upvotes: 245,
            commentsCount: 32,
            communityId: "coding",
            createdAt: new Date().toISOString()
        },
        {
            id: "2",
            title: "Study Group for Machine Learning Finale",
            content: "Looking for 3 more people to join a deep-dive session on Transformer architectures. We meet every Tuesday at 6 PM in the #AI-Guild.",
            author: { name: "Neural_Nishant", avatarUrl: null },
            upvotes: 120,
            commentsCount: 15,
            communityId: "study",
            createdAt: new Date().toISOString()
        }
    ];

    const categories = [
        { id: "all", label: "All Topics", icon: Globe },
        { id: "coding", label: "Coding", icon: TrendingUp },
        { id: "study", label: "Study Tips", icon: MessageCircle },
        { id: "career", label: "Career Advice", icon: Award }
    ];

    return (
        <div className="min-h-screen relative z-20 pt-4">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Sidebar: Categories */}
                    <aside className="lg:w-64 space-y-4 hidden lg:block">
                        <div className="glass-panel border-white/10 p-4 rounded-2xl sticky top-24">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 px-2">Communities</h3>
                            <div className="space-y-1">
                                {categories.map((cat) => (
                                    <div
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-300
                            ${activeCategory === cat.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-white/5 text-foreground/80 hover:text-foreground"}`}
                                    >
                                        <cat.icon className="w-4 h-4" />
                                        <span className="font-bold text-sm tracking-tight">{cat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Center: Feed */}
                    <div className="flex-1 space-y-6">
                        {/* Search & Action Bar */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center mb-10">
                            <div className="relative flex-1 group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                </div>
                                <Input
                                    placeholder="Search the EduSphere community..."
                                    className="pl-12 h-14 rounded-2xl bg-black/40 border-white/10 focus:ring-primary/40 text-lg transition-all"
                                />
                            </div>
                            <Button className="h-14 px-8 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 shadow-lg shadow-primary/20 hover-elevate group">
                                <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" />
                                <span className="font-bold text-lg">Create Post</span>
                            </Button>
                        </div>

                        {/* Post List */}
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-48 glass-panel rounded-3xl animate-pulse"></div>)}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {displayPosts.map((post: any, idx: number) => (
                                    <motion.div
                                        key={post.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                                    >
                                        <Card className="holographic-card border-white/10 rounded-3xl group">
                                            <CardContent className="p-0 flex">
                                                {/* Voting Column */}
                                                <div className="w-12 bg-white/5 flex flex-col items-center py-4 gap-2 border-r border-white/5">
                                                    <button className="text-muted-foreground hover:text-primary transition-colors">
                                                        <ArrowBigUp className="w-8 h-8" />
                                                    </button>
                                                    <span className="font-bold text-sm">{post.upvotes}</span>
                                                    <button className="text-muted-foreground hover:text-secondary transition-colors">
                                                        <ArrowBigDown className="w-8 h-8" />
                                                    </button>
                                                </div>

                                                {/* Post Content */}
                                                <div className="flex-1 p-6 relative">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Avatar className="h-6 w-6 border border-primary/20">
                                                            <AvatarFallback className="text-[10px] bg-primary/20 text-primary">DP</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs font-bold text-primary hover:underline cursor-pointer">/r/{post.communityId}</span>
                                                        <span className="text-[10px] text-muted-foreground">• Posted by {post.author.name} • 2h ago</span>
                                                    </div>

                                                    <h2 className="text-2xl font-display font-bold mb-3 group-hover:text-primary transition-colors">{post.title}</h2>
                                                    <p className="text-muted-foreground line-clamp-3 mb-6 leading-relaxed">
                                                        {post.content}
                                                    </p>

                                                    <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:bg-white/5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors">
                                                            <MessageCircle className="w-4 h-4" />
                                                            <span>{post.commentsCount || 0} Comments</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:bg-white/5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors">
                                                            <Share2 className="w-4 h-4" />
                                                            <span>Share</span>
                                                        </div>
                                                        <div className="ml-auto">
                                                            <MoreHorizontal className="w-5 h-5 text-muted-foreground hover:text-white cursor-pointer" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar: Stats / Community */}
                    <aside className="lg:w-80 space-y-6 hidden xl:block">
                        <Card className="glass-panel border-white/10 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full"></div>
                            <CardHeader className="relative z-10 border-b border-white/5">
                                <CardTitle className="text-lg font-bold">Community Rules</CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10 p-6 space-y-4">
                                {[
                                    "Be respectful and professional",
                                    "Cite your sources for technical claims",
                                    "Keep discussions educational",
                                    "No self-promotion or spam"
                                ].map((rule, idx) => (
                                    <div key={idx} className="flex gap-3 items-start">
                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20">
                                            <span className="text-[10px] font-bold text-primary">{idx + 1}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{rule}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="glass-panel border-white/10 rounded-3xl p-6 text-center space-y-4 group">
                            <TrendingUp className="w-12 h-12 text-primary mx-auto group-hover:scale-110 transition-transform duration-500" />
                            <h3 className="text-xl font-bold">Trending Topics</h3>
                            <div className="flex flex-wrap gap-2 justify-center">
                                <Badge variant="outline" className="border-white/10 hover:border-primary/40 rounded-full px-3 py-1 cursor-pointer">#NextJS15</Badge>
                                <Badge variant="outline" className="border-white/10 hover:border-primary/40 rounded-full px-3 py-1 cursor-pointer">#CareerGrowth</Badge>
                                <Badge variant="outline" className="border-white/10 hover:border-primary/40 rounded-full px-3 py-1 cursor-pointer">#AIEthics</Badge>
                            </div>
                        </Card>
                    </aside>

                </div>
            </main>
        </div>
    );
}
