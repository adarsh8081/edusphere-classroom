import { useState } from "react";
import { useLocation } from "wouter";
import { useParentInvitation, useRegisterParent } from "@/hooks/use-parent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, UserPlus, Mail } from "lucide-react";

export default function ParentRegistration() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");

    const { data: invitation, isLoading: loadingInvite, error: inviteError } = useParentInvitation(token || "");
    const registerMutation = useRegisterParent();

    const [name, setName] = useState("");
    const [password, setPassword] = useState("");

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                <Card className="max-w-md w-full glass-panel border-red-500/20">
                    <CardContent className="pt-6 text-center">
                        <CardTitle className="text-red-500 mb-2">Invalid Access</CardTitle>
                        <p className="text-muted-foreground">You need a valid invitation link to register as a parent.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (loadingInvite) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    if (inviteError || !invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                <Card className="max-w-md w-full glass-panel border-red-500/20">
                    <CardContent className="pt-6 text-center">
                        <CardTitle className="text-red-500 mb-2">Invitation Expired</CardTitle>
                        <p className="text-muted-foreground">This invitation link has expired or is no longer valid.</p>
                        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setLocation("/")}>Go Home</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !password) return;

        try {
            await registerMutation.mutateAsync({ token, name, password });
            toast({ title: "Registration Successful", description: "You are now linked to " + invitation.studentName });
            setLocation("/parent");
        } catch (err: any) {
            toast({ title: "Registration failed", description: err.message, variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
                <Card className="glass-panel border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div className="h-32 bg-primary/20 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/10 backdrop-blur-3xl" />
                        <UserPlus className="w-16 h-16 text-primary relative z-10" />
                    </div>

                    <CardHeader className="text-center pt-8">
                        <CardTitle className="text-3xl font-black font-display tracking-tight uppercase">Parent Portal</CardTitle>
                        <CardDescription className="text-primary font-bold">Registration for {invitation.studentName}</CardDescription>
                    </CardHeader>

                    <CardContent className="p-8">
                        <form onSubmit={handleRegister} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                                <Input
                                    placeholder="Your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-white/5 border-white/10 rounded-2xl h-12 px-5 focus:ring-primary/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email (Locked)</label>
                                <div className="relative">
                                    <Input value={invitation.email} disabled className="bg-white/5 border-white/10 rounded-2xl h-12 px-5 opacity-50 pl-11" />
                                    <Mail className="w-4 h-4 absolute left-4 top-4 text-muted-foreground" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Secure Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white/5 border-white/10 rounded-2xl h-12 px-5 focus:ring-primary/50"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[.2em] shadow-xl shadow-primary/20"
                                disabled={registerMutation.isPending}
                            >
                                {registerMutation.isPending ? <Loader2 className="animate-spin" /> : "Complete Registration"}
                            </Button>
                        </form>

                        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4 text-primary" /> Verified Student Link
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
