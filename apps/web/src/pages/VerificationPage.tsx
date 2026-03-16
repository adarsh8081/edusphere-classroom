import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle2, User, Calendar, BookOpen, AlertTriangle, ArrowLeft, Download } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function VerificationPage() {
    const { code } = useParams();

    const { data: cert, isLoading, error } = useQuery<any>({
        queryKey: [`/api/certificates/verify/${code}`],
        retry: false,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <div className="w-full max-w-md space-y-4 text-center">
                    <Award className="h-12 w-12 text-primary animate-bounce mx-auto" />
                    <h2 className="text-2xl font-bold">Verifying Credentials...</h2>
                    <p className="text-muted-foreground">Authenticating digital signature on the blockchain...</p>
                </div>
            </div>
        );
    }

    if (error || !cert) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <Card className="w-full max-w-md border-destructive/20 shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4 text-destructive">
                            <AlertTriangle className="h-10 w-10" />
                        </div>
                        <CardTitle className="text-2xl">Verification Failed</CardTitle>
                        <CardDescription>
                            This certificate code is invalid or has been revoked.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button asChild variant="outline">
                            <Link href="/">Return to Home</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-2xl"
            >
                <Card className="border-t-8 border-primary shadow-2xl overflow-hidden backdrop-blur-sm bg-background/90">
                    <CardHeader className="text-center pb-2 bg-primary/5">
                        <div className="flex justify-center mb-4 relative">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                            <div className="relative h-20 w-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-xl">
                                <Award className="h-12 w-12" />
                            </div>
                        </div>
                        <Badge variant="outline" className="mb-2 bg-green-500/10 text-green-600 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            AUTHENTICATED CREDENTIAL
                        </Badge>
                        <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
                            Credential Verification
                        </CardTitle>
                        <CardDescription className="text-lg">
                            Official digital validation for EduSphere Academy certifications.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                                        <User className="h-3 w-3 mr-1" /> RECIPIENT
                                    </label>
                                    <p className="text-xl font-semibold text-primary">{cert.studentName}</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                                        <BookOpen className="h-3 w-3 mr-1" /> ACCOMPLISHMENT
                                    </label>
                                    <p className="text-xl font-semibold">{cert.title}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" /> ISSUED ON
                                    </label>
                                    <p className="text-xl font-semibold">{format(new Date(cert.issuedAt), "PPP")}</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                                        <Award className="h-3 w-3 mr-1" /> ISSUER
                                    </label>
                                    <p className="text-xl font-semibold">{cert.issuerName}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center justify-center space-y-2 border border-border/50">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Verification Signature</label>
                            <code className="text-xs font-mono bg-background px-3 py-1 rounded border shadow-sm select-all">
                                {cert.verificationCode}
                            </code>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col sm:flex-row gap-4 p-8 pt-0">
                        <Button className="w-full h-12 text-md shadow-lg shadow-primary/20" asChild>
                            <a href={`/api/certificates/download/${cert.id}`} target="_blank">
                                <Download className="h-5 w-5 mr-2" />
                                View Original Certificate
                            </a>
                        </Button>
                        <Button variant="outline" className="w-full h-12 text-md" asChild>
                            <Link href="/">
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                Go to EduSphere
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
                <p className="mt-8 text-center text-sm text-muted-foreground">
                    This digital credential is cryptographically signed and permanent.
                    <br />
                    &copy; {new Date().getFullYear()} EduSphere Technologies Inc.
                </p>
            </motion.div>
        </div>
    );
}
