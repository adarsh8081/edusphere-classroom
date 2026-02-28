import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import {
    Hash,
    Settings,
    MessageSquare,
    Mic,
    Plus,
    Search,
    Bell,
    Users,
    ShieldCheck,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

export default function Guilds() {
    const [activeGuild, setActiveGuild] = useState<string | null>(null);
    const [activeChannel, setActiveChannel] = useState<string | null>(null);

    const { data: guilds } = useQuery({
        queryKey: [api.guilds.list.path],
        queryFn: async () => {
            const res = await fetch(api.guilds.list.path);
            return res.json();
        }
    });

    const { data: channels } = useQuery({
        queryKey: [api.guilds.channels.path, activeGuild],
        enabled: !!activeGuild,
        queryFn: async () => {
            const url = buildUrl(api.guilds.channels.path, { guildId: activeGuild! });
            const res = await fetch(url);
            return res.json();
        }
    });

    // Mocking some guilds if empty for now to show the UI
    const displayGuilds = guilds?.length ? guilds : [
        { id: "1", name: "Web Dev Guild", iconUrl: null },
        { id: "2", name: "AI Research", iconUrl: null },
        { id: "3", name: "UI/UX Design", iconUrl: null }
    ];

    const displayChannels = channels?.length ? channels : [
        { id: "c1", name: "general", type: "text" },
        { id: "c2", name: "resources", type: "text" },
        { id: "c3", name: "voice-lounge", type: "voice" }
    ];

    if (!activeGuild && displayGuilds.length > 0) {
        setActiveGuild(displayGuilds[0].id);
    }

    return (
        <div className="h-screen flex flex-col relative z-20">
            <Navbar />

            <div className="flex-1 flex overflow-hidden">
                {/* Guild Sidebar (Discord style) */}
                <div className="w-[72px] bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col items-center py-4 gap-4 overflow-y-auto scroll-hide">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group cursor-pointer hover:rounded-xl transition-all duration-300">
                        <Plus className="w-6 h-6" />
                    </div>
                    <div className="w-8 h-[2px] bg-white/10 rounded-full"></div>

                    {displayGuilds.map((guild: any) => (
                        <div
                            key={guild.id}
                            onClick={() => setActiveGuild(guild.id)}
                            className={`w-12 h-12 rounded-[24px] relative group cursor-pointer hover:rounded-xl transition-all duration-300 flex items-center justify-center font-bold text-lg
                    ${activeGuild === guild.id ? "rounded-xl bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:bg-primary/80 hover:text-white"}`}
                        >
                            {activeGuild === guild.id && <div className="absolute -left-4 w-2 h-8 bg-white rounded-r-full"></div>}
                            {guild.iconUrl ? <img src={guild.iconUrl} className="w-full h-full rounded-inherit" /> : guild.name.charAt(0)}

                            {/* Tooltip */}
                            <div className="absolute left-[70px] bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                                {guild.name}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Channel Sidebar */}
                <div className="w-60 bg-black/20 backdrop-blur-2xl border-r border-white/5 flex flex-col">
                    <div className="h-14 px-4 flex items-center justify-between border-b border-white/5">
                        <h2 className="font-display font-bold truncate">Academy Guild</h2>
                        <Settings className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-white transition-colors" />
                    </div>

                    <ScrollArea className="flex-1 px-2 py-4">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-2">Text Channels</h3>
                                <div className="space-y-0.5">
                                    {(displayChannels as any[]).filter(c => c.type === 'text').map((channel: any) => (
                                        <div
                                            key={channel.id}
                                            onClick={() => setActiveChannel(channel.id)}
                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer group transition-colors
                                ${activeChannel === channel.id ? "bg-white/10 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                                        >
                                            <Hash className="w-4 h-4 opacity-50" />
                                            <span className="font-medium text-sm">{channel.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-2">Voice Channels</h3>
                                <div className="space-y-0.5">
                                    {(displayChannels as any[]).filter(c => c.type === 'voice').map((channel: any) => (
                                        <div key={channel.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground cursor-pointer group transition-colors">
                                            <Mic className="w-4 h-4 opacity-50" />
                                            <span className="font-medium text-sm">{channel.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* User Profile Footer */}
                    <div className="p-3 bg-black/40 border-t border-white/5 flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-primary/20">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">UN</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">Student.User</p>
                            <p className="text-[10px] text-muted-foreground truncate italic">#LearningPath</p>
                        </div>
                        <Settings className="w-4 h-4 text-muted-foreground hover:text-white cursor-pointer" />
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-black/10 backdrop-blur-md flex flex-col">
                    <header className="h-14 px-4 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <Hash className="w-5 h-5 text-muted-foreground" />
                            <h3 className="font-bold">general</h3>
                            <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
                            <p className="text-xs text-muted-foreground italic">Welcome to the general channel of the academy!</p>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <Bell className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                            <Users className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                            <div className="bg-white/5 rounded-md px-2 py-1 flex items-center gap-2 border border-white/5">
                                <Search className="w-4 h-4" />
                                <span className="text-xs">Search</span>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-hidden flex flex-col p-4 space-y-4">
                        <ScrollArea className="flex-1">
                            <div className="space-y-8 pb-10">
                                <div className="flex flex-col items-center justify-center pt-20 pb-10 text-center space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                        <Hash className="w-10 h-10" />
                                    </div>
                                    <h1 className="text-4xl font-display font-extrabold">Welcome to #general!</h1>
                                    <p className="text-muted-foreground">This is the start of the #general channel in this guild.</p>
                                    <Button className="rounded-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20">
                                        Invite Your Peers
                                    </Button>
                                </div>

                                {/* Placeholder Messages */}
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-4 group">
                                        <Avatar className="h-10 w-10 mt-1">
                                            <AvatarFallback className="bg-indigo-500/20 text-indigo-400">AI</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-primary hover:underline cursor-pointer">Academy-Bot</span>
                                                <span className="bg-primary/20 text-[10px] text-primary px-1 rounded font-bold uppercase tracking-tighter">Bot</span>
                                                <span className="text-[10px] text-muted-foreground">Today at 2:0{i} PM</span>
                                            </div>
                                            <p className="text-sm mt-0.5 leading-relaxed text-foreground/90">
                                                {i === 1 ? "Welcome to the new EduSphere v2 Collaborative Guilds! Start sharing resources here." :
                                                    i === 2 ? "You can use the AI quiz generator in the side panel to test your knowledge on this week's topics." :
                                                        "Remember to check the #voice-lounge for study groups!"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="mt-auto px-1">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2 focus-within:ring-1 focus-within:ring-primary/40 transition-all">
                                <div className="flex items-center gap-2 opacity-50">
                                    <Plus className="w-5 h-5 cursor-pointer hover:text-white" />
                                    <span className="text-xs flex-1">Message #general</span>
                                    <Zap className="w-4 h-4 text-primary cursor-pointer hover:scale-110 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
