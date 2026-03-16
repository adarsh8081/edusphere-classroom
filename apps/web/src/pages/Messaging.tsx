import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { io, Socket } from "socket.io-client";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Send, Users, MessageSquare, Search, Plus, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Messaging() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [selectedConversation, setSelectedConversation] = useState<any>(null);
    const [message, setMessage] = useState("");
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // New conversation dialog state
    const [showNewConv, setShowNewConv] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: conversations } = useQuery<any[]>({
        queryKey: ["/api/conversations"],
    });

    const { data: messages } = useQuery<any[]>({
        queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
        enabled: !!selectedConversation,
    });

    // User search for new conversations
    const { data: searchResults } = useQuery<any[]>({
        queryKey: ["/api/users/search", searchQuery],
        queryFn: async () => {
            if (searchQuery.length < 2) return [];
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
            return res.json();
        },
        enabled: searchQuery.length >= 2,
    });

    useEffect(() => {
        const newSocket = io(window.location.origin);
        setSocket(newSocket);

        newSocket.on("new_message", (msg) => {
            queryClient.setQueryData(["/api/conversations", msg.conversationId, "messages"], (old: any[] | undefined) => {
                return old ? [...old, msg] : [msg];
            });
            queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        });

        newSocket.on("user_typing", (data) => {
            if (data.conversationId === selectedConversation?.id && data.userId !== user?.id) {
                setIsTyping(true);
                setTimeout(() => setIsTyping(false), 3000);
            }
        });

        return () => { newSocket.disconnect(); };
    }, [selectedConversation, user?.id, queryClient]);

    useEffect(() => {
        if (selectedConversation && socket) {
            socket.emit("join_conversation", selectedConversation.id);
        }
    }, [selectedConversation, socket]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const startConversation = useMutation({
        mutationFn: async (otherUserId: string) => {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'direct', participants: [otherUserId] })
            });
            if (!res.ok) throw new Error("Failed to create conversation");
            return res.json();
        },
        onSuccess: (newConv) => {
            queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
            setSelectedConversation(newConv);
            setShowNewConv(false);
            setSearchQuery("");
            toast({ title: "Conversation started!" });
        },
        onError: () => {
            toast({ title: "Failed to start conversation", variant: "destructive" });
        }
    });

    const sendMessageMutation = useMutation({
        mutationFn: async () => {
            if (!selectedConversation || !message.trim()) return;
            const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: message }),
            });
            return res.json();
        },
        onSuccess: () => {
            setMessage("");
            queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation?.id, "messages"] });
        },
    });

    const handleTyping = () => {
        if (socket && selectedConversation) {
            socket.emit("typing", { conversationId: selectedConversation.id, userId: user?.id });
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            <Navbar />
            <div className="flex flex-1 overflow-hidden border-t">
                {/* Sidebar */}
                <div className={`w-full md:w-80 border-r flex-col bg-muted/10 ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold tracking-tight">Messages</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                onClick={() => setShowNewConv(true)}
                                title="New Conversation"
                            >
                                <Plus size={18} />
                            </Button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 text-muted-foreground" size={16} />
                            <Input className="pl-9 bg-muted/50 border-none rounded-xl h-9" placeholder="Search chats..." />
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {conversations?.length === 0 && (
                                <div className="text-center py-12 px-4 text-muted-foreground">
                                    <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No conversations yet.</p>
                                    <Button variant="link" className="text-xs mt-1" onClick={() => setShowNewConv(true)}>
                                        Start one now
                                    </Button>
                                </div>
                            )}
                            {conversations?.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${selectedConversation?.id === conv.id ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-muted/50"
                                        }`}
                                >
                                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                        <AvatarFallback className="bg-primary/5 text-primary">
                                            {conv.name ? conv.name[0] : <Users size={20} />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="font-semibold text-sm truncate uppercase tracking-wide">
                                            {conv.name || "Direct Message"}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate italic">
                                            {conv.lastMessage?.content || "No messages yet"}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Chat Area */}
                {selectedConversation ? (
                    <div className={`flex-1 flex-col bg-[#fafafa] dark:bg-card/30 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4 border-b bg-background flex items-center justify-between shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" className="md:hidden shrink-0 -ml-2 mr-1" onClick={() => setSelectedConversation(null)}>
                                    <ArrowLeft size={20} />
                                </Button>
                                <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                                    <AvatarFallback className="bg-primary/5 text-primary">
                                        {selectedConversation.name ? selectedConversation.name[0] : "D"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-sm tracking-tight">{selectedConversation.name || "Chat"}</h3>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse">
                                        {isTyping ? "Typing..." : "Online"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-6">
                                {messages?.map((msg) => {
                                    const isMe = msg.senderId === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                            <div className="flex items-end gap-2 max-w-[75%] group">
                                                {!isMe && (
                                                    <Avatar className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <AvatarFallback className="text-[10px] bg-primary/20">U</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={`p-3.5 rounded-2xl text-sm shadow-sm transition-all hover:shadow-md ${isMe
                                                    ? "bg-primary text-primary-foreground rounded-br-none"
                                                    : "bg-background border border-muted/50 rounded-bl-none"
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                            <span className="text-[10px] mt-1.5 font-medium text-muted-foreground/60 px-1 uppercase tracking-tighter">
                                                {format(new Date(msg.createdAt), "h:mm a")}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        <div className="p-6 bg-background/50 backdrop-blur-md border-t z-10">
                            <div className="flex gap-2 max-w-4xl mx-auto">
                                <Input
                                    placeholder="Write your message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") sendMessageMutation.mutate();
                                        handleTyping();
                                    }}
                                    className="rounded-2xl border-none bg-muted/30 focus-visible:ring-primary shadow-inner"
                                />
                                <Button
                                    onClick={() => sendMessageMutation.mutate()}
                                    disabled={sendMessageMutation.isPending || !message.trim()}
                                    className="rounded-2xl px-6 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform"
                                >
                                    <Send size={18} />
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:flex flex-1 flex-col items-center justify-center text-muted-foreground p-12 bg-muted/5 backdrop-blur-sm">
                        <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6 shadow-inner animate-bounce">
                            <MessageSquare size={48} className="text-primary/40" />
                        </div>
                        <h3 className="text-2xl font-black bg-gradient-to-br from-primary to-blue-600 bg-clip-text text-transparent">Connect & Collaborate</h3>
                        <p className="text-sm font-medium mt-2 max-w-xs text-center opacity-70">
                            Select a conversation or start a new one to communicate with your classmates and teachers.
                        </p>
                        <Button className="mt-6 rounded-full" onClick={() => setShowNewConv(true)}>
                            <Plus size={16} className="mr-2" /> New Conversation
                        </Button>
                    </div>
                )}
            </div>

            {/* New Conversation Dialog */}
            <Dialog open={showNewConv} onOpenChange={setShowNewConv}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>New Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                            <Input
                                className="pl-9"
                                placeholder="Search classmates or teachers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1 max-h-64 overflow-y-auto">
                            {searchQuery.length < 2 && (
                                <p className="text-sm text-muted-foreground text-center py-4">Type at least 2 characters to search</p>
                            )}
                            {searchQuery.length >= 2 && searchResults?.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">No users found in your classes</p>
                            )}
                            {searchResults?.map((u) => (
                                <button
                                    key={u.id}
                                    onClick={() => startConversation.mutate(u.id)}
                                    disabled={startConversation.isPending}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                                >
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                                            {u.name[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{u.name}</p>
                                        <p className="text-xs text-muted-foreground truncate capitalize">{u.role}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowNewConv(false); setSearchQuery(""); }}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
