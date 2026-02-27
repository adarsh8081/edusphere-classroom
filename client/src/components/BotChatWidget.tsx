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
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 hover:scale-105 transition-transform"
            >
                <MessageSquare className="h-6 w-6 text-primary-foreground" />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-80 md:w-96 h-[32rem] shadow-xl z-50 flex flex-col border-primary/20 backdrop-blur-xl bg-background/95">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <CardTitle className="text-md font-medium">Classroom Assistant</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4 pb-2">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm flex flex-col ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                        : 'bg-muted text-foreground rounded-tl-sm'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-1 opacity-70 border-b border-primary/20 pb-1 w-full justify-between">
                                        <div className="flex items-center gap-2">
                                            {msg.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                                            <span className="text-xs font-medium">{msg.role === 'user' ? 'You' : 'Assistant'}</span>
                                        </div>
                                    </div>
                                    <div className="leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </div>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-border/50 text-xs opacity-80 flex gap-1 flex-wrap w-full">
                                            <span className="font-semibold block w-full">Sources:</span>
                                            {msg.sources.map((s, si) => (
                                                <span key={si} className="bg-background/80 text-foreground px-1.5 py-0.5 rounded truncate max-w-[150px] shadow-sm">{typeof s === 'string' ? s.split('-')[0] : 'Doc'}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {askMutation.isPending && (
                            <div className="flex justify-start">
                                <div className="bg-muted rounded-2xl p-3 rounded-tl-sm flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-sm text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-3 border-t bg-background/50">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-1 rounded-full bg-background"
                            disabled={askMutation.isPending}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="rounded-full shrink-0"
                            disabled={!input.trim() || askMutation.isPending}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
