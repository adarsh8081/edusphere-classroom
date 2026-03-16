import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

const MOODS = [
    { score: 5, emoji: "😄", label: "Great" },
    { score: 4, emoji: "🙂", label: "Good" },
    { score: 3, emoji: "😐", label: "Okay" },
    { score: 2, emoji: "😔", label: "Low" },
    { score: 1, emoji: "😢", label: "Struggling" },
];

export function WellbeingCheckinDialog({
    classId,
    open,
    onClose,
}: {
    classId: string;
    open: boolean;
    onClose: () => void;
}) {
    const { toast } = useToast();
    const [selectedMood, setSelectedMood] = useState<number | null>(null);
    const [notes, setNotes] = useState("");

    const mutation = useMutation({
        mutationFn: async () => {
            if (selectedMood == null) throw new Error("Select a mood");
            const res = await apiRequest("POST", "/api/wellbeing/checkin", {
                classId,
                moodScore: selectedMood,
                notes: notes.trim() || undefined,
            });
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Thanks for checking in! 💙",
                description: "Your mood has been recorded. Your teacher is here to help if you need it.",
            });
            setSelectedMood(null);
            setNotes("");
            onClose();
        },
        onError: () => {
            toast({
                title: "Could not save check-in",
                description: "Please try again.",
                variant: "destructive",
            });
        },
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Daily Well-being Check-in</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        How are you feeling today? Your response is private.
                    </p>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Mood selector */}
                    <div className="flex justify-around">
                        {MOODS.map((m) => (
                            <button
                                key={m.score}
                                onClick={() => setSelectedMood(m.score)}
                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all hover:scale-110 ${selectedMood === m.score
                                        ? "border-primary bg-primary/10 scale-110"
                                        : "border-transparent hover:border-muted-foreground/30"
                                    }`}
                            >
                                <span className="text-3xl">{m.emoji}</span>
                                <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Optional notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Anything you'd like to share? <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <Textarea
                            placeholder="What's on your mind today..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none h-24"
                            maxLength={500}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>
                        Skip for now
                    </Button>
                    <Button
                        onClick={() => mutation.mutate()}
                        disabled={selectedMood == null || mutation.isPending}
                        className="min-w-24"
                    >
                        {mutation.isPending ? "Saving..." : "Check In"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
