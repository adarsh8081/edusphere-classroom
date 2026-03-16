import { useParams } from "wouter";
import { usePublicPortfolio } from "@/hooks/use-portfolio";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Award, Code, BookOpen, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PortfolioPage() {
    const { slug } = useParams();
    const { data, isLoading, error } = usePublicPortfolio(slug);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold">Portfolio Not Found</h1>
                <p className="text-muted-foreground">The portfolio you are looking for is private or does not exist.</p>
            </div>
        );
    }

    const { user, portfolio, items } = data;

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative h-64 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
                <div className="container relative h-full flex flex-col items-center justify-end pb-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mb-4"
                    >
                        <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback className="text-4xl">{user.name[0]}</AvatarFallback>
                        </Avatar>
                    </motion.div>
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl font-bold tracking-tight"
                    >
                        {user.name}
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground mt-2"
                    >
                        EduSphere Student Portfolio
                    </motion.p>
                </div>
            </div>

            <div className="container py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: About & Skills */}
                <div className="space-y-8">
                    <motion.section
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-lg">About Me</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed italic">
                                    "{user.bio || "No bio available."}"
                                </p>

                                <div className="mt-6">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Code className="h-4 w-4" /> Skills
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {user.skills?.map((skill: string) => (
                                            <Badge key={skill} variant="secondary" className="hover:bg-primary/20 transition-colors">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.section>

                    <motion.section
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <Award className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-lg">Achievements</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-4">
                                    {items.filter(i => i.type === 'badge').map((badge, idx) => (
                                        <motion.div
                                            key={badge.id}
                                            whileHover={{ scale: 1.1 }}
                                            className="aspect-square flex flex-col items-center justify-center p-2 rounded-lg bg-background shadow-sm group relative"
                                        >
                                            <Award className="h-8 w-8 text-primary group-hover:animate-pulse" />
                                            <span className="text-[10px] mt-2 font-medium text-center truncate w-full">
                                                {badge.title}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.section>
                </div>

                {/* Middle/Right: Featured Work */}
                <div className="lg:col-span-2 space-y-8">
                    <motion.section
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <BookOpen className="h-6 w-6 text-primary" />
                                <h2 className="text-2xl font-bold">Featured Works</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {items.filter(i => i.type === 'assignment_submission').slice(0, 4).map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.1 }}
                                >
                                    <Card className="h-full hover:shadow-lg transition-all border-l-4 border-l-primary group">
                                        <CardHeader>
                                            <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                                {item.title}
                                            </CardTitle>
                                            <CardDescription>
                                                Assignment Completion
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                                {item.description || "This project demonstrates proficiency in core concepts and practical application within the EduSphere ecosystem."}
                                            </p>

                                            {item.extra && (
                                                <div className="bg-muted p-3 rounded-md mb-4 text-xs font-mono">
                                                    Grade: <span className="font-bold text-green-600">{item.extra.grade || "N/A"}</span>
                                                </div>
                                            )}

                                            <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                                                View Details <ExternalLink className="h-3 w-3 ml-2" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}

                            {items.filter(i => i.type === 'assignment_submission').length === 0 && (
                                <div className="col-span-2 flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-muted/20">
                                    <BookOpen className="h-12 w-12 text-muted mb-4" />
                                    <p className="text-muted-foreground text-center">
                                        No featured works selected yet. Check back soon!
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.section>
                </div>
            </div>

            {/* Footer / Call to Action */}
            <footer className="border-t py-12 mt-12 bg-muted/20">
                <div className="container text-center text-muted-foreground">
                    <p className="text-sm mb-4">Verified by EduSphere Academic Integrity System</p>
                    <div className="flex justify-center gap-4">
                        <Badge variant="outline">Institutional Trust</Badge>
                        <Badge variant="outline">Verified Skills</Badge>
                        <Badge variant="outline">Academic Excellence</Badge>
                    </div>
                </div>
            </footer>
        </div>
    );
}
