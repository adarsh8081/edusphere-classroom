import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, BookOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function ContentGenerator({ classId }: { classId: string }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<string | null>(null);

    // Form State
    const [topic, setTopic] = useState("");
    const [grade, setGrade] = useState("high-school");
    const [duration, setDuration] = useState("45 mins");
    const [objectives, setObjectives] = useState("");

    const handleGenerate = async () => {
        if (!topic) return;
        setIsGenerating(true);
        setGeneratedContent(null);

        try {
            const res = await apiRequest("POST", "/api/ai/lesson-plan", {
                topic,
                grade,
                duration,
                objectives
            });
            const data = await res.json();
            setGeneratedContent(data.plan);
            toast({ title: "Content Generated!", description: "Your AI lesson plan is ready." });
        } catch (err) {
            toast({ title: "Generation failed", description: "Something went wrong.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20">
                    <Wand2 className="h-4 w-4 text-primary" />
                    AI Course Creator
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        AI Content Generator
                    </DialogTitle>
                    <DialogDescription>
                        Generate comprehensive lesson plans, rubrics, and interactive materials instantly.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label htmlFor="topic">Topic / Subject</Label>
                            <Input
                                id="topic"
                                placeholder="e.g. Photosynthesis, World War II"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label htmlFor="grade">Grade Level</Label>
                            <Select value={grade} onValueChange={setGrade}>
                                <SelectTrigger id="grade">
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="elementary">Elementary</SelectItem>
                                    <SelectItem value="middle-school">Middle School</SelectItem>
                                    <SelectItem value="high-school">High School</SelectItem>
                                    <SelectItem value="university">University</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label htmlFor="duration">Estimated Duration</Label>
                            <Input
                                id="duration"
                                placeholder="e.g. 45 mins, 2 hours"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="objectives">Specific Learning Objectives (Optional)</Label>
                        <Textarea
                            id="objectives"
                            placeholder="What should students know or be able to do by the end?"
                            value={objectives}
                            onChange={(e) => setObjectives(e.target.value)}
                            className="resize-none h-24"
                        />
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleGenerate}
                        disabled={!topic || isGenerating}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Drafting Content...
                            </>
                        ) : (
                            <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Generate Lesson Plan
                            </>
                        )}
                    </Button>

                    {generatedContent && (
                        <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-bottom-4">
                            <Label className="text-primary font-semibold">Generated Output:</Label>
                            <div className="p-4 bg-muted/50 rounded-md text-sm whitespace-pre-wrap font-mono border">
                                {generatedContent}
                            </div>
                            <div className="flex justify-end pt-2 gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                    navigator.clipboard.writeText(generatedContent);
                                    toast({ title: "Copied to clipboard" });
                                }}>
                                    Copy Text
                                </Button>
                                <Button size="sm">
                                    Add as Resource
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
