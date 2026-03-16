import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@edusphere/api-client";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowBigUp, ArrowBigDown, MessageCircle, Share2, Plus, TrendingUp,
    Filter, Search, Award, Globe, ChevronDown, ChevronUp, Loader2, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const CATEGORIES = [
    { id: "all", label: "All", icon: Globe },
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "achievements", label: "Achievements", icon: Award },
];

const COMMUNITY_OPTIONS = [
    { value: "general", label: "General" },
    { value: "coding", label: "Coding & Dev" },
    { value: "science", label: "Science" },
    { value: "math", label: "Mathematics" },
    { value: "resources", label: "Resources" },
];

function timeAgo(date: string) {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function PostCard({ post }: { post: any }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");

    const { data: comments = [], refetch: refetchComments } = useQuery({
        queryKey: [`/api/forums/posts/${post.id}/comments`, showComments],
        queryFn: async () => {
            const res = await fetch(`/api/forums/posts/${post.id}/comments`, { credentials: "include" });
            return res.json();
        },
        enabled: showComments,
    });

    const voteMutation = useMutation({
        mutationFn: async (direction: "up" | "down") => {
            const res = await apiRequest("POST", api.forums.vote.path.replace(":postId", post.id), { direction });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.forums.list.path] });
        }
    });

    const commentMutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await apiRequest("POST", `/api/forums/posts/${post.id}/comments`, { content });
            return res.json();
        },
        onSuccess: () => {
            setCommentText("");
            refetchComments();
            toast({ title: "💬 Comment added!" });
        }
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
        >
            {/* Vote column */}
            <div className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/5 border border-white/5 px-2 min-w-[44px]">
                <button
                    onClick={() => voteMutation.mutate("up")}
                    className="text-muted-foreground hover:text-emerald-400 transition-colors"
                >
                    <ArrowBigUp className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold">{post.upvotes ?? 0}</span>
                <button
                    onClick={() => voteMutation.mutate("down")}
                    className="text-muted-foreground hover:text-rose-400 transition-colors"
                >
                    <ArrowBigDown className="w-5 h-5" />
                </button>
            </div>

            {/* Post content */}
            <Card className="flex-1 glass-panel border-white/10 rounded-2xl hover:border-white/20 transition-colors">
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <Avatar className="h-5 w-5 border border-white/10">
                            <AvatarImage src={post.author?.avatarUrl} />
                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">
                                {post.author?.name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-foreground/80">{post.author?.name || "Anonymous"}</span>
                        <span>•</span>
                        <span>{timeAgo(post.createdAt)}</span>
                        {post.communityId && (
                            <>
                                <span>•</span>
                                <Badge variant="outline" className="text-[10px] px-2 rounded-full border-white/10">{post.communityId}</Badge>
                            </>
                        )}
                    </div>

                    <h3 className="font-bold text-base leading-snug">{post.title}</h3>
                    {post.content && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{post.content}</p>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={() => setShowComments(v => !v)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-full px-3 py-1.5 hover:bg-white/5"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>{(comments as any[]).length > 0 && showComments ? `${(comments as any[]).length} comments` : "Comments"}</span>
                            {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-full px-3 py-1.5 hover:bg-white/5">
                            <Share2 className="w-4 h-4" />
                            <span>Share</span>
                        </button>
                    </div>

                    {/* Comments section */}
                    <AnimatePresence>
                        {showComments && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-3 pt-2 border-t border-white/5 overflow-hidden"
                            >
                                {(comments as any[]).map((comment: any) => (
                                    <div key={comment.id} className="flex gap-2">
                                        <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                                            <AvatarImage src={comment.author?.avatarUrl} />
                                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">
                                                {comment.author?.name?.charAt(0).toUpperCase() || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="bg-white/5 rounded-xl p-3 flex-1">
                                            <p className="text-xs font-bold text-foreground/80 mb-1">{comment.author?.name}</p>
                                            <p className="text-xs text-muted-foreground leading-relaxed">{comment.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {/* Add Comment */}
                                <div className="flex gap-2">
                                    <Avatar className="h-6 w-6 flex-shrink-0 mt-1">
                                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">
                                            {user?.name?.charAt(0).toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 flex gap-2">
                                        <Input
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            placeholder="Add a comment..."
                                            className="h-8 bg-white/5 border-white/10 rounded-xl text-xs"
                                            onKeyDown={e => {
                                                if (e.key === "Enter" && commentText.trim()) {
                                                    commentMutation.mutate(commentText.trim());
                                                }
                                            }}
                                        />
                                        <Button
                                            size="icon"
                                            className="h-8 w-8 rounded-xl flex-shrink-0"
                                            disabled={!commentText.trim() || commentMutation.isPending}
                                            onClick={() => commentMutation.mutate(commentText.trim())}
                                        >
                                            {commentMutation.isPending ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Send className="w-3 h-3" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function Forums() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [activeCategory, setActiveCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newCommunity, setNewCommunity] = useState("general");

    const { data: posts = [], isLoading } = useQuery({
        queryKey: [api.forums.list.path, activeCategory],
        queryFn: async () => {
            const url = activeCategory === "all" || activeCategory === "trending"
                ? api.forums.list.path
                : `${api.forums.list.path}?communityId=${activeCategory}`;
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) return [];
            return res.json();
        },
    });

    const createPostMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", api.forums.create.path, {
                title: newTitle,
                content: newContent,
                communityId: newCommunity,
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.forums.list.path] });
            setShowCreate(false);
            setNewTitle("");
            setNewContent("");
            toast({ title: "✅ Post created!" });
        },
        onError: () => {
            toast({ variant: "destructive", title: "Failed to create post." });
        }
    });

    const filtered = (posts as any[]).filter((p: any) =>
        !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sorted = activeCategory === "trending"
        ? [...filtered].sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0))
        : filtered;

    return (
        <div className="min-h-screen relative z-20 pt-4">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold">Community Forums</h1>
                        <p className="text-muted-foreground text-sm mt-1">Share ideas, ask questions, and grow together</p>
                    </div>
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button className="rounded-xl bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90 gap-2">
                                <Plus className="w-4 h-4" /> Create Post
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-panel border-white/10 rounded-3xl max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Create a Post</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                                <Select value={newCommunity} onValueChange={setNewCommunity}>
                                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                                        <SelectValue placeholder="Choose community" />
                                    </SelectTrigger>
                                    <SelectContent className="glass-panel border-white/10 rounded-xl">
                                        {COMMUNITY_OPTIONS.map(o => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    placeholder="Post title..."
                                    className="bg-white/5 border-white/10 rounded-xl"
                                />
                                <Textarea
                                    value={newContent}
                                    onChange={e => setNewContent(e.target.value)}
                                    placeholder="What's on your mind? Share a resource, ask a question, or start a discussion..."
                                    className="bg-white/5 border-white/10 rounded-xl resize-none min-h-[120px]"
                                />
                                <Button
                                    onClick={() => createPostMutation.mutate()}
                                    disabled={!newTitle.trim() || createPostMutation.isPending}
                                    className="w-full rounded-xl h-11 bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90"
                                >
                                    {createPostMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Plus className="w-4 h-4 mr-2" />
                                    )}
                                    Publish Post
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search + Filter Bar */}
                <div className="flex gap-3 flex-col sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search posts..."
                            className="pl-9 bg-white/5 border-white/10 rounded-xl"
                        />
                    </div>
                    <div className="flex gap-2">
                        {CATEGORIES.map(cat => (
                            <Button
                                key={cat.id}
                                variant={activeCategory === cat.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setActiveCategory(cat.id)}
                                className={`rounded-xl gap-1.5 border-white/10 ${activeCategory === cat.id ? "bg-primary" : "bg-white/5 hover:bg-white/10"}`}
                            >
                                <cat.icon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{cat.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Posts Feed */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : sorted.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16 space-y-4"
                        >
                            <Globe className="w-12 h-12 text-muted-foreground mx-auto" />
                            <h3 className="text-xl font-bold">No posts yet</h3>
                            <p className="text-muted-foreground text-sm">Be the first to start a discussion!</p>
                            <Button onClick={() => setShowCreate(true)} className="rounded-xl bg-gradient-to-r from-primary to-cyan-500">
                                <Plus className="w-4 h-4 mr-2" /> Create First Post
                            </Button>
                        </motion.div>
                    ) : (
                        sorted.map((post: any) => (
                            <PostCard key={post.id} post={post} />
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
