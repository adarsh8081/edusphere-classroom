import { useClassRoster } from "@/hooks/use-classes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Link, Mail } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "@edusphere/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function PeopleTab({ classId, classCode, isTeacher }: { classId: string, classCode: string, isTeacher: boolean }) {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { data: roster, isLoading } = useClassRoster(classId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [parentEmail, setParentEmail] = useState("");

  const startConversation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'direct',
          participants: [otherUserId]
        })
      });
      return res.json();
    },
    onSuccess: () => {
      setLocation('/messages');
    }
  });

  const sendInvitation = useMutation({
    mutationFn: async ({ studentId, email }: { studentId: string, email: string }) => {
      const res = await fetch('/api/parents/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, parentEmail: email })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Invitation sent", description: `An email has been sent to ${parentEmail}` });
      setSelectedStudent(null);
      setParentEmail("");
    },
    onError: (err: any) => {
      toast({ title: "Failed to send invitation", description: err.message, variant: "destructive" });
    }
  });

  if (isLoading) {
    return <div className="space-y-4 max-w-3xl mx-auto p-4 animate-pulse">
      <div className="h-12 bg-muted rounded w-1/3 mb-8"></div>
      <div className="flex gap-4 items-center"><div className="w-10 h-10 rounded-full bg-muted"></div><div className="h-4 bg-muted w-48 rounded"></div></div>
      <div className="flex gap-4 items-center"><div className="w-10 h-10 rounded-full bg-muted"></div><div className="h-4 bg-muted w-48 rounded"></div></div>
    </div>;
  }

  const teachers = roster?.filter(u => u.role === 'teacher') || [];
  const students = roster?.filter(u => u.role === 'student') || [];

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-12 px-2 sm:px-0 relative z-10">

      {isTeacher && (
        <Card className="glossy-panel border-primary/20 shadow-lg mb-8 rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"></div>
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div>
              <h3 className="font-bold text-xl text-primary drop-shadow-sm flex items-center gap-2"><Link className="w-5 h-5" /> Class Code</h3>
              <p className="text-sm font-medium text-foreground/80 mt-1">Share this code with students so they can join your class.</p>
            </div>
            <div className="bg-white/50 dark:bg-black/50 backdrop-blur-md px-8 py-4 rounded-xl border border-white/20 shadow-inner text-3xl tracking-[0.2em] font-mono font-extrabold text-foreground select-all hover:bg-white/60 dark:hover:bg-black/60 transition-colors">
              {classCode}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-3xl font-display font-extrabold text-primary border-b-2 border-primary/20 pb-4 mb-6 drop-shadow-sm flex items-center gap-3">
          <Users className="w-8 h-8 opacity-80" /> Teachers
        </h2>
        <div className="space-y-3">
          {teachers.map(teacher => (
            <div key={teacher.id} className="flex items-center gap-5 p-5 bg-black/5 dark:bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md hover:-translate-y-0.5 group">
              <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-inner group-hover:border-primary/40 transition-colors">
                <AvatarImage src={teacher.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">{teacher.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-bold text-foreground text-lg">{teacher.name}</p>
                <p className="text-sm font-medium text-muted-foreground">{teacher.email}</p>
              </div>
              {currentUser?.id !== teacher.id && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-xl text-primary font-bold hover:bg-primary/10 shadow-sm border-white/20 backdrop-blur-sm h-10 px-4"
                  onClick={() => startConversation.mutate(teacher.id)}
                >
                  <MessageSquare size={18} className="mr-2 drop-shadow-sm" />
                  Message
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6">
        <div className="flex items-end justify-between border-b-2 border-primary/20 pb-4 mb-6">
          <h2 className="text-3xl font-display font-extrabold text-primary drop-shadow-sm flex items-center gap-3">
            <Users className="w-8 h-8 opacity-80" /> Students
          </h2>
          <span className="text-sm font-bold text-muted-foreground bg-primary/10 px-3 py-1 rounded-full border border-primary/20">{students.length} students</span>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-16 glossy-panel rounded-3xl border border-white/20 shadow-inner">
            <Users className="w-16 h-16 text-primary/30 mx-auto mb-4 drop-shadow-sm" />
            <p className="text-lg font-medium text-foreground/80">No students have joined this class yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map(student => (
              <div key={student.id} className="flex items-center gap-5 p-4 bg-black/5 dark:bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md hover:-translate-y-0.5 group">
                <Avatar className="h-12 w-12 border border-white/20 shadow-inner group-hover:border-primary/30 transition-colors">
                  <AvatarImage src={student.avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-cyan-500/20 text-primary font-bold">{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-foreground text-lg">{student.name}</p>
                </div>
                {currentUser?.id !== student.id && (
                  <div className="flex gap-3">
                    {isTeacher && (
                      <Dialog open={selectedStudent?.id === student.id} onOpenChange={(open) => !open && setSelectedStudent(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-xl text-muted-foreground hover:text-primary font-bold h-10 px-4 border-white/20 shadow-sm backdrop-blur-sm bg-white/5 hover:bg-white/10"
                            onClick={() => setSelectedStudent(student)}
                          >
                            <Link size={18} className="mr-2 opacity-70" />
                            Link Parent
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="matte-surface border-white/20 shadow-2xl rounded-3xl">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Link Parent for {student.name}</DialogTitle>
                          </DialogHeader>
                          <div className="py-6 space-y-4">
                            <div className="space-y-3">
                              <Label htmlFor="email" className="font-bold ml-1">Parent's Email Address</Label>
                              <div className="relative">
                                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                                <Input
                                  id="email"
                                  type="email"
                                  placeholder="parent@example.com"
                                  className="pl-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 border-white/10 shadow-inner focus:ring-primary/40 text-base"
                                  value={parentEmail}
                                  onChange={(e) => setParentEmail(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setSelectedStudent(null)}>Cancel</Button>
                            <Button
                              className="rounded-xl font-bold shadow-lg shadow-primary/20 h-10 px-6"
                              onClick={() => sendInvitation.mutate({ studentId: student.id, email: parentEmail })}
                              disabled={sendInvitation.isPending || !parentEmail}
                            >
                              Send Invitation
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-xl text-primary font-bold hover:bg-primary/10 shadow-sm border-white/20 backdrop-blur-sm h-10 px-4"
                      onClick={() => startConversation.mutate(student.id)}
                    >
                      <MessageSquare size={18} className="mr-2 drop-shadow-sm" />
                      Message
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
