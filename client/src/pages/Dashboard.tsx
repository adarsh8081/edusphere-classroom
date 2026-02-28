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
    <div className="min-h-screen relative z-10 pt-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 glossy-panel rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : classes?.length === 0 ? (
          <div className="glossy-panel border-white/20 rounded-3xl p-12 text-center shadow-2xl backdrop-blur-xl max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.2)] border border-primary/20 animate-pulse-glow">
              <GraduationCap className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-3xl font-display font-bold text-foreground mb-3 drop-shadow-sm">No classes yet</h3>
            <p className="text-muted-foreground mb-8 text-lg">
              {isTeacher
                ? "Create your first class to start posting announcements and assignments."
                : "Join a class using the code provided by your teacher."}
            </p>
            {isTeacher ? <CreateClassDialog /> : <JoinClassDialog />}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {classes?.map((c: any) => (
              <Link key={c.id} href={`/class/${c.id}`}>
                <div className="group relative matte-surface rounded-3xl border border-white/20 shadow-lg hover:shadow-[0_20px_40px_-15px_rgba(23,226,255,0.3)] transition-all duration-500 overflow-hidden cursor-pointer h-full flex flex-col hover:-translate-y-2">
                  {/* Card Banner */}
                  <div className="h-32 bg-gradient-to-br from-primary to-cyan-500 relative p-6 overflow-hidden">
                    {/* Glassy Overlay effect in banner */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <h3 className="text-2xl font-display font-bold text-white truncate pr-10 relative z-10 drop-shadow-md">{c.name}</h3>
                    <p className="text-white/90 text-sm truncate font-medium relative z-10 drop-shadow-sm mt-1">{c.subject || 'General'} • {c.grade || 'All Grades'}</p>

                    <div className="absolute right-6 bottom-[-24px] w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl text-primary group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 z-20 border border-primary/10">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 pt-10 flex-1 flex flex-col bg-card/60 backdrop-blur-md">
                    <p className="text-sm text-foreground/80 line-clamp-2 mb-6 flex-1 font-medium">
                      {c.description || "No description provided."}
                    </p>

                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pt-5 border-t border-border/50">
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
    <Card className="mb-10 border-amber-500/30 bg-amber-500/10 backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_rgba(245,158,11,0.15)] hover:shadow-[0_8px_32px_rgba(245,158,11,0.25)] transition-all duration-500 rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between py-5 border-b border-amber-500/20 bg-amber-500/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg border border-white/20">
            <AlertTriangle className="text-white w-6 h-6 drop-shadow-md" />
          </div>
          <CardTitle className="text-xl font-display font-bold text-amber-500 drop-shadow-sm">Priority: Students at Risk</CardTitle>
        </div>
        <Button
          variant="outline"
          className="text-amber-500 border-amber-500/30 hover:bg-amber-500/20 hover:text-amber-400 font-bold rounded-xl"
          onClick={() => classes.map(c => runAssessment.mutate(c.id))}
          disabled={runAssessment.isPending}
        >
          {runAssessment.isPending ? "Analyzing..." : "Update Scores"}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-amber-500/10">
          {allAtRisk.map((risk, i) => (
            <div key={i} className="flex items-center justify-between p-5 hover:bg-amber-500/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center border border-amber-300 shadow-inner font-extrabold text-amber-800 text-lg">
                  {risk.studentId.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">Student {risk.studentId.split('-')[0]}</p>
                  <p className="text-sm text-amber-500 font-bold tracking-wide">Risk Score: {risk.riskScore}%</p>
                </div>
              </div>
              <div className="flex gap-2">
                {risk.riskFactors.slice(0, 2).map((factor: string, j: number) => (
                  <Badge key={j} variant="secondary" className="bg-amber-500/20 text-xs font-bold text-amber-400 border-transparent px-3 py-1 rounded-lg backdrop-blur-sm">
                    {factor}
                  </Badge>
                ))}
              </div>
              <Link href={`/class/${risk.classId}`}>
                <Button variant="ghost" className="text-amber-500 hover:bg-amber-500/20 font-bold rounded-xl h-10">
                  View Class <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
