import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Ear, Languages, Play, StopCircle, Speech } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/hooks/use-toast";

export function AccessibilityPanel({ text, onTranslate }: { text: string, onTranslate?: (lang: string) => void }) {
    const { toast } = useToast();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        // Cleanup speech synthesis on unmount
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const handleSpeak = () => {
        if (!window.speechSynthesis) {
            toast({ description: "Text-to-speech not supported in this browser.", variant: "destructive" });
            return;
        }

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    const handleListen = () => {
        /* 
          Mocked Web Speech API for dictate/listen prototype 
          In real app: `const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;`
        */
        if (isListening) {
            setIsListening(false);
            toast({ description: "Voice transcription stopped." });
        } else {
            setIsListening(true);
            toast({ description: "Listening for voice input..." });
            // Mock auto stop after 3s
            setTimeout(() => {
                setIsListening(false);
                toast({ description: "Voice input captured." });
            }, 3000);
        }
    };

    const translateOptions = [
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'zh', name: 'Chinese' },
        { code: 'hi', name: 'Hindi' }
    ];

    return (
        <div className="flex bg-muted/30 rounded-lg p-1 border border-border/50 items-center justify-end gap-1 shrink-0 w-fit self-end">

            <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 rounded-md ${isSpeaking ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                onClick={handleSpeak}
                title={isSpeaking ? "Stop Reading" : "Read Aloud"}
            >
                {isSpeaking ? <StopCircle className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Toggle
                size="sm"
                className="h-8 w-8 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                pressed={isListening}
                onPressedChange={handleListen}
                title="Voice Type (Dictation)"
            >
                <Ear className="h-4 w-4" />
            </Toggle>

            {onTranslate && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground" title="Translate Text">
                            <Languages className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {translateOptions.map(lang => (
                            <DropdownMenuItem key={lang.code} onClick={() => onTranslate(lang.code)}>
                                Translate to {lang.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

        </div>
    );
}
