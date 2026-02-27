import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CheckCircle2, UserPlus, LogIn } from "lucide-react";
import { Link } from "wouter";

export default function ParentInvitationPage() {
    const [, params] = useRoute("/parent/register");
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { user, isLoading: authLoading } = useAuth();
    const token = new URLSearchParams(window.location.search).get("token");

    const { data, isLoading: inviteLoading, error } = useQuery<{ invitation: any, student: any }>({
        queryKey: [`/api/parents/invitations/${token}`],
        enabled: !!token,
        retry: false
    });

    const linkMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/parents/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Successfully linked", description: "You are now linked to your child's account." });
            setLocation("/");
        },
        onError: (err: any) => {
            toast({ title: "Linking failed", description: err.message, variant: "destructive" });
        }
    });

    if (inviteLoading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-6">
                    <CardHeader>
                        <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
                        <CardDescription>
                            This invitation link is invalid, expired, or has already been used.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/">Go to Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { invitation, student } = data;

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="max-w-md w-full border-primary/20 shadow-lg">
                <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-display">Parent Invitation</CardTitle>
                    <CardDescription>
                        You have been invited to monitor <strong>{student.name}</strong> on EduSphere Classroom.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {!user ? (
                        <div className="space-y-4">
                            <p className="text-sm text-center text-muted-foreground">
                                Please login or register as a parent to accept this invitation.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <Button asChild variant="outline">
                                    <Link href="/login">Login</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/login">Register</Link>
                                </Button>
                            </div>
                        </div>
                    ) : user.role !== 'parent' ? (
                        <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm text-center">
                            You are currently logged in as a <strong>{user.role}</strong>.
                            Only parent accounts can accept invitations.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-primary/5 p-4 rounded-lg flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                                <p className="text-sm text-muted-foreground">
                                    By clicking accept, you will gain access to {student.name}'s attendance, grades, and assignments.
                                </p>
                            </div>
                            <Button
                                className="w-full h-12 text-lg font-medium"
                                onClick={() => linkMutation.mutate()}
                                disabled={linkMutation.isPending}
                            >
                                {linkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Accept & Link Account
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
