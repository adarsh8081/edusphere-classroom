import { useState, useEffect } from "react";
import { X, Wind, Focus, Music, Zap, Volume2, VolumeX, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function ZenMode({ onClose }: { onClose: () => void }) {
    const [phase, setPhase] = useState<"breathe-in" | "hold" | "breathe-out">("breathe-in");
    const [seconds, setSeconds] = useState(0);
    const [isAudioOn, setIsAudioOn] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Breathing cycle logic
    useEffect(() => {
        const cycle = setInterval(() => {
            setPhase(p => {
                if (p === "breathe-in") return "hold";
                if (p === "hold") return "breathe-out";
                return "breathe-in";
            });
        }, phase === "hold" ? 4000 : 4000);
        return () => clearInterval(cycle);
    }, [phase]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center overflow-hidden zen-mode"
        >
            {/* Background Animated Elements */}
            <div className="absolute inset-0 z-0 opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/20 blur-[120px] animate-pulse"></div>
                <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px] animate-bounce-slow"></div>
            </div>

            {/* Header Controls */}
            <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                        <Timer className="w-4 h-4 text-primary" />
                        <span className="font-mono text-sm font-bold tracking-widest">{formatTime(seconds)}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-white/5"
                        onClick={() => setIsAudioOn(!isAudioOn)}
                    >
                        {isAudioOn ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
                    </Button>
                </div>

                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/5 group">
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                </Button>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center gap-16 text-center">
                <div className="space-y-4">
                    <motion.h2
                        key={phase}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-4xl md:text-6xl font-display font-extrabold tracking-tight capitalize"
                    >
                        {phase.replace("-", " ")}...
                    </motion.h2>
                    <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        Focus on your breath. Let the noise of the day fade away. You are in control of your space.
                    </p>
                </div>

                {/* Breathing Circle */}
                <div className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center">
                    <motion.div
                        animate={{
                            scale: phase === "breathe-in" ? 1.5 : phase === "hold" ? 1.5 : 0.8,
                            opacity: phase === "breathe-out" ? 0.4 : 0.8
                        }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full bg-primary/20 border-2 border-primary/30 shadow-[0_0_50px_rgba(23,226,255,0.2)]"
                    />
                    <motion.div
                        animate={{
                            scale: phase === "breathe-in" ? 1.2 : phase === "hold" ? 1.2 : 0.6,
                        }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                        className="absolute inset-10 md:inset-20 rounded-full bg-primary/40 blur-md"
                    />
                    <Wind className="w-12 h-12 md:w-20 md:h-20 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-pulse" />
                </div>

                {/* Affirmation */}
                <AnimatePresence mode="wait">
                    <motion.p
                        key={Math.floor(seconds / 15)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-lg font-bold italic text-primary/80"
                    >
                        {seconds < 15 ? "Clear your mind." :
                            seconds < 30 ? "Visualize your success." :
                                seconds < 45 ? "Deep focus leads to mastery." :
                                    "You are making progress."}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Footer Features */}
            <div className="absolute bottom-12 flex gap-8 z-10">
                {[
                    { label: "Binaural Beats", icon: Music },
                    { label: "Focus Shield", icon: ShieldCheck },
                    { label: "Deep Learning", icon: Zap }
                ].map((f, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 group cursor-help">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all duration-500 border border-white/5">
                            <f.icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{f.label}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function ShieldCheck({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
    );
}
