import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles, BookOpen, ListChecks, BrainCircuit, AlertTriangle,
    ChevronDown, ChevronUp, Loader2, Copy, Check
} from "lucide-react";
import { useToast as useToastAlias } from "@/hooks/use-toast";

interface AIToolResult {
    tool: string;
    content: string;
}

export function TeacherAIPanel({ classId }: { classId: string }) {
    const { toast } = useToast();
    const [expanded, setExpanded] = useState(false);
    const [result, setResult] = useState<AIToolResult | null>(null);
    const [inputText, setInputText] = useState("");
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const runTool = useMutation({
        mutationFn: async ({ tool, body }: { tool: string, body: any }) => {
            let endpoint = "";
            if (tool === "quiz") endpoint = "/api/ai/quiz";
            else if (tool === "lesson") endpoint = "/api/ai/lesson-plan";
            else if (tool === "summary") endpoint = "/api/ai/summarize";

            const res = await apiRequest("POST", endpoint, body);
            const data = await res.json();
            return { tool, data };
        },
        onSuccess: ({ tool, data }) => {
            let content = "";
            if (tool === "quiz") content = JSON.stringify(data, null, 2);
            else if (tool === "lesson") content = data.plan;
            else if (tool === "summary") content = data.summary;
            setResult({ tool, content });
        },
        onError: () => {
            toast({ variant: "destructive", title: "AI tool failed. Please try again." });
        }
    });

    const copyResult = () => {
        if (result?.content) {
            navigator.clipboard.writeText(result.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast({ title: "Copied to clipboard!" });
        }
    };

    const TOOLS = [
        {
            id: "quiz",
            label: "Generate Quiz",
            icon: ListChecks,
            color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
            description: "Auto-create quiz questions from any content",
            action: () => {
                if (!inputText.trim()) return toast({ title: "Enter some content first", variant: "destructive" });
                setActiveTool("quiz");
                runTool.mutate({ tool: "quiz", body: { text: inputText } });
            }
        },
        {
            id: "lesson",
            label: "Lesson Plan",
            icon: BookOpen,
            color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
            description: "Generate a structured lesson plan from a topic",
            action: () => {
                if (!inputText.trim()) return toast({ title: "Enter a topic first", variant: "destructive" });
                setActiveTool("lesson");
                runTool.mutate({ tool: "lesson", body: { topic: inputText, grade: "General", duration: "45 minutes", objectives: [] } });
            }
        },
        {
            id: "summary",
            label: "Summarize",
            icon: BrainCircuit,
            color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
            description: "Get an AI summary of any text or resource",
            action: () => {
                if (!inputText.trim()) return toast({ title: "Enter text to summarize", variant: "destructive" });
                setActiveTool("summary");
                runTool.mutate({ tool: "summary", body: { text: inputText } });
            }
        },
    ];

    return (
        <Card className="glass-panel border-white/10 rounded-2xl overflow-hidden">
            <CardHeader
                className="py-3 px-4 cursor-pointer flex flex-row items-center justify-between hover:bg-white/5 transition-colors"
                onClick={() => setExpanded(v => !v)}
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle className="text-sm font-bold">AI Teaching Assistant</CardTitle>
                    <Badge variant="outline" className="text-[9px] border-primary/30 bg-primary/5 text-primary rounded-full px-2">Teachers Only</Badge>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </CardHeader>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <CardContent className="px-4 pb-4 space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                                    Topic / Content
                                </label>
                                <Textarea
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    placeholder="Paste content, enter a topic, or write notes here for AI to process..."
                                    className="bg-white/5 border-white/10 rounded-xl resize-none text-sm"
                                    rows={4}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {TOOLS.map(tool => {
                                    const Icon = tool.icon;
                                    const isLoading = runTool.isPending && activeTool === tool.id;
                                    return (
                                        <motion.button
                                            key={tool.id}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={tool.action}
                                            disabled={runTool.isPending}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${tool.color} hover:ring-1 hover:ring-current/30 disabled:opacity-50`}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Icon className="w-5 h-5" />
                                            )}
                                            <span className="text-[11px] font-bold leading-tight">{tool.label}</span>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <AnimatePresence>
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="bg-white/5 rounded-xl p-3 border border-white/10 relative"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                {result.tool === "quiz" ? "Generated Quiz" : result.tool === "lesson" ? "Lesson Plan" : "Summary"}
                                            </p>
                                            <button
                                                onClick={copyResult}
                                                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                {copied ? "Copied!" : "Copy"}
                                            </button>
                                        </div>
                                        <pre className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto font-sans">
                                            {result.content}
                                        </pre>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
