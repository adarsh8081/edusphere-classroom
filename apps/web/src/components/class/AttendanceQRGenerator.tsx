import { QRCodeSVG } from "qrcode.react";
import { useSessionStats } from "@/hooks/use-attendance";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Clock, CheckCircle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface QRGeneratorProps {
    session: {
        id: string;
        qrCode: string;
        expiresAt: string;
    };
}

export function AttendanceQRGenerator({ session }: QRGeneratorProps) {
    const { data: stats } = useSessionStats(session.id);
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const timer = setInterval(() => {
            const delta = new Date(session.expiresAt).getTime() - new Date().getTime();
            if (delta <= 0) {
                setTimeLeft("Expired");
                clearInterval(timer);
            } else {
                const mins = Math.floor(delta / 60000);
                const secs = Math.floor((delta % 60000) / 1000);
                setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [session.expiresAt]);

    return (
        <Card className="glass-panel border-primary/20 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardHeader className="text-center pb-2">
                <CardTitle className="flex items-center justify-center gap-2 text-primary">
                    <Shield className="w-5 h-5" /> Smart Attendance Live
                </CardTitle>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Students: Scan to Check-in</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 p-8">
                {/* QR Code with Glow */}
                <div className="relative p-6 bg-white rounded-3xl shadow-2xl border-4 border-primary/20">
                    <QRCodeSVG
                        value={session.qrCode}
                        size={220}
                        level="H"
                        includeMargin={true}
                        imageSettings={{
                            src: "/favicon.ico",
                            x: undefined,
                            y: undefined,
                            height: 48,
                            width: 48,
                            excavate: true,
                        }}
                    />
                    <motion.div
                        className="absolute -inset-2 bg-primary/20 blur-xl -z-10 rounded-[3rem]"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="glass-panel p-4 rounded-2xl flex flex-col items-center">
                        <Clock className="w-4 h-4 text-primary mb-1" />
                        <span className="text-lg font-bold font-mono">{timeLeft}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Time Left</span>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl flex flex-col items-center underline-offset-4">
                        <Users className="w-4 h-4 text-emerald-400 mb-1" />
                        <span className="text-lg font-bold">{stats?.count || 0}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Scanned</span>
                    </div>
                </div>

                {/* Live Fed List */}
                <div className="w-full space-y-2 mt-2">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Recent Scans</h4>
                    <div className="max-h-[120px] overflow-y-auto pr-2 space-y-2 thin-scrollbar">
                        <AnimatePresence initial={false}>
                            {stats?.students?.slice(0, 5).map((s: any) => (
                                <motion.div
                                    key={s.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/5"
                                >
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                                        {s.studentName[0]}
                                    </div>
                                    <span className="text-xs font-semibold flex-1 truncate">{s.studentName}</span>
                                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                                </motion.div>
                            ))}
                            {(!stats?.students || stats.students.length === 0) && (
                                <p className="text-[10px] text-muted-foreground text-center py-4 italic">Waiting for scans...</p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
