import { useParentDashboard } from "@/hooks/use-parent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
    Loader2,
    CalendarDays,
    TrendingUp,
    Award,
    Clock,
    MessageSquare,
    ChevronRight,
    TrendingDown,
    User
} from "lucide-react";
import { format } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { useState } from "react";
import { ParentTeacherChat } from "@/components/parent/ParentTeacherChat";

export default function ParentDashboard() {
    const { data: students, isLoading } = useParentDashboard();
    const [chatStudent, setChatStudent] = useState<any>(null);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-12">
                <header className="mb-12">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 rounded-lg px-3 py-1 font-black uppercase tracking-widest text-[10px]">
                            Parent Portal
                        </Badge>
                        <h1 className="text-5xl font-black font-display tracking-tight">Your Children. <span className="text-primary italic">Their Progress.</span></h1>
                        <p className="text-muted-foreground mt-2 max-w-lg">Monitoring student engagement and academic performance across EduSphere Classes.</p>
                    </motion.div>
                </header>

                {(!students || students.length === 0) ? (
                    <div className="p-20 text-center glass-panel rounded-[3rem] border-white/10">
                        <User className="w-16 h-16 mx-auto mb-6 opacity-20" />
                        <h3 className="text-2xl font-bold">No students linked yet</h3>
                        <p className="text-muted-foreground">Please use the invitation link provided by the teacher.</p>
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {students.map((student: any) => (
                            <StudentSummaryCard
                                key={student.studentId}
                                student={student}
                                onMessage={() => setChatStudent(student)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Chat Sidebar/Drawer */}
            {chatStudent && (
                <ParentTeacherChat
                    teacherId={chatStudent.report.recentSubmissions?.[0]?.teacherId || "primary_teacher"}
                    studentId={chatStudent.studentId}
                    studentName={chatStudent.name}
                    isOpen={!!chatStudent}
                    onClose={() => setChatStudent(null)}
                />
            )}
        </div>
    );
}

function StudentSummaryCard({ student, onMessage }: { student: any, onMessage: () => void }) {
    const report = student.report;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="glass-panel border-white/10 rounded-[3rem] overflow-hidden"
        >
            <div className="grid md:grid-cols-[350px_1fr] min-h-[400px]">
                {/* Left Side: Student Profile & Stats */}
                <div className="bg-white/3 border-r border-white/5 p-10 flex flex-col justify-between">
                    <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24 border-4 border-primary/20 p-1 bg-background shadow-2xl shadow-primary/10">
                            <AvatarImage src={student.avatarUrl} />
                            <AvatarFallback className="bg-primary/20 text-primary text-3xl font-black">{student.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-3xl font-black font-display tracking-tight leading-none mb-2">{student.name}</h2>
                            <Badge variant="outline" className="border-white/20 text-muted-foreground rounded-md">Linked Student</Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-12">
                        <div className="bg-background/40 p-5 rounded-[2rem] border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <CalendarDays className="w-5 h-5 text-emerald-400" />
                                <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Attendance</span>
                            </div>
                            <div className="text-3xl font-black text-emerald-400">{report.attendanceRate}%</div>
                        </div>
                        <div className="bg-background/40 p-5 rounded-[2rem] border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Avg Grade</span>
                            </div>
                            <div className="text-3xl font-black text-primary">{report.averageGrade}%</div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={onMessage}
                            className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
                        >
                            <MessageSquare className="w-5 h-5" /> Message Teacher
                        </button>
                    </div>
                </div>

                {/* Right Side: Recent Activity & Details */}
                <div className="p-10 bg-background/20 relative">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[.3em] text-muted-foreground">Recent Submissions</h4>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-4">On Track</Badge>
                    </div>

                    <div className="space-y-4">
                        {report.recentSubmissions.length > 0 ? report.recentSubmissions.map((sub: any) => (
                            <div key={sub.id} className="flex items-center justify-between p-6 glass-panel border-white/5 rounded-2xl hover:bg-white/3 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                        <Clock className="w-5 h-5 opacity-40" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm tracking-tight">{sub.assignmentTitle}</p>
                                        <p className="text-[10px] text-muted-foreground font-medium">{format(new Date(sub.submittedAt), "MMM d, yyyy")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-xs font-black text-primary uppercase">{sub.grade ? `${sub.grade}%` : 'PENDING'}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        )) : (
                            <p className="text-muted-foreground italic">No recent activity found.</p>
                        )}
                    </div>

                    <div className="absolute bottom-10 left-10 right-10 flex items-center justify-between pt-10 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Status: Active</span>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">View Detailed Analysis</button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
