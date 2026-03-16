import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@edusphere/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardList, CheckCircle2, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export function GradesTab({ classId }: { classId: string }) {
    const { data: assignments, isLoading: loadingAssignments } = useQuery<any[]>({
        queryKey: [api.assignments.list.path, classId],
        queryFn: async () => {
            const url = buildUrl(api.assignments.list.path, { classId });
            const res = await fetch(url);
            return res.json();
        }
    });

    const { data: mySubmissions, isLoading: loadingSubmissions } = useQuery<any[]>({
        queryKey: [api.classes.mySubmissions.path, classId],
        queryFn: async () => {
            const url = buildUrl(api.classes.mySubmissions.path, { classId });
            const res = await fetch(url);
            return res.json();
        }
    });

    if (loadingAssignments || loadingSubmissions) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    const getSubmission = (assignmentId: string) => {
        return mySubmissions?.find(s => s.assignmentId === assignmentId);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10 pb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-display font-extrabold tracking-tight text-primary drop-shadow-sm flex items-center gap-3">
                        <ClipboardList className="w-8 h-8 opacity-80" /> My Grades
                    </h2>
                    <p className="text-base text-foreground/80 font-medium mt-1">Track your assignment progress and feedback</p>
                </div>
                <div className="bg-gradient-to-br from-primary/20 to-cyan-500/10 px-6 py-4 rounded-3xl border border-white/20 shadow-lg backdrop-blur-md flex flex-col items-center justify-center min-w-[160px] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-xs font-black uppercase tracking-widest text-primary/80 leading-none mb-2 drop-shadow-sm">Overall Average</p>
                    <p className="text-4xl font-black text-primary drop-shadow-md">
                        {mySubmissions?.length ?
                            (mySubmissions.reduce((acc, s) => acc + parseFloat(s.grade || 0), 0) / mySubmissions.length).toFixed(1) :
                            '--'}%
                    </p>
                </div>
            </div>

            <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-5 pb-8">
                    {assignments?.map((assignment) => {
                        const submission = getSubmission(assignment.id);
                        const isGraded = submission?.grade !== null && submission?.grade !== undefined;
                        const isLate = assignment.dueDate && submission?.submittedAt && new Date(submission.submittedAt) > new Date(assignment.dueDate);

                        return (
                            <Card key={assignment.id} className="group overflow-hidden border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 bg-black/5 dark:bg-white/5 backdrop-blur-md hover:-translate-y-1 rounded-3xl relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                <CardContent className="p-0 relative z-10">
                                    <div className="flex items-stretch min-h-[120px]">
                                        <div className={`w-2 transition-colors duration-300 ${isGraded ? 'bg-emerald-500' : submission ? 'bg-amber-400' : 'bg-primary/30'}`} />
                                        <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-start sm:items-center gap-4">
                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border border-white/10 ${submission ? 'bg-primary/20 text-primary' : 'bg-black/10 dark:bg-white/10 text-muted-foreground'}`}>
                                                        {submission ? <CheckCircle2 size={24} className="drop-shadow-sm" /> : <ClipboardList size={24} />}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-extrabold text-xl tracking-tight group-hover:text-primary transition-colors drop-shadow-sm">{assignment.title}</h3>
                                                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                            <span className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 py-1 px-3 rounded-lg shadow-inner"><Clock size={14} /> Due {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM d, p') : 'No due date'}</span>
                                                            {submission && (
                                                                <span className={`flex items-center gap-1.5 py-1 px-3 rounded-lg shadow-sm border ${isLate ? 'text-destructive bg-destructive/10 border-destructive/20' : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'}`}>
                                                                    {isLate ? 'Submitted Late' : 'On Time'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {submission?.feedback && (
                                                    <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 italic text-sm text-foreground/90 leading-relaxed shadow-sm block ml-16">
                                                        <p className="text-xs font-black uppercase tracking-widest text-primary mb-2 not-italic flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Teacher Feedback</p>
                                                        <p className="font-medium text-base">"{submission.feedback}"</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-6 pl-16 md:pl-0 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                                                <div className="text-right flex-1 md:flex-none flex flex-col items-end">
                                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 leading-none">Grade</p>
                                                    <div className="flex items-baseline gap-1 mt-1">
                                                        {isGraded ? (
                                                            <div className="bg-white/40 dark:bg-black/40 px-4 py-2 rounded-xl shadow-inner border border-white/20 flex flex-col items-end min-w-[100px]">
                                                                <span className="text-4xl font-black text-foreground tracking-tighter drop-shadow-sm">{submission?.grade}</span>
                                                                <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase mt-1 px-2 py-0.5 bg-background rounded-md shadow-sm">/ {assignment.maxPoints || 100} PTS</span>
                                                            </div>
                                                        ) : (
                                                            <Badge variant="secondary" className="font-bold uppercase tracking-widest text-xs py-1.5 px-3 bg-primary/10 text-primary border border-primary/20 shadow-sm">
                                                                {submission ? 'Pending' : 'No Submission'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all duration-300">
                                                    <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" size={24} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
