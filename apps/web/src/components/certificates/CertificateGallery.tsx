import { useQuery } from "@tanstack/react-query";
import { Certificate } from "@edusphere/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Award, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export function CertificateGallery() {
    const { data: certificates, isLoading } = useQuery<Certificate[]>({
        queryKey: ["/api/certificates/me"],
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    if (!certificates || certificates.length === 0) {
        return (
            <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center bg-muted/30">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle>No Certificates Yet</CardTitle>
                <CardDescription>
                    Complete career paths or class requirements to earn verified certifications.
                </CardDescription>
            </Card>
        );
    }

    const handleDownload = (id: string, code: string) => {
        window.open(`/api/certificates/download/${id}`, "_blank");
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert, index) => (
                <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card className="h-full group hover:shadow-xl transition-all duration-300 border-primary/10 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Award className="h-24 w-24 text-primary" />
                        </div>

                        <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                                    Verified
                                </Badge>
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                            <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors">
                                {cert.title}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Issued {cert.issuedAt ? format(new Date(cert.issuedAt), "PPP") : "Pending"}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Award className="h-4 w-4 mr-2" />
                                    By {cert.issuerName}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    className="flex-1 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                    onClick={() => handleDownload(cert.id, cert.verificationCode)}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    asChild
                                >
                                    <a href={`/verify/${cert.verificationCode}`} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>

                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mt-4 text-center border-t pt-3">
                                CODE: {cert.verificationCode}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
