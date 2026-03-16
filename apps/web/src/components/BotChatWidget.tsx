import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Copy, Check, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface Message {
    role: 'user' | 'bot';
    content: string;
    sources?: string[];
}

const SUGGESTED_PROMPTS = [
    "Summarize today's lesson",
    "Give me 3 quiz questions",
    "Explain in simpler terms",
    "What are the key concepts?",
    "Create study notes",
];

// Typing animation for bot messages
function TypingMessage({ content }: { content: string }) {
    const [displayed, setDisplayed] = useState("");
    const [done, setDone] = useState(false);

    useEffect(() => {
        setDisplayed("");
        setDone(false);
        let i = 0;
        const interval = setInterval(() => {
            setDisplayed(content.slice(0, i + 1));
            i++;
            if (i >= content.length) {
                clearInterval(interval);
                setDone(true);
            }
        }, 8); // ~125 chars/sec
        return () => clearInterval(interval);
    }, [content]);

    return (
        <span className="whitespace-pre-wrap leading-relaxed">
            {displayed}
            {!done && <span className="animate-pulse inline-block w-0.5 h-4 bg-current ml-0.5 align-middle" />}
        </span>
    );
}

export function BotChatWidget({ classId }: { classId: string }) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: '👋 Hi! I\'m your AI Teaching Assistant powered by Gemini. I can answer questions about this class, summarize content, generate quizzes and more.' }
    ]);
    const [lastBotMessageIndex, setLastBotMessageIndex] = useState<number>(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: history } = useQuery({
        queryKey: [`/api/ai/bot/history/${classId}`],
        enabled: isOpen,
    });

    useEffect(() => {
        if (history && Array.isArray(history) && (history as any[]).length > 0) {
            const historicalMessages: Message[] = [];
            (history as any[]).slice().reverse().forEach((item: any) => {
                historicalMessages.push({ role: 'user', content: item.question });
                historicalMessages.push({ role: 'bot', content: item.answer, sources: item.sources });
            });
            setMessages([
                { role: 'bot', content: '👋 Hi! I\'m your AI Teaching Assistant powered by Gemini. I can answer questions about this class, summarize content, generate quizzes and more.' },
                ...historicalMessages
            ]);
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
            const nextIndex = messages.length + 1; // +1 for the user message already added
            setMessages(prev => {
                const newMsgs = [...prev, { role: 'bot' as const, content: data.answer, sources: data.sources }];
                setLastBotMessageIndex(newMsgs.length - 1);
                return newMsgs;
            });
        },
        onError: () => {
            setMessages(prev => [...prev, { role: 'bot' as const, content: "⚠️ Sorry, I had trouble processing that. Please try again." }]);
        }
    });

    const handleSend = (text?: string) => {
        const questionText = (text || input).trim();
        if (!questionText) return;
        setMessages(prev => [...prev, { role: 'user', content: questionText }]);
        setInput("");
        askMutation.mutate(questionText);
    };

    const copyToClipboard = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
        toast({ title: "Copied to clipboard!" });
    };

    if (!isOpen) {
        return (
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="fixed bottom-6 right-6 z-50"
            >
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-2xl shadow-lg shadow-primary/30 bg-gradient-to-br from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 hover:scale-105 hover:-translate-y-1 transition-all duration-300 border border-white/20 group relative"
                >
                    <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <MessageSquare className="h-6 w-6 text-white drop-shadow-md relative z-10" />
                    {/* Pulsing ring */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl bg-primary/40"
                        animate={{ scale: [1, 1.4, 1.7], opacity: [0.5, 0.2, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 w-80 md:w-96 h-[36rem] shadow-2xl z-50 flex flex-col"
        >
            <Card className="h-full flex flex-col glossy-panel border-white/20 rounded-3xl overflow-hidden">
                {/* Header */}
                <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between pb-3 bg-gradient-to-r from-primary/5 to-cyan-500/5 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-inner border border-white/20"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
                        >
                            <Bot className="h-5 w-5 text-white" />
                        </motion.div>
                        <div>
                            <CardTitle className="text-sm font-bold">AI Assistant</CardTitle>
                            <Badge variant="outline" className="text-[8px] border-primary/30 bg-primary/5 text-primary rounded-full px-2 py-0 h-4 gap-0.5 mt-0.5">
                                <Zap className="w-2 h-2" /> Powered by Gemini
                            </Badge>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10" onClick={() => setIsOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent className="flex-1 p-0 flex flex-col overflow-hidden min-h-0">
                    <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                        <div className="space-y-3 pb-1">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`relative max-w-[88%] rounded-2xl p-3 text-sm flex flex-col shadow-md border group
                                        ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-none border-white/20'
                                            : 'bg-black/5 dark:bg-white/5 text-foreground rounded-tl-none border-white/10 backdrop-blur-md'
                                        }`}
                                    >
                                        <div className="leading-relaxed">
                                            {/* Typing animation only for the latest bot message */}
                                            {msg.role === 'bot' && i === lastBotMessageIndex && !askMutation.isPending ? (
                                                <TypingMessage content={msg.content} />
                                            ) : (
                                                <span className="whitespace-pre-wrap">{msg.content}</span>
                                            )}
                                        </div>

                                        {/* Sources */}
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-current/10 text-[10px] flex gap-1 flex-wrap">
                                                <span className="font-bold opacity-60 w-full text-[9px] uppercase tracking-widest">Sources</span>
                                                {msg.sources.map((s, si) => (
                                                    <span key={si} className="bg-background/30 px-2 py-0.5 rounded-full border border-white/10 font-medium">
                                                        {typeof s === 'string' ? s.slice(0, 12) : 'Doc'}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Copy button for bot messages */}
                                        {msg.role === 'bot' && (
                                            <button
                                                onClick={() => copyToClipboard(msg.content, i)}
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                                            >
                                                {copiedIndex === i ? (
                                                    <Check className="w-3 h-3 text-emerald-400" />
                                                ) : (
                                                    <Copy className="w-3 h-3 text-muted-foreground" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Thinking indicator */}
                            <AnimatePresence>
                                {askMutation.isPending && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex justify-start"
                                    >
                                        <div className="bg-black/5 dark:bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-none p-3 flex items-center gap-2 shadow-md">
                                            <div className="flex gap-1">
                                                {[0, 1, 2].map(i => (
                                                    <motion.div
                                                        key={i}
                                                        className="w-2 h-2 rounded-full bg-primary"
                                                        animate={{ y: [-2, 2, -2] }}
                                                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground">Thinking...</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </ScrollArea>

                    {/* Suggested Prompts */}
                    {messages.length <= 1 && !askMutation.isPending && (
                        <div className="px-3 pb-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Quick prompts
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {SUGGESTED_PROMPTS.map(prompt => (
                                    <button
                                        key={prompt}
                                        onClick={() => handleSend(prompt)}
                                        className="text-xs border border-white/10 rounded-full px-3 py-1 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all text-muted-foreground font-medium"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-3 border-t border-white/10 bg-black/10 flex-shrink-0">
                        <form
                            onSubmit={e => { e.preventDefault(); handleSend(); }}
                            className="flex gap-2"
                        >
                            <Input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ask anything about this class..."
                                className="flex-1 rounded-xl bg-background/50 border-white/10 h-10 px-3 shadow-inner focus:ring-primary/40 text-sm"
                                disabled={askMutation.isPending}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="rounded-xl shrink-0 h-10 w-10 hover-elevate shadow-md shadow-primary/20"
                                disabled={!input.trim() || askMutation.isPending}
                            >
                                <Send className="h-4 w-4 text-white" />
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
