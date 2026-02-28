import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Message {
    role: 'user' | 'bot';
    content: string;
    sources?: string[];
}

export function BotChatWidget({ classId }: { classId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: 'Hi! I am your AI Teaching Assistant. Ask me anything about this class.' }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load history if any
    const { data: history } = useQuery({
        queryKey: [`/api/ai/bot/history/${classId}`],
        enabled: isOpen,
    });

    useEffect(() => {
        if (history && Array.isArray(history)) {
            const historicalMessages: Message[] = [];
            // DB stores { question, answer, sources }
            // Map it out to user/bot message pairs
            history.slice().reverse().forEach((item: any) => {
                historicalMessages.push({ role: 'user', content: item.question });
                historicalMessages.push({ role: 'bot', content: item.answer, sources: item.sources });
            });
            // Append initial greeting at start
            setMessages([{ role: 'bot', content: 'Hi! I am your AI Teaching Assistant. Ask me anything about this class.' }, ...historicalMessages]);
        }
    }, [history]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const askMutation = useMutation({
        mutationFn: async (question: string) => {
            const res = await apiRequest("POST", "/api/ai/bot/ask", { question, classId });
            return res.json();
        },
        onSuccess: (data) => {
            setMessages((prev) => [...prev, { role: 'bot', content: data.answer, sources: data.sources }]);
        },
        onError: () => {
            setMessages((prev) => [...prev, { role: 'bot', content: "Sorry, I had trouble processing your question. Please try again." }]);
        }
    });

    const handleSend = () => {
        if (!input.trim()) return;
        const questionText = input.trim();
        setMessages((prev) => [...prev, { role: 'user', content: questionText }]);
        setInput("");
        askMutation.mutate(questionText);
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-2xl shadow-lg shadow-primary/30 z-50 bg-gradient-to-br from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 hover:scale-105 hover:-translate-y-1 transition-all duration-300 border border-white/20 group"
            >
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <MessageSquare className="h-6 w-6 text-white drop-shadow-md relative z-10" />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-80 md:w-96 h-[32rem] shadow-2xl z-50 flex flex-col glossy-panel border-white/20 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between pb-3 bg-white/5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-inner border border-primary/30">
                        <Bot className="h-6 w-6 text-primary drop-shadow-sm" />
                    </div>
                    <CardTitle className="text-lg font-bold drop-shadow-sm">Classroom Assistant</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden relative z-10">
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4 pb-2">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-4 text-[15px] flex flex-col shadow-md border ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-sm border-white/20'
                                    : 'bg-black/5 dark:bg-white/5 text-foreground rounded-tl-sm border-white/10 backdrop-blur-md'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-2 opacity-80 border-b border-current/10 pb-1 w-full justify-between">
                                        <div className="flex items-center gap-2">
                                            {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                                            <span className="text-xs font-bold tracking-wide uppercase">{msg.role === 'user' ? 'You' : 'Assistant'}</span>
                                        </div>
                                    </div>
                                    <div className="leading-relaxed whitespace-pre-wrap font-medium">
                                        {msg.content}
                                    </div>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-current/10 text-xs opacity-90 flex gap-1.5 flex-wrap w-full">
                                            <span className="font-bold block w-full text-[10px] uppercase tracking-wider mb-1">Sources:</span>
                                            {msg.sources.map((s, si) => (
                                                <span key={si} className="bg-background/40 backdrop-blur-sm text-foreground px-2 py-1 rounded-md truncate max-w-[150px] shadow-inner font-medium border border-white/10">{typeof s === 'string' ? s.split('-')[0] : 'Doc'}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {askMutation.isPending && (
                            <div className="flex justify-start">
                                <div className="bg-black/5 dark:bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 rounded-tl-sm flex items-center gap-3 shadow-md">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary drop-shadow-sm" />
                                    <span className="text-sm font-bold text-foreground/80">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-white/10 bg-black/10 dark:bg-black/20 backdrop-blur-lg">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-3 relative"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-1 rounded-xl bg-background/50 border-white/10 h-12 px-4 shadow-inner focus:ring-primary/40 text-base"
                            disabled={askMutation.isPending}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="rounded-xl shrink-0 h-12 w-12 hover-elevate shadow-md shadow-primary/20"
                            disabled={!input.trim() || askMutation.isPending}
                        >
                            <Send className="h-5 w-5 drop-shadow-sm text-white" />
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
