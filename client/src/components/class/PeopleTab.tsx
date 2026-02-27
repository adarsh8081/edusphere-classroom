import { useClassRoster } from "@/hooks/use-classes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Link, Mail } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "@shared/routes";
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
    <div className="max-w-3xl mx-auto space-y-12 pb-12 px-2 sm:px-0">

      {isTeacher && (
        <Card className="bg-primary/5 border-primary/20 shadow-none mb-8">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg text-primary">Class Code</h3>
              <p className="text-sm text-muted-foreground">Share this code with students so they can join your class.</p>
            </div>
            <div className="bg-white dark:bg-black px-6 py-3 rounded-lg border border-border shadow-sm text-2xl tracking-widest font-mono font-bold text-foreground select-all">
              {classCode}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-3xl font-display font-medium text-primary border-b-2 border-primary/20 pb-4 mb-6">Teachers</h2>
        <div className="space-y-2">
          {teachers.map(teacher => (
            <div key={teacher.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 rounded-xl transition-colors">
              <Avatar className="h-10 w-10 border shadow-sm">
                <AvatarImage src={teacher.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">{teacher.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-foreground">{teacher.name}</p>
                <p className="text-sm text-muted-foreground">{teacher.email}</p>
              </div>
              {currentUser?.id !== teacher.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-primary hover:bg-primary/10"
                  onClick={() => startConversation.mutate(teacher.id)}
                >
                  <MessageSquare size={16} className="mr-2" />
                  Message
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-end justify-between border-b-2 border-primary/20 pb-4 mb-6">
          <h2 className="text-3xl font-display font-medium text-primary">Students</h2>
          <span className="text-sm font-medium text-muted-foreground mb-1">{students.length} students</span>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No students have joined this class yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {students.map(student => (
              <div key={student.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 rounded-xl transition-colors border border-transparent hover:border-border/50">
                <Avatar className="h-10 w-10 border shadow-sm">
                  <AvatarImage src={student.avatarUrl || undefined} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{student.name}</p>
                </div>
                {currentUser?.id !== student.id && (
                  <div className="flex gap-2">
                    {isTeacher && (
                      <Dialog open={selectedStudent?.id === student.id} onOpenChange={(open) => !open && setSelectedStudent(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-muted-foreground hover:text-primary"
                            onClick={() => setSelectedStudent(student)}
                          >
                            <Link size={16} className="mr-2" />
                            Link Parent
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Link Parent for {student.name}</DialogTitle>
                          </DialogHeader>
                          <div className="py-4 space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="email">Parent's Email Address</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="email"
                                  type="email"
                                  placeholder="parent@example.com"
                                  className="pl-10"
                                  value={parentEmail}
                                  onChange={(e) => setParentEmail(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="ghost" onClick={() => setSelectedStudent(null)}>Cancel</Button>
                            <Button
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
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-primary hover:bg-primary/10"
                      onClick={() => startConversation.mutate(student.id)}
                    >
                      <MessageSquare size={16} className="mr-2" />
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
