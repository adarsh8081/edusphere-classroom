import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlayCircle, Pause, HelpCircle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type Interaction = {
    time: number; // in seconds
    question: string;
    options: string[];
    correctAnswer: number;
};

// Mock Interactions since we don't have a video AI ingestion pipeline for MVP
const mockInteractions: Interaction[] = [
    { time: 5, question: "What is the primary topic discussed here?", options: ["Biology", "History", "Math", "Literature"], correctAnswer: 1 },
    { time: 15, question: "Why did the event occur as described?", options: ["Unclear", "Economic reasons", "Accidental", "Natural disaster"], correctAnswer: 1 }
];

export function InteractiveVideoPlayer({ url, title }: { url: string, title?: string }) {
    const [open, setOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentInteraction, setCurrentInteraction] = useState<Interaction | null>(null);
    const [answeredIdx, setAnsweredIdx] = useState<number | null>(null);
    const [answeredInteractions, setAnsweredInteractions] = useState<Set<number>>(new Set());

    // Using a simulated standard web video format for MVP dummy interaction
    // Ideally this extends to YouTube via their iFrame API syncing

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            const currentTime = Math.floor(video.currentTime);

            const interaction = mockInteractions.find(i => Math.floor(i.time) === currentTime && !answeredInteractions.has(i.time));

            if (interaction) {
                video.pause();
                setIsPlaying(false);
                setCurrentInteraction(interaction);
            }
        };

        video.addEventListener("timeupdate", handleTimeUpdate);
        return () => video.removeEventListener("timeupdate", handleTimeUpdate);
    }, [answeredInteractions]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const submitAnswer = () => {
        if (currentInteraction && answeredIdx !== null) {
            // In a real app we would log analytics metrics here
            setAnsweredInteractions(prev => new Set(prev).add(currentInteraction.time));
            setCurrentInteraction(null);
            setAnsweredIdx(null);
            if (videoRef.current) {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <PlayCircle className="h-4 w-4" />
                    Interactive Watch
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] bg-black border-border shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-4 bg-background z-20 relative">
                    <DialogTitle>{title || "Interactive Video Lesson"}</DialogTitle>
                    <DialogDescription>
                        This video contains AI-generated comprehension checkpoints.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative w-full aspect-video bg-black flex flex-col items-center justify-center">
                    {/* Note: This assumes 'url' is a direct mp4 link. If it's YT, we'd need react-player */}
                    <video
                        ref={videoRef}
                        src={url.includes('youtube') ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' : url}
                        className="w-full h-full object-contain"
                        controls={!currentInteraction}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    />

                    {currentInteraction && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-30 backdrop-blur-sm">
                            <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 border-primary/50 bg-background">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4 text-primary font-semibold">
                                        <HelpCircle className="h-5 w-5" />
                                        Knowledge Check
                                    </div>
                                    <p className="text-lg mb-6 leading-relaxed">{currentInteraction.question}</p>

                                    <RadioGroup
                                        value={answeredIdx?.toString()}
                                        onValueChange={(val) => setAnsweredIdx(parseInt(val))}
                                        className="space-y-3"
                                    >
                                        {currentInteraction.options.map((opt, i) => (
                                            <div key={i} className={`flex items-center space-x-3 border p-4 rounded-lg transition-colors cursor-pointer ${answeredIdx === i ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`} onClick={() => setAnsweredIdx(i)}>
                                                <RadioGroupItem value={i.toString()} id={`opt-${i}`} />
                                                <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer text-base">{opt}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>

                                    <div className="mt-8 flex justify-end">
                                        <Button
                                            disabled={answeredIdx === null}
                                            onClick={submitAnswer}
                                            className="gap-2"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            Submit & Continue
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
