import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useScanAttendance } from "@/hooks/use-attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, MapPin, CheckCircle, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AttendanceScanner() {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const scanMutation = useScanAttendance();

    useEffect(() => {
        if (!isScanning) return;

        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
        );

        scanner.render(
            async (decodedText) => {
                setScanResult(decodedText);
                setIsScanning(false);
                scanner.clear();

                // Mark attendance
                try {
                    // Get location if available
                    let location = {};
                    if ("geolocation" in navigator) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                            scanMutation.mutate({
                                qrCode: decodedText,
                                latitude: pos.coords.latitude,
                                longitude: pos.coords.longitude
                            });
                        }, () => {
                            // Fallback if location denied
                            scanMutation.mutate({ qrCode: decodedText });
                        });
                    } else {
                        scanMutation.mutate({ qrCode: decodedText });
                    }
                } catch (err: any) {
                    setError(err.message);
                }
            },
            (err) => {
                // Silently ignore individual scan errors
            }
        );

        return () => {
            scanner.clear().catch(console.error);
        };
    }, [isScanning]);

    if (scanMutation.isSuccess) {
        return (
            <Card className="glass-panel border-emerald-500/30 rounded-[2.5rem] bg-emerald-500/5 overflow-hidden">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 10 }}
                        className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4"
                    >
                        <CheckCircle className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-emerald-400">Successfully Checked-In</h3>
                    <p className="text-sm text-muted-foreground mt-2">Your attendance has been recorded and XP awarded.</p>
                    <Button variant="outline" className="mt-6 rounded-xl border-white/10" onClick={() => scanMutation.reset()}>Done</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-panel border-primary/20 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                    <Smartphone className="w-5 h-5 text-primary" /> Smart Check-in
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center">
                {!isScanning ? (
                    <div className="flex flex-col items-center gap-6 py-6">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                            <Camera className="w-10 h-10 text-primary" />
                        </div>
                        <div className="text-center max-w-xs">
                            <p className="text-sm font-semibold mb-1">Mark your attendance instantly</p>
                            <p className="text-xs text-muted-foreground">Please scan the QR code projected by your teacher.</p>
                        </div>
                        <Button
                            onClick={() => setIsScanning(true)}
                            className="w-full rounded-2xl h-14 font-bold text-lg hover-elevate shadow-xl"
                        >
                            Open Scanner
                        </Button>
                    </div>
                ) : (
                    <div className="w-full flex flex-col gap-4">
                        <div id="qr-reader" className="rounded-2xl overflow-hidden border-2 border-primary/20 bg-black"></div>
                        <Button
                            variant="ghost"
                            onClick={() => setIsScanning(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                    </div>
                )}

                {scanMutation.isPending && (
                    <div className="mt-4 flex items-center gap-2 text-primary font-bold">
                        <Loader2 className="w-4 h-4 animate-spin" /> Verifying Check-in...
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold w-full text-center">
                        {error}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
