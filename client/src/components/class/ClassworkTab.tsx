import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useTopics, useAssignments, useCreateTopic, useCreateAssignment, useSubmissions, useCreateSubmission, useGradeSubmission } from "@/hooks/use-classwork";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, CheckCircle2, MoreVertical, Calendar } from "lucide-react";

export function ClassworkTab({ classId }: { classId: string }) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  
  const { data: topics, isLoading: loadingTopics } = useTopics(classId);
  const { data: assignments, isLoading: loadingAssignments } = useAssignments(classId);
  
  const createTopic = useCreateTopic();
  const createAssignment = useCreateAssignment();

  const [topicName, setTopicName] = useState("");
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  
  const [assignmentData, setAssignmentData] = useState({ title: "", instructions: "", topicId: "", maxPoints: 100, dueDate: "" });
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);

  const handleCreateTopic = async () => {
    if (!topicName.trim()) return;
    await createTopic.mutateAsync({ classId, data: { name: topicName } });
    setTopicName("");
    setIsTopicDialogOpen(false);
  };

  const handleCreateAssignment = async () => {
    if (!assignmentData.title.trim()) return;
    await createAssignment.mutateAsync({ 
      classId, 
      data: { 
        title: assignmentData.title,
        instructions: assignmentData.instructions,
        topicId: assignmentData.topicId || undefined,
        maxPoints: assignmentData.maxPoints,
        dueDate: assignmentData.dueDate ? new Date(assignmentData.dueDate).toISOString() : undefined
      } 
    });
    setAssignmentData({ title: "", instructions: "", topicId: "", maxPoints: 100, dueDate: "" });
    setIsAssignmentDialogOpen(false);
  };

  // Group assignments by topic
  const assignmentsByTopic = assignments?.reduce((acc: any, assignment: any) => {
    const tId = assignment.topicId || 'unassigned';
    if (!acc[tId]) acc[tId] = [];
    acc[tId].push(assignment);
    return acc;
  }, {}) || {};

  if (loadingTopics || loadingAssignments) {
    return <div className="space-y-8 animate-pulse p-4">
      <div className="h-10 bg-muted w-1/4 rounded"></div>
      <div className="h-24 bg-muted rounded-xl"></div>
      <div className="h-24 bg-muted rounded-xl"></div>
    </div>;
  }

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-12">
      {isTeacher && (
        <div className="flex gap-4 items-center">
          <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="hover-elevate rounded-full shadow-md shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>New Assignment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input value={assignmentData.title} onChange={e => setAssignmentData({...assignmentData, title: e.target.value})} placeholder="Assignment title" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Instructions</label>
                  <Textarea value={assignmentData.instructions} onChange={e => setAssignmentData({...assignmentData, instructions: e.target.value})} placeholder="Provide detailed instructions..." className="min-h-[100px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Topic</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={assignmentData.topicId} 
                      onChange={e => setAssignmentData({...assignmentData, topicId: e.target.value})}
                    >
                      <option value="">No Topic</option>
                      {topics?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Points</label>
                    <Input type="number" value={assignmentData.maxPoints} onChange={e => setAssignmentData({...assignmentData, maxPoints: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Input type="datetime-local" value={assignmentData.dueDate} onChange={e => setAssignmentData({...assignmentData, dueDate: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateAssignment} disabled={!assignmentData.title.trim() || createAssignment.isPending}>Assign</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Topic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Topic</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input value={topicName} onChange={e => setTopicName(e.target.value)} placeholder="Topic name" autoFocus />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTopicDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateTopic} disabled={!topicName.trim() || createTopic.isPending}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Render Unassigned first if they exist */}
      {assignmentsByTopic['unassigned'] && assignmentsByTopic['unassigned'].length > 0 && (
        <div className="space-y-4">
          {assignmentsByTopic['unassigned'].map((a: any) => (
            <AssignmentItem key={a.id} assignment={a} isTeacher={isTeacher} />
          ))}
        </div>
      )}

      {/* Render Topics and their assignments */}
      {topics?.map((topic: any) => (
        <div key={topic.id} className="space-y-4 pt-6 first:pt-0">
          <h2 className="text-2xl font-display font-semibold text-primary flex items-center gap-2 border-b border-border/50 pb-2">
            {topic.name}
          </h2>
          {assignmentsByTopic[topic.id]?.length > 0 ? (
            <div className="space-y-4">
              {assignmentsByTopic[topic.id].map((a: any) => (
                <AssignmentItem key={a.id} assignment={a} isTeacher={isTeacher} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2 italic">No assignments in this topic yet.</p>
          )}
        </div>
      ))}
      
      {topics?.length === 0 && assignments?.length === 0 && (
        <div className="text-center py-20 px-4 bg-muted/20 rounded-3xl border border-dashed border-border mt-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Classwork empty</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {isTeacher ? "Create assignments and organize them into topics to structure your class." : "Your teacher hasn't assigned any work yet."}
          </p>
        </div>
      )}
    </div>
  );
}

function AssignmentItem({ assignment, isTeacher }: { assignment: any, isTeacher: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: submissions } = useSubmissions(assignment.id);
  const createSubmission = useCreateSubmission();
  const gradeSubmission = useGradeSubmission();
  
  const { user } = useAuth();
  const mySubmission = submissions?.find((s: any) => s.student?.id === user?.id);

  const [submissionContent, setSubmissionContent] = useState("");
  const [submissionUrl, setSubmissionUrl] = useState("");
  
  const [gradingState, setGradingState] = useState<Record<string, { grade: number, feedback: string }>>({});

  const handleSubmit = async () => {
    await createSubmission.mutateAsync({
      assignmentId: assignment.id,
      data: {
        content: submissionContent || undefined,
        fileUrl: submissionUrl || undefined,
      }
    });
  };

  const handleGrade = async (subId: string) => {
    const state = gradingState[subId];
    if (!state) return;
    await gradeSubmission.mutateAsync({
      assignmentId: assignment.id,
      submissionId: subId,
      grade: state.grade,
      feedback: state.feedback
    });
  };

  const isPastDue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  return (
    <Accordion type="single" collapsible className="w-full bg-card rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <AccordionItem value="item-1" className="border-0">
        <AccordionTrigger className="px-4 sm:px-6 hover:no-underline hover:bg-muted/30 group py-4">
          <div className="flex items-center gap-4 w-full text-left">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="font-semibold text-base text-foreground truncate">{assignment.title}</h4>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                {assignment.dueDate && (
                  <span className={`flex items-center gap-1 ${isPastDue && !mySubmission ? 'text-destructive font-medium' : ''}`}>
                    <Calendar className="w-3 h-3" />
                    Due {format(new Date(assignment.dueDate), "MMM d, h:mm a")}
                  </span>
                )}
                {mySubmission && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 h-5 px-1.5 text-[10px]">
                    <CheckCircle2 className="w-3 h-3" /> Turned in
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 sm:px-6 pb-6 pt-2 border-t border-border/50 bg-muted/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
            <div className="md:col-span-2 space-y-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap">{assignment.instructions || "No instructions provided."}</p>
              </div>
              <div className="pt-4 border-t border-border">
                <span className="text-sm font-medium text-muted-foreground">Points: {assignment.maxPoints}</span>
              </div>
            </div>
            
            <div className="md:col-span-1">
              {!isTeacher ? (
                <Card className="shadow-none border-border bg-background">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      Your Work
                      {mySubmission?.grade !== null && mySubmission?.grade !== undefined && (
                        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                          {mySubmission.grade} / {assignment.maxPoints}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-4">
                    {mySubmission ? (
                      <div className="space-y-3">
                        {mySubmission.fileUrl && (
                          <a href={mySubmission.fileUrl} target="_blank" rel="noreferrer" className="flex items-center p-2 rounded border hover:bg-muted text-sm text-primary break-all">
                            <FileText className="w-4 h-4 mr-2 shrink-0" />
                            Attachment link
                          </a>
                        )}
                        {mySubmission.content && (
                          <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap border border-border/50">
                            {mySubmission.content}
                          </div>
                        )}
                        {mySubmission.feedback && (
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">Teacher Feedback:</p>
                            <p className="text-sm text-blue-900 dark:text-blue-100">{mySubmission.feedback}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Input 
                          placeholder="Link to file/document..." 
                          value={submissionUrl}
                          onChange={e => setSubmissionUrl(e.target.value)}
                          className="h-9 text-sm"
                        />
                        <Textarea 
                          placeholder="Or type answer here..." 
                          className="min-h-[80px] text-sm resize-none"
                          value={submissionContent}
                          onChange={e => setSubmissionContent(e.target.value)}
                        />
                        <Button 
                          className="w-full h-9" 
                          onClick={handleSubmit}
                          disabled={(!submissionUrl && !submissionContent) || createSubmission.isPending}
                        >
                          {createSubmission.isPending ? "Turning in..." : "Turn In"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold px-1">Submissions ({submissions?.length || 0})</h4>
                  {submissions?.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-1">No submissions yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {submissions?.map((sub: any) => (
                        <Card key={sub.id} className="shadow-none border-border bg-background overflow-hidden">
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{sub.student?.name}</span>
                              {sub.grade !== null ? (
                                <Badge variant="secondary" className="text-xs">{sub.grade}/{assignment.maxPoints}</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">Needs Grading</Badge>
                              )}
                            </div>
                            
                            <div className="space-y-2 mb-3">
                              {sub.fileUrl && <a href={sub.fileUrl} target="_blank" className="text-xs text-primary hover:underline flex items-center"><FileText className="w-3 h-3 mr-1"/> View Attachment</a>}
                              {sub.content && <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded">{sub.content}</p>}
                            </div>

                            <div className="border-t border-border pt-2 mt-2 space-y-2">
                              <div className="flex gap-2">
                                <Input 
                                  type="number" 
                                  placeholder={`/ ${assignment.maxPoints}`} 
                                  className="h-8 text-xs w-20"
                                  defaultValue={sub.grade ?? ""}
                                  onChange={e => setGradingState(prev => ({...prev, [sub.id]: { ...prev[sub.id], grade: parseFloat(e.target.value) }}))}
                                />
                                <Input 
                                  placeholder="Add private feedback..." 
                                  className="h-8 text-xs flex-1"
                                  defaultValue={sub.feedback || ""}
                                  onChange={e => setGradingState(prev => ({...prev, [sub.id]: { ...prev[sub.id], feedback: e.target.value }}))}
                                />
                              </div>
                              <Button 
                                size="sm" 
                                className="w-full h-8 text-xs" 
                                variant="secondary"
                                onClick={() => handleGrade(sub.id)}
                                disabled={!gradingState[sub.id] || isNaN(gradingState[sub.id].grade)}
                              >
                                Return Grade
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
