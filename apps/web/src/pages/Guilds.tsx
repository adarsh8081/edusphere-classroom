import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Hash, Plus, Settings, Bell, Users, Send, Search,
    Zap, ChevronRight, Loader2, X, UserPlus, Sword
} from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const GUILD_COLORS = [
    "from-violet-500 to-purple-700",
    "from-cyan-500 to-blue-700",
    "from-emerald-500 to-teal-700",
    "from-rose-500 to-pink-700",
    "from-amber-500 to-orange-700",
];

export default function Guilds() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [activeGuildId, setActiveGuildId] = useState<string | null>(null);
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState("");
    const [showCreateGuild, setShowCreateGuild] = useState(false);
    const [newGuildName, setNewGuildName] = useState("");
    const [newGuildDesc, setNewGuildDesc] = useState("");

    // Fetch guilds
    const { data: guilds = [], isLoading: guildsLoading } = useQuery({
        queryKey: ["/api/guilds"],
        queryFn: async () => {
            const res = await fetch("/api/guilds", { credentials: "include" });
            if (!res.ok) return [];
            return res.json();
        },
    });

    // Fetch channels for active guild
    const { data: channels = [] } = useQuery({
        queryKey: [`/api/guilds/${activeGuildId}/channels`],
        queryFn: async () => {
            const res = await fetch(`/api/guilds/${activeGuildId}/channels`, { credentials: "include" });
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!activeGuildId,
    });

    // Fetch messages for active channel
    const { data: messages = [], isLoading: messagesLoading } = useQuery({
        queryKey: [`/api/guilds/${activeGuildId}/channels/${activeChannelId}/messages`],
        queryFn: async () => {
            const res = await fetch(`/api/guilds/${activeGuildId}/channels/${activeChannelId}/messages`, { credentials: "include" });
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!activeGuildId && !!activeChannelId,
        refetchInterval: 3000, // Poll every 3s for new messages
    });

    // Auto-select first guild + channel
    useEffect(() => {
        if (guilds.length > 0 && !activeGuildId) {
            setActiveGuildId(guilds[0].id);
        }
    }, [guilds]);

    useEffect(() => {
        if (channels.length > 0 && (!activeChannelId || !channels.find((c: any) => c.id === activeChannelId))) {
            setActiveChannelId(channels[0].id);
        }
    }, [channels]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await apiRequest("POST", `/api/guilds/${activeGuildId}/channels/${activeChannelId}/messages`, { content });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/guilds/${activeGuildId}/channels/${activeChannelId}/messages`] });
        },
        onError: () => {
            toast({ variant: "destructive", title: "Failed to send message." });
        }
    });

    const createGuildMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/guilds", {
                name: newGuildName,
                description: newGuildDesc,
            });
            return res.json();
        },
        onSuccess: (guild: any) => {
            queryClient.invalidateQueries({ queryKey: ["/api/guilds"] });
            setShowCreateGuild(false);
            setNewGuildName("");
            setNewGuildDesc("");
            setActiveGuildId(guild.id);
            toast({ title: `✅ Guild "${guild.name}" created!` });
        },
        onError: () => {
            toast({ variant: "destructive", title: "Failed to create guild." });
        }
    });

    const joinGuildMutation = useMutation({
        mutationFn: async (guildId: string) => {
            const res = await apiRequest("POST", `/api/guilds/${guildId}/join`, {});
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/guilds"] });
            toast({ title: "✅ Joined guild!" });
        }
    });

    const handleSend = () => {
        if (!messageInput.trim()) return;
        sendMessageMutation.mutate(messageInput.trim());
        setMessageInput("");
    };

    const activeGuild = guilds.find((g: any) => g.id === activeGuildId);
    const activeChannel = channels.find((c: any) => c.id === activeChannelId);

    const getGuildGradient = (idx: number) => GUILD_COLORS[idx % GUILD_COLORS.length];
    const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen relative z-20 pt-4">
            <Navbar />
            <div className="max-w-7xl mx-auto px-2 sm:px-4">
                <div className="flex h-[calc(100vh-9rem)] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/20 backdrop-blur-2xl">

                    {/* Guild List Sidebar */}
                    <div className="w-16 sm:w-20 bg-black/40 flex flex-col items-center py-4 gap-3 border-r border-white/5">
                        {guildsLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        ) : (
                            guilds.map((guild: any, idx: number) => (
                                <motion.button
                                    key={guild.id}
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { setActiveGuildId(guild.id); setActiveChannelId(null); }}
                                    className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold text-white text-sm shadow-lg transition-all
                                        bg-gradient-to-br ${getGuildGradient(idx)}
                                        ${activeGuildId === guild.id ? "ring-2 ring-white ring-offset-2 ring-offset-black/40 rounded-xl" : "hover:rounded-xl"}`}
                                    title={guild.name}
                                >
                                    {guild.iconUrl ? (
                                        <img src={guild.iconUrl} alt={guild.name} className="w-full h-full object-cover rounded-inherit" />
                                    ) : (
                                        <span>{getInitials(guild.name)}</span>
                                    )}
                                    {activeGuildId === guild.id && (
                                        <motion.div
                                            layoutId="guild-indicator"
                                            className="absolute -left-2 w-1 h-8 bg-white rounded-r-full"
                                        />
                                    )}
                                </motion.button>
                            ))
                        )}

                        <div className="h-px w-8 bg-white/10 my-1" />

                        {/* Create Guild Button */}
                        <Dialog open={showCreateGuild} onOpenChange={setShowCreateGuild}>
                            <DialogTrigger asChild>
                                <motion.button
                                    whileHover={{ scale: 1.08, rotate: 90 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 hover:rounded-2xl transition-all"
                                    title="Create a Guild"
                                >
                                    <Plus className="w-5 h-5" />
                                </motion.button>
                            </DialogTrigger>
                            <DialogContent className="glass-panel border-white/10 rounded-3xl max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                        <Sword className="w-5 h-5 text-primary" /> Create a New Guild
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Guild Name</label>
                                        <Input
                                            value={newGuildName}
                                            onChange={e => setNewGuildName(e.target.value)}
                                            placeholder="e.g. Python Warriors"
                                            className="bg-white/5 border-white/10 rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Description</label>
                                        <Textarea
                                            value={newGuildDesc}
                                            onChange={e => setNewGuildDesc(e.target.value)}
                                            placeholder="What's this guild about?"
                                            className="bg-white/5 border-white/10 rounded-xl resize-none"
                                            rows={3}
                                        />
                                    </div>
                                    <Button
                                        onClick={() => createGuildMutation.mutate()}
                                        disabled={!newGuildName.trim() || createGuildMutation.isPending}
                                        className="w-full rounded-xl h-11 bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90"
                                    >
                                        {createGuildMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sword className="w-4 h-4 mr-2" />}
                                        Create Guild
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Channel Sidebar */}
                    <div className="w-52 sm:w-60 bg-black/30 border-r border-white/5 flex flex-col">
                        {activeGuild ? (
                            <>
                                {/* Guild Header */}
                                <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 bg-black/20">
                                    <h2 className="font-display font-bold truncate text-sm">{activeGuild.name}</h2>
                                    <Settings className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                                </div>

                                <ScrollArea className="flex-1 px-2 py-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 mb-2">Text Channels</p>
                                    <div className="space-y-0.5">
                                        {channels.map((channel: any) => (
                                            <motion.button
                                                key={channel.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setActiveChannelId(channel.id)}
                                                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer group transition-colors text-left
                                                    ${activeChannelId === channel.id
                                                        ? "bg-primary/20 text-foreground font-semibold"
                                                        : "text-muted-foreground hover:bg-white/5 dark:hover:bg-white/5 hover:text-foreground"}`}
                                            >
                                                <Hash className="w-4 h-4 opacity-60 flex-shrink-0" />
                                                <span className="font-medium text-sm truncate">{channel.name}</span>
                                            </motion.button>
                                        ))}
                                        {channels.length === 0 && (
                                            <p className="text-xs text-muted-foreground px-2 italic">No channels yet.</p>
                                        )}
                                    </div>
                                </ScrollArea>

                                {/* User info at bottom */}
                                <div className="h-14 px-3 bg-black/30 border-t border-white/5 flex items-center gap-2">
                                    <Avatar className="h-8 w-8 border border-primary/20">
                                        <AvatarImage src={user?.avatarUrl || undefined} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate">{user?.name}</p>
                                        <p className="text-[10px] text-muted-foreground truncate capitalize">{user?.role}</p>
                                    </div>
                                    <Settings className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-4">
                                <div className="text-center space-y-3">
                                    <Sword className="w-8 h-8 text-muted-foreground mx-auto" />
                                    <p className="text-sm text-muted-foreground font-medium">Select or create a guild</p>
                                    <Button size="sm" variant="outline" className="rounded-xl border-white/10" onClick={() => setShowCreateGuild(true)}>
                                        <Plus className="w-4 h-4 mr-2" /> Create Guild
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Channel Header */}
                        {activeChannel ? (
                            <>
                                <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 bg-black/10">
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-bold text-sm">{activeChannel.name}</p>
                                            {activeChannel.topic && (
                                                <p className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">{activeChannel.topic}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-muted-foreground">
                                        <Bell className="w-5 h-5 hover:text-foreground cursor-pointer transition-colors" />
                                        <Users className="w-5 h-5 hover:text-foreground cursor-pointer transition-colors" />
                                        <div className="bg-white/5 rounded-lg px-2 py-1 flex items-center gap-2 border border-white/5">
                                            <Search className="w-4 h-4" />
                                            <span className="text-xs hidden sm:block">Search</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <ScrollArea className="flex-1 px-4 py-4">
                                    {messagesLoading ? (
                                        <div className="flex items-center justify-center h-32">
                                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-col items-center justify-center h-40 gap-3"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                                <Hash className="w-6 h-6 text-primary" />
                                            </div>
                                            <p className="text-muted-foreground text-sm font-medium">Welcome to #{activeChannel.name}!</p>
                                            <p className="text-muted-foreground text-xs">Start the conversation.</p>
                                        </motion.div>
                                    ) : (
                                        <div className="space-y-3">
                                            <AnimatePresence initial={false}>
                                                {(messages as any[]).map((msg: any, idx: number) => {
                                                    const isMe = msg.senderId === user?.id;
                                                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                                                    const isSameAuthor = (prevMsg as any)?.senderId === msg.senderId;
                                                    const showTimestamp = !isSameAuthor || (new Date(msg.createdAt).getTime() - new Date((prevMsg as any)?.createdAt).getTime()) > 5 * 60 * 1000;

                                                    return (
                                                        <motion.div
                                                            key={msg.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className={`flex items-start gap-3 group ${isSameAuthor && !showTimestamp ? "mt-0.5" : "mt-3"}`}
                                                        >
                                                            {(!isSameAuthor || showTimestamp) ? (
                                                                <Avatar className="h-9 w-9 flex-shrink-0 border border-white/10">
                                                                    <AvatarImage src={msg.sender?.avatarUrl} />
                                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                                        {msg.sender?.name?.charAt(0).toUpperCase() || "?"}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            ) : (
                                                                <div className="w-9 flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity">
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                {(!isSameAuthor || showTimestamp) && (
                                                                    <div className="flex items-baseline gap-2 mb-0.5">
                                                                        <span className={`text-sm font-bold ${isMe ? "text-primary" : "text-foreground"}`}>
                                                                            {msg.sender?.name || "Unknown"}
                                                                        </span>
                                                                        <span className="text-[10px] text-muted-foreground">
                                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                            <div ref={messagesEndRef} />
                                        </div>
                                    )}
                                </ScrollArea>

                                {/* Message Input */}
                                <div className="p-3 pb-4 border-t border-white/5 bg-black/10">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col gap-2 focus-within:ring-1 focus-within:ring-primary/40 transition-all">
                                        <form
                                            onSubmit={e => { e.preventDefault(); handleSend(); }}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="flex items-center gap-2 opacity-50 flex-shrink-0">
                                                <Plus className="w-5 h-5 cursor-pointer hover:text-foreground hover:opacity-100" />
                                            </div>
                                            <Input
                                                value={messageInput}
                                                onChange={e => setMessageInput(e.target.value)}
                                                placeholder={`Message #${activeChannel?.name || "channel"}`}
                                                className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-sm px-0 h-8"
                                                disabled={sendMessageMutation.isPending}
                                                onKeyDown={e => {
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSend();
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="submit"
                                                size="icon"
                                                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                                                className="h-8 w-8 rounded-lg flex-shrink-0"
                                            >
                                                {sendMessageMutation.isPending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* No channel selected */
                            <div className="flex-1 flex items-center justify-center">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center space-y-4 p-8 max-w-md"
                                >
                                    {guilds.length === 0 ? (
                                        <>
                                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center mx-auto border border-primary/20">
                                                <Sword className="w-10 h-10 text-primary" />
                                            </div>
                                            <h2 className="text-2xl font-display font-bold">No Guilds Yet</h2>
                                            <p className="text-muted-foreground">Create your first guild to start collaborating with classmates in focused study groups.</p>
                                            <Button
                                                onClick={() => setShowCreateGuild(true)}
                                                className="rounded-xl bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90"
                                            >
                                                <Plus className="w-4 h-4 mr-2" /> Create First Guild
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Sword className="w-12 h-12 text-muted-foreground mx-auto" />
                                            <h2 className="text-xl font-bold">Select a channel</h2>
                                            <p className="text-muted-foreground text-sm">Choose a channel from the sidebar to start chatting.</p>
                                        </>
                                    )}
                                </motion.div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
