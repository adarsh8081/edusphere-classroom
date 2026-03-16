import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@edusphere/api-client";
import { Smile, Meh, Frown, Sparkles, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const moods = [
    { label: "Great", icon: Smile, color: "text-green-500", bg: "bg-green-500/10", score: 5, emoji: "😊" },
    { label: "Good", icon: Smile, color: "text-blue-500", bg: "bg-blue-500/10", score: 4, emoji: "🙂" },
    { label: "Neutral", icon: Meh, color: "text-yellow-500", bg: "bg-yellow-500/10", score: 3, emoji: "😐" },
    { label: "Down", icon: Frown, color: "text-orange-500", bg: "bg-orange-500/10", score: 2, emoji: "😟" },
    { label: "Stressed", icon: Frown, color: "text-red-500", bg: "bg-red-500/10", score: 1, emoji: "😔" },
];

export function MoodSelector({ classId }: { classId: string }) {
    const [selectedMood, setSelectedMood] = useState<number | null>(null);
    const [notes, setNotes] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(api.wellbeing.checkin.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to submit check-in");
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Mood logged!",
                description: "Thank you for sharing how you feel. Your teachers are here to support you.",
            });
            setSelectedMood(null);
            setNotes("");
            queryClient.invalidateQueries({ queryKey: [api.wellbeing.stats.path] });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleSubmit = () => {
        if (selectedMood === null) return;
        const moodObj = moods.find(m => m.score === selectedMood);
        mutation.mutate({
            classId,
            mood: moodObj?.label || "Neutral",
            moodScore: selectedMood,
            notes,
        });
    };

    return (
        <Card className="overflow-hidden border-none bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-2xl ring-1 ring-white/20">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        How are you today?
                    </CardTitle>
                </div>
                <CardDescription className="text-slate-400">
                    Your wellbeing matters. Share your mood with your teachers.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-between gap-2">
                    {moods.map((m) => (
                        <motion.button
                            key={m.label}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedMood(m.score)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 flex-1 ${selectedMood === m.score
                                ? `${m.bg} ring-2 ring-inset ring-white/20 shadow-lg scale-105`
                                : "hover:bg-white/5"
                                }`}
                        >
                            <m.icon className={`h-8 w-8 ${m.color}`} />
                            <span className="text-xs font-medium text-slate-300">{m.label}</span>
                        </motion.button>
                    ))}
                </div>

                <AnimatePresence>
                    {selectedMood !== null && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Optional notes</label>
                                <Textarea
                                    placeholder="Anything on your mind?"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="bg-white/5 border-white/10 focus:border-purple-500/50 resize-none h-24"
                                />
                            </div>
                            <Button
                                onClick={handleSubmit}
                                disabled={mutation.isPending}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-none shadow-lg shadow-purple-900/20 py-6 text-lg font-semibold"
                            >
                                {mutation.isPending ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    >
                                        <Sparkles className="h-5 w-5" />
                                    </motion.div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        Submit Check-in
                                        <Send className="h-4 w-4" />
                                    </div>
                                )}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
