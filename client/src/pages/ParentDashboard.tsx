import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { User, Calendar, BookOpen, GraduationCap, ClipboardList, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function ParentDashboard() {
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

    const { data: children, isLoading: loadingChildren } = useQuery<any[]>({
        queryKey: ["/api/parents/children"],
    });

    const { data: dashboard, isLoading: loadingDashboard } = useQuery<any>({
        queryKey: [buildUrl(api.parents.dashboard.path, { studentId: selectedChildId || "" })],
        enabled: !!selectedChildId,
    });

    if (loadingChildren) {
        return <div className="p-8 animate-pulse italic text-muted-foreground">Loading your family portal...</div>;
    }

    if (!children || children.length === 0) {
        return (
            <div className="p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <User className="text-muted-foreground" size={32} />
                </div>
                <h2 className="text-2xl font-semibold mb-2">No linked students found</h2>
                <p className="text-muted-foreground">Please request a student linking code from the classroom teacher.</p>
            </div>
        );
    }

    // Auto-select first child if none selected
    if (!selectedChildId && children.length > 0) {
        setSelectedChildId(children[0].id);
    }

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] p-6 lg:p-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Family Portal
                    </h1>
                    <p className="text-muted-foreground text-lg mt-1">Monitor your child's academic journey at EduSphere.</p>
                </div>

                <div className="flex gap-2">
                    {children.map((child) => (
                        <button
                            key={child.id}
                            onClick={() => setSelectedChildId(child.id)}
                            className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 border-2 ${selectedChildId === child.id
                                ? "bg-primary/5 border-primary text-primary shadow-sm"
                                : "bg-background border-transparent hover:border-muted text-muted-foreground"
                                }`}
                        >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User size={16} />
                            </div>
                            <span className="font-medium text-sm">{child.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {!loadingDashboard && dashboard ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <BookOpen size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Total Classes</p>
                                            <p className="text-2xl font-bold">{dashboard.classes.length}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                            <ClipboardList size={20} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">Assignments</p>
                                            <p className="text-2xl font-bold">{dashboard.assignments.length}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                            <TrendingUp size={20} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Submissions</p>
                                            <p className="text-2xl font-bold">{dashboard.submissions.length}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tabs Section */}
                        <Tabs defaultValue="assignments" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex mb-4 bg-muted/40 p-1 rounded-xl">
                                <TabsTrigger value="assignments" className="rounded-lg px-6 py-2">Assignments</TabsTrigger>
                                <TabsTrigger value="attendance" className="rounded-lg px-6 py-2">Attendance</TabsTrigger>
                            </TabsList>

                            <TabsContent value="assignments" className="space-y-4">
                                <ScrollArea className="h-[500px] pr-4">
                                    <div className="space-y-4">
                                        {dashboard.assignments.length > 0 ? (
                                            dashboard.assignments.map((assignment: any) => {
                                                const submission = dashboard.submissions.find((s: any) => s.assignmentId === assignment.id);
                                                return (
                                                    <Card key={assignment.id} className="hover:shadow-md transition-shadow duration-300 border border-muted/30">
                                                        <CardHeader className="pb-2">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <CardTitle className="text-lg font-semibold">{assignment.title}</CardTitle>
                                                                    <CardDescription className="text-sm mt-1">
                                                                        Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'PPP') : 'No due date'}
                                                                    </CardDescription>
                                                                </div>
                                                                <Badge variant={submission ? "default" : "secondary"} className="rounded-full">
                                                                    {submission ? (submission.grade ? `Graded: ${submission.grade}` : "Submitted") : "Pending"}
                                                                </Badge>
                                                            </div>
                                                        </CardHeader>
                                                        {submission && (
                                                            <CardContent>
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between text-sm">
                                                                        <span className="text-muted-foreground">Progress</span>
                                                                        <span className="font-medium">{submission.grade ? "100%" : "Processing"}</span>
                                                                    </div>
                                                                    <Progress value={submission.grade ? 100 : 50} className="h-2 rounded-full" />
                                                                </div>
                                                            </CardContent>
                                                        )}
                                                    </Card>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-12 text-muted-foreground italic">No assignments assigned to this student yet.</div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="attendance">
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="text-primary" size={20} />
                                            Attendance History
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {dashboard.attendance.length > 0 ? (
                                                dashboard.attendance.map((record: any) => (
                                                    <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                                                        <span className="font-medium">{format(new Date(record.date), 'MMMM d, yyyy')}</span>
                                                        <Badge className={`rounded-full shadow-sm ${record.status === 'present' ? 'bg-emerald-500 hover:bg-emerald-600' :
                                                            record.status === 'late' ? 'bg-amber-500 hover:bg-amber-600' :
                                                                'bg-rose-500 hover:bg-rose-600'
                                                            }`}>
                                                            {record.status}
                                                        </Badge>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-muted-foreground italic">No attendance records found.</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar / Classes */}
                    <div className="space-y-8">
                        <Card className="border-none shadow-md overflow-hidden bg-primary/5">
                            <CardHeader className="bg-primary/10">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <GraduationCap className="text-primary" size={24} />
                                    Enrolled Classes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-muted/30">
                                    {dashboard.classes.map((cls: any) => (
                                        <div key={cls.id} className="p-4 hover:bg-primary/10 transition-colors duration-200">
                                            <h3 className="font-bold text-lg">{cls.name}</h3>
                                            <p className="text-sm text-muted-foreground">{cls.subject} • Grade {cls.grade}</p>
                                            {cls.meetingUrl && (
                                                <a
                                                    href={cls.meetingUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-3 inline-flex items-center text-primary text-xs font-semibold hover:underline"
                                                >
                                                    Join Virtual Classroom →
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-dashed border-2 bg-transparent">
                            <CardContent className="p-6 text-center">
                                <p className="text-sm text-muted-foreground mb-4 font-medium italic">
                                    "Education is the most powerful weapon which you can use to change the world."
                                </p>
                                <span className="text-xs font-bold uppercase tracking-widest text-primary/60">— Nelson Mandela</span>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] animate-pulse text-muted-foreground italic">
                    Fetching student performance data...
                </div>
            )}
        </div>
    );
}
