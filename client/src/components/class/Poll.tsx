import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2, BarChart3 } from "lucide-react";

export function Poll({ postId }: { postId: string }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [votedOptionId, setVotedOptionId] = useState<string | null>(null);

    const { data: poll, isLoading } = useQuery<any>({
        queryKey: ["/api/posts", postId, "poll"],
    });

    const voteMutation = useMutation({
        mutationFn: async (optionId: string) => {
            const res = await fetch(`/api/polls/${poll.id}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ optionId }),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "poll"] });
        },
    });

    if (isLoading || !poll) return null;

    const totalVotes = poll.votes?.length || 0;
    const userVote = poll.votes?.find((v: any) => v.userId === user?.id);

    return (
        <div className="mt-4 p-5 rounded-2xl bg-muted/20 border border-muted/50 space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={18} className="text-primary" />
                <h5 className="font-bold text-sm uppercase tracking-wider">{poll.question}</h5>
            </div>

            <div className="space-y-3">
                {poll.options?.map((option: any) => {
                    const optionVotes = poll.votes?.filter((v: any) => v.optionId === option.id).length || 0;
                    const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                    const isSelected = userVote?.optionId === option.id;

                    return (
                        <div key={option.id} className="group relative">
                            <button
                                disabled={!!userVote || voteMutation.isPending}
                                onClick={() => voteMutation.mutate(option.id)}
                                className={`w-full text-left p-3 rounded-xl transition-all duration-300 border-2 flex items-center justify-between z-10 relative ${isSelected
                                        ? "border-primary bg-primary/5"
                                        : "border-transparent hover:border-muted-foreground/20 bg-background/50"
                                    }`}
                            >
                                <span className="font-medium text-sm">{option.optionText}</span>
                                {isSelected && <CheckCircle2 size={16} className="text-primary animate-in zoom-in" />}
                            </button>

                            {/* Result Bar */}
                            {(userVote || user?.role === 'teacher') && (
                                <div className="mt-1.5 px-1 space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                                        <span>{optionVotes} votes</span>
                                        <span>{percentage.toFixed(0)}%</span>
                                    </div>
                                    <Progress value={percentage} className="h-1.5 rounded-full bg-muted/50" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="pt-2 border-t border-muted/50 flex justify-between items-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                <span>{totalVotes} total responses</span>
                {userVote && <span className="text-primary">Vote Cast</span>}
            </div>
        </div>
    );
}
