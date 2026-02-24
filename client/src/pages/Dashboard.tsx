import { useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { useClasses, useCreateClass, useJoinClass } from "@/hooks/use-classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { BookOpen, Plus, Users, GraduationCap, ArrowRight } from "lucide-react";

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
            {classes?.map(c => (
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
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> Active</span>
                      <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5"/> View Class</span>
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
            <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Algebra 101" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Math" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Grade Level</label>
              <Input value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} placeholder="9th Grade" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What is this class about?" className="resize-none" />
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
