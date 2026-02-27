import { useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { useClasses, useCreateClass, useJoinClass } from "@/hooks/use-classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { BookOpen, Plus, Users, GraduationCap, ArrowRight, Activity, ClipboardList, AlertTriangle } from "lucide-react";
import { useAtRiskStudents, useRunRiskAssessment } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQueries } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: classes, isLoading } = useClasses();

  const isTeacher = user?.role === 'teacher';

  return (
    <div className="min-h-screen bg-muted/10">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">My Classes</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user?.name.split(' ')[0]}</p>
          </div>

          {isTeacher ? <CreateClassDialog /> : <JoinClassDialog />}
        </div>

        {isTeacher && <AtRiskWidget />}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : classes?.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-10 h-10 text-primary/60" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">No classes yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {isTeacher
                ? "Create your first class to start posting announcements and assignments."
                : "Join a class using the code provided by your teacher."}
            </p>
            {isTeacher ? <CreateClassDialog /> : <JoinClassDialog />}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes?.map((c: any) => (
              <Link key={c.id} href={`/class/${c.id}`}>
                <div className="group relative bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden hover-elevate cursor-pointer h-full flex flex-col">
                  {/* Card Banner */}
                  <div className="h-24 bg-gradient-to-r from-primary to-violet-500 relative p-5">
                    <h3 className="text-xl font-display font-bold text-white truncate pr-8 group-hover:underline decoration-white/50 underline-offset-4">{c.name}</h3>
                    <p className="text-white/80 text-sm truncate">{c.subject || 'General'} • {c.grade || 'All Grades'}</p>
                    <div className="absolute right-4 bottom-[-20px] w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-primary group-hover:scale-110 transition-transform">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 pt-8 flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {c.description || "No description provided."}
                    </p>

                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground pt-4 border-t border-border">
                      {isTeacher ? (
                        <>
                          <span className="flex items-center gap-1.5 text-emerald-600">
                            <Users className="w-3.5 h-3.5" /> {c.enrolledCount} Students
                          </span>
                          <span className="flex items-center gap-1.5 text-primary">
                            <Activity className="w-3.5 h-3.5" /> {c.activityScore} Active
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={`${c.pendingAssignmentsCount > 0 ? 'text-amber-600 font-bold' : 'text-muted-foreground'} flex items-center gap-1.5`}>
                            <ClipboardList className="w-3.5 h-3.5" /> {c.pendingAssignmentsCount} Pending
                          </span>
                          {c.latestGrade && (
                            <span className="flex items-center gap-1.5 text-primary">
                              <GraduationCap className="w-3.5 h-3.5" /> Grade: {c.latestGrade}%
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CreateClassDialog() {
  const [open, setOpen] = useState(false);
  const createClass = useCreateClass();
  const [formData, setFormData] = useState({ name: "", subject: "", grade: "", description: "" });

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    await createClass.mutateAsync(formData);
    setOpen(false);
    setFormData({ name: "", subject: "", grade: "", description: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="hover-elevate shadow-md shadow-primary/20 rounded-full px-6">
          <Plus className="w-5 h-5 mr-2" /> Create Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Create a class</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Class Name (required)</label>
            <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Algebra 101" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="Math" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Grade Level</label>
              <Input value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })} placeholder="9th Grade" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="What is this class about?" className="resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim() || createClass.isPending} className="rounded-full px-6">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function JoinClassDialog() {
  const [open, setOpen] = useState(false);
  const joinClass = useJoinClass();
  const [code, setCode] = useState("");

  const handleSubmit = async () => {
    if (!code.trim()) return;
    await joinClass.mutateAsync(code);
    setOpen(false);
    setCode("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="hover-elevate shadow-md shadow-primary/20 rounded-full px-6">
          <Plus className="w-5 h-5 mr-2" /> Join Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Join a class</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">Ask your teacher for the class code, then enter it here.</p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Class Code</label>
            <Input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="e.g. abc-defg"
              className="h-12 text-lg font-mono tracking-widest text-center"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!code.trim() || joinClass.isPending} className="rounded-full px-6">
            Join
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AtRiskWidget() {
  const { data: classes, isLoading: classesLoading } = useClasses();
  const runAssessment = useRunRiskAssessment();

  const riskQueries = useQueries({
    queries: (classes || []).map(c => ({
      queryKey: [api.analytics.atRisk.path, c.id],
      queryFn: async () => {
        const url = buildUrl(api.analytics.atRisk.path, { classId: c.id });
        const res = await fetch(url);
        if (!res.ok) return [];
        return res.json();
      }
    }))
  });

  const isLoading = classesLoading || riskQueries.some(q => q.isLoading);
  const allAtRisk = riskQueries
    .flatMap(q => (q.data as any[]) || [])
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  if (isLoading || !classes || classes.length === 0 || allAtRisk.length === 0) return null;

  return (
    <Card className="mb-10 border-amber-200 bg-amber-50/30 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-amber-100 bg-amber-50/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertTriangle className="text-amber-600 w-5 h-5" />
          </div>
          <CardTitle className="text-lg font-display text-amber-900">Priority: Students at Risk</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-amber-700 border-amber-200 hover:bg-amber-100/50"
          onClick={() => classes.map(c => runAssessment.mutate(c.id))}
          disabled={runAssessment.isPending}
        >
          {runAssessment.isPending ? "Analyzing..." : "Update Scores"}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-amber-100">
          {allAtRisk.map((risk, i) => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-amber-100/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-amber-200 shadow-sm font-bold text-amber-700">
                  {risk.studentId.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-amber-900">Student {risk.studentId.split('-')[0]}</p>
                  <p className="text-xs text-amber-600 font-medium">Risk Score: {risk.riskScore}%</p>
                </div>
              </div>
              <div className="flex gap-2">
                {risk.riskFactors.slice(0, 2).map((factor: string, j: number) => (
                  <Badge key={j} variant="secondary" className="bg-amber-100/50 text-[10px] text-amber-800 border-transparent">
                    {factor}
                  </Badge>
                ))}
              </div>
              <Link href={`/class/${risk.classId}`}>
                <Button variant="ghost" size="sm" className="text-amber-700 hover:bg-amber-200/40">
                  View Class <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
