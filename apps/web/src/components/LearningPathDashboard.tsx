import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Loader2, Sparkles, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LearningPathDashboard({ classId }: { classId: string }) {
    const { toast } = useToast();

    const { data: path, isLoading } = useQuery<any[]>({
        queryKey: [`/api/learning-paths/${classId}`],
    });

    const generateMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", `/api/learning-paths/${classId}/generate`, {});
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/learning-paths/${classId}`] });
            toast({
                title: "Path Generated",
                description: "Your AI personalized learning path has been refreshed.",
            });
        },
        onError: () => {
            toast({
                title: "Failed to generate path",
                description: "There was an error generating your learning path.",
                variant: "destructive",
            });
        }
    });

    const completeMutation = useMutation({
        mutationFn: async (itemId: string) => {
            await apiRequest("POST", `/api/learning-paths/items/${itemId}/complete`, {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/learning-paths/${classId}`] });
        }
    });

    if (isLoading) {
        return (
            <Card>
                <CardContent className="h-48 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        <Navigation className="h-5 w-5 text-primary" />
                        Your Intelligent Path
                    </CardTitle>
                    <CardDescription>
                        A tailored sequence of assignments and resources just for you.
                    </CardDescription>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                    className="hover:scale-105 transition-transform bg-background/50 backdrop-blur-sm"
                >
                    {generateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
                    )}
                    Regenerate Let AI Guide You
                </Button>
            </CardHeader>
            <CardContent>
                {(!path || path.length === 0) ? (
                    <div className="text-center p-8 border rounded-lg bg-background/50 border-dashed">
                        <p className="text-muted-foreground mb-4">No active learning path set up yet.</p>
                        <Button onClick={() => generateMutation.mutate()}>
                            Generate My Learning Path
                        </Button>
                    </div>
                ) : (
                    <div className="relative mt-4">
                        {/* The vertical timeline line */}
                        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-primary/20 to-transparent md:left-1/2 md:-ml-px"></div>

                        {path.map((item: any, idx: number) => {
                            const isCompleted = item.status === 'completed';
                            return (
                                <div key={item.id} className={`relative flex items-center justify-between md:justify-normal ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''} group is-active mb-8`}>
                                    {/* Timeline dot */}
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-background shadow shrink-0 md:order-1 ${idx % 2 === 0 ? 'md:translate-x-1/2' : 'md:-translate-x-1/2'} z-10 transition-colors duration-300`}>
                                        {isCompleted ? (
                                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                                        ) : (
                                            <Circle className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                        )}
                                    </div>

                                    {/* Content Card */}
                                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-background shadow-sm transition-all duration-300 ${isCompleted ? 'opacity-60 grayscale-[0.8]' : 'hover:-translate-y-1 hover:shadow-md border-primary/20'}`}>
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-sm text-primary uppercase tracking-wider">Step {item.position}</div>
                                            {!isCompleted && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 tracking-tight font-medium"
                                                    onClick={() => completeMutation.mutate(item.id)}
                                                    disabled={completeMutation.isPending}
                                                >
                                                    Mark Done
                                                </Button>
                                            )}
                                        </div>
                                        <div className="font-semibold text-foreground">
                                            {item.resourceId ? `Review Resource ${item.resourceId.split('-')[0]}` : `Complete Assignment ${item.assignmentId?.split('-')[0]}`}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-2">
                                            {isCompleted ? "Great job mastering this concept!" : "Up next on your tailored journey."}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
