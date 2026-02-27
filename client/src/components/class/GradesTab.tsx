import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
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
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black tracking-tight uppercase">My Grades</h2>
                    <p className="text-sm text-muted-foreground font-medium">Track your assignment progress and feedback</p>
                </div>
                <div className="bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 leading-none mb-1">Overall Average</p>
                    <p className="text-2xl font-black text-primary">
                        {mySubmissions?.length ?
                            (mySubmissions.reduce((acc, s) => acc + parseFloat(s.grade || 0), 0) / mySubmissions.length).toFixed(1) :
                            '--'}%
                    </p>
                </div>
            </div>

            <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4 pb-8">
                    {assignments?.map((assignment) => {
                        const submission = getSubmission(assignment.id);
                        const isGraded = submission?.grade !== null && submission?.grade !== undefined;
                        const isLate = assignment.dueDate && submission?.submittedAt && new Date(submission.submittedAt) > new Date(assignment.dueDate);

                        return (
                            <Card key={assignment.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-background/50 backdrop-blur-sm border border-muted/20">
                                <CardContent className="p-0">
                                    <div className="flex items-stretch min-h-[100px]">
                                        <div className={`w-1.5 ${isGraded ? 'bg-emerald-500' : submission ? 'bg-amber-500' : 'bg-slate-300'}`} />
                                        <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-inner ${submission ? 'bg-primary/5 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                        {submission ? <CheckCircle2 size={20} /> : <ClipboardList size={20} />}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{assignment.title}</h3>
                                                        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                                            <span className="flex items-center gap-1"><Clock size={12} /> Due {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM d, p') : 'No due date'}</span>
                                                            {submission && (
                                                                <span className={`flex items-center gap-1 ${isLate ? 'text-destructive font-black' : 'text-emerald-600'}`}>
                                                                    {isLate ? 'Submitted Late' : 'On Time'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {submission?.feedback && (
                                                    <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 italic text-sm text-muted-foreground leading-relaxed">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 not-italic">Teacher Feedback</p>
                                                        "{submission.feedback}"
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 leading-none">Grade</p>
                                                    <div className="flex items-baseline gap-1">
                                                        {isGraded ? (
                                                            <>
                                                                <span className="text-3xl font-black text-foreground tracking-tighter">{submission?.grade}</span>
                                                                <span className="text-xs font-black text-muted-foreground tracking-tighter">/%</span>
                                                            </>
                                                        ) : (
                                                            <Badge variant="secondary" className="font-black uppercase tracking-widest text-[10px] py-1">
                                                                {submission ? 'Pending' : 'No Submission'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase mt-1">
                                                        {assignment.maxPoints || 100} Points Max
                                                    </p>
                                                </div>
                                                <ChevronRight className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
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
