import { useState } from "react";
import { format } from "date-fns";
import { InteractiveVideoPlayer } from "@/components/InteractiveVideoPlayer";
import { useAuth } from "@/hooks/use-auth";
import { useTopics, useAssignments, useCreateTopic, useCreateAssignment, useSubmissions, useCreateSubmission, useGradeSubmission } from "@/hooks/use-classwork";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, CheckCircle2, MoreVertical, Calendar, BookOpen, Sparkles, Tag, ListFilter, Users, HelpCircle, Lock, Upload, History, AlertTriangle, Link2, PencilLine } from "lucide-react";
import { useResources, useCreateResource, useSummarize, useSuggestTags, useRecommendations, useGenerateLessonPlan, useGenerateQuiz, useUpdateResourceVersion, useAssignmentReviews, useModerateReview } from "@/hooks/use-classwork";

export function ClassworkTab({ classId }: { classId: string }) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const { data: topics, isLoading: loadingTopics } = useTopics(classId);
  const { data: assignments, isLoading: loadingAssignments } = useAssignments(classId);

  const createTopic = useCreateTopic();
  const createAssignment = useCreateAssignment();

  const [topicName, setTopicName] = useState("");
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);

  const [assignmentData, setAssignmentData] = useState({
    title: "",
    instructions: "",
    topicId: "",
    maxPoints: 100,
    dueDate: "",
    isPeerReview: false,
    reviewDeadline: "",
    reviewsPerStudent: 2,
    prerequisites: [] as string[]
  });
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
        dueDate: assignmentData.dueDate ? new Date(assignmentData.dueDate).toISOString() : undefined,
        isPeerReview: assignmentData.isPeerReview,
        reviewDeadline: assignmentData.reviewDeadline ? new Date(assignmentData.reviewDeadline).toISOString() : undefined,
        reviewsPerStudent: assignmentData.reviewsPerStudent,
        prerequisites: assignmentData.prerequisites
      }
    });
    setAssignmentData({
      title: "",
      instructions: "",
      topicId: "",
      maxPoints: 100,
      dueDate: "",
      isPeerReview: false,
      reviewDeadline: "",
      reviewsPerStudent: 2,
      prerequisites: []
    });
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
        <div className="flex flex-wrap gap-4 items-center">
          <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="hover-elevate rounded-xl shadow-lg shadow-primary/30 h-10 px-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all">
                <Plus className="w-5 h-5 mr-2 drop-shadow-sm" />
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
                  <Input value={assignmentData.title} onChange={e => setAssignmentData({ ...assignmentData, title: e.target.value })} placeholder="Assignment title" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Instructions</label>
                  <Textarea value={assignmentData.instructions} onChange={e => setAssignmentData({ ...assignmentData, instructions: e.target.value })} placeholder="Provide detailed instructions..." className="min-h-[100px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Topic</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={assignmentData.topicId}
                      onChange={e => setAssignmentData({ ...assignmentData, topicId: e.target.value })}
                    >
                      <option value="">No Topic</option>
                      {topics?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Points</label>
                    <Input type="number" value={assignmentData.maxPoints} onChange={e => setAssignmentData({ ...assignmentData, maxPoints: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Input type="datetime-local" value={assignmentData.dueDate} onChange={e => setAssignmentData({ ...assignmentData, dueDate: e.target.value })} />
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Enable Peer Review</label>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={assignmentData.isPeerReview}
                      onChange={e => setAssignmentData({ ...assignmentData, isPeerReview: e.target.checked })}
                    />
                  </div>

                  {assignmentData.isPeerReview && (
                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Review Deadline</label>
                        <Input type="datetime-local" value={assignmentData.reviewDeadline} onChange={e => setAssignmentData({ ...assignmentData, reviewDeadline: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Reviews per Student</label>
                        <Input type="number" value={assignmentData.reviewsPerStudent} onChange={e => setAssignmentData({ ...assignmentData, reviewsPerStudent: parseInt(e.target.value) || 2 })} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><Lock className="w-4 h-4" /> Prerequisites</label>
                  <p className="text-[10px] text-muted-foreground">Students must complete the selected assignments before unlocking this one.</p>
                  <div className="max-h-32 overflow-y-auto space-y-2 bg-muted/20 p-2 rounded-md border text-sm">
                    {assignments?.length === 0 ? <p className="text-muted-foreground italic text-xs">No previous assignments available</p> : assignments?.map((a: any) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                          checked={assignmentData.prerequisites.includes(a.id)}
                          onChange={e => {
                            const newReqs = e.target.checked
                              ? [...assignmentData.prerequisites, a.id]
                              : assignmentData.prerequisites.filter(id => id !== a.id);
                            setAssignmentData({ ...assignmentData, prerequisites: newReqs });
                          }}
                        />
                        <span className="truncate flex-1">{a.title}</span>
                      </div>
                    ))}
                  </div>
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

          <CreateMaterialDialog classId={classId} topics={topics || []} />
          <LessonPlanGenerator />
          <QuizGeneratorDialog />
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
          <h2 className="text-2xl font-display font-semibold text-primary flex items-center justify-between border-b border-border/50 pb-2">
            <span className="flex items-center gap-2">{topic.name}</span>
            <span className="text-xs text-muted-foreground font-normal">Topic ID: {topic.id.slice(0, 8)}</span>
          </h2>
          <TopicContent topicId={topic.id} assignments={assignmentsByTopic[topic.id]} isTeacher={isTeacher} />
        </div>
      ))}

      {topics?.length === 0 && assignments?.length === 0 && (
        <div className="text-center py-20 px-4 glossy-panel rounded-3xl border border-white/20 shadow-xl backdrop-blur-md mt-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse-glow">
            <FileText className="w-10 h-10 text-primary drop-shadow-md" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2 drop-shadow-sm">Classwork empty</h3>
          <p className="text-muted-foreground text-lg max-w-sm mx-auto font-medium">
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

  const { data: reviews } = useAssignmentReviews(assignment.id);
  const moderateReview = useModerateReview();
  const [moderationState, setModerationState] = useState<Record<string, { score: string, isFlagged: boolean }>>({});

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
    <Accordion type="single" collapsible className="w-full matte-surface rounded-2xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden mb-3">
      <AccordionItem value="item-1" className="border-0">
        <AccordionTrigger className="px-5 sm:px-6 hover:no-underline group py-5 bg-black/5 dark:bg-white/5 transition-colors duration-300 backdrop-blur-sm">
          <div className="flex items-center gap-5 w-full text-left">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 group-hover:from-primary group-hover:to-cyan-500 group-hover:text-white transition-all duration-300 text-primary shadow-inner border border-primary/20 group-hover:shadow-[0_0_15px_rgba(23,226,255,0.4)]">
              <FileText className="w-6 h-6 transition-transform group-hover:scale-110 drop-shadow-sm" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="font-bold text-lg text-foreground truncate drop-shadow-sm">{assignment.title}</h4>
              <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground mt-1.5 flex-wrap">
                {assignment.dueDate && (
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/40 dark:bg-black/40 shadow-sm ${isPastDue && !mySubmission ? 'text-destructive' : ''}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    Due {format(new Date(assignment.dueDate), "MMM d, h:mm a")}
                  </span>
                )}
                {mySubmission && (
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 flex items-center gap-1.5 h-6 px-2.5 text-xs font-bold shadow-sm backdrop-blur-sm border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Turned in
                  </Badge>
                )}
                {assignment.isLocked && !isTeacher && (
                  <Badge variant="secondary" className="bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center gap-1.5 h-6 px-2.5 text-xs font-bold shadow-sm backdrop-blur-sm border border-destructive/20">
                    <Lock className="w-3.5 h-3.5" /> Locked
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
              {assignment.isLocked && !isTeacher && (
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl mt-4">
                  <h5 className="font-semibold text-destructive flex items-center gap-2 mb-1"><Lock className="w-4 h-4" /> Assignment Locked</h5>
                  <p className="text-sm text-destructive/80">You must complete the prerequisite assignments before you can turn in your work for this assignment.</p>
                </div>
              )}
            </div>

            <div className="md:col-span-1">
              {!isTeacher ? (
                <Card className="glossy-panel border-white/20 shadow-xl overflow-hidden rounded-2xl relative">
                  {/* Subtle gradient background for student work box */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-cyan-400/5 opacity-50 z-0"></div>
                  <CardHeader className="p-5 pb-3 relative z-10 border-b border-white/10">
                    <CardTitle className="text-base font-bold flex items-center justify-between drop-shadow-sm">
                      Your Work
                      {mySubmission?.grade !== null && mySubmission?.grade !== undefined && (
                        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 shadow-sm text-sm py-1 px-3">
                          {mySubmission.grade} / {assignment.maxPoints} pts
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-4 space-y-4 relative z-10">
                    {mySubmission ? (
                      <div className="space-y-4">
                        {mySubmission.fileUrl && (
                          <a href={mySubmission.fileUrl} target="_blank" rel="noreferrer" className="flex items-center p-3 rounded-xl border border-white/20 bg-black/5 dark:bg-white/5 hover:bg-white/10 text-sm font-semibold text-primary break-all shadow-sm transition-all">
                            <FileText className="w-5 h-5 mr-3 shrink-0" />
                            View Attached Document
                          </a>
                        )}
                        {mySubmission.content && (
                          <div className="p-4 bg-muted/40 rounded-xl text-sm whitespace-pre-wrap border border-white/10 shadow-inner">
                            {mySubmission.content}
                          </div>
                        )}
                        {mySubmission.feedback && (
                          <div className="mt-5 p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700/50 rounded-xl shadow-md">
                            <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Teacher Feedback:</p>
                            <p className="text-[15px] font-medium text-blue-950 dark:text-blue-100 leading-relaxed">{mySubmission.feedback}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Input
                          placeholder="Link to file/document..."
                          value={submissionUrl}
                          onChange={e => setSubmissionUrl(e.target.value)}
                          className="h-11 text-sm rounded-xl border-white/10 bg-black/5 dark:bg-white/5 shadow-inner"
                        />
                        <Textarea
                          placeholder="Or type answer here..."
                          className="min-h-[100px] text-sm resize-none rounded-xl border-white/10 bg-black/5 dark:bg-white/5 shadow-inner p-3"
                          value={submissionContent}
                          onChange={e => setSubmissionContent(e.target.value)}
                        />
                        <Button
                          className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20 hover-elevate"
                          onClick={handleSubmit}
                          disabled={(!submissionUrl && !submissionContent) || createSubmission.isPending || assignment.isLocked}
                        >
                          {createSubmission.isPending ? "Turning in..." : assignment.isLocked ? "Locked" : "Turn In"}
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
                              {sub.fileUrl && <a href={sub.fileUrl} target="_blank" className="text-xs text-primary hover:underline flex items-center"><FileText className="w-3 h-3 mr-1" /> View Attachment</a>}
                              {sub.content && <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded">{sub.content}</p>}
                            </div>

                            <div className="border-t border-border pt-2 mt-2 space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  placeholder={`/ ${assignment.maxPoints}`}
                                  className="h-8 text-xs w-20"
                                  defaultValue={sub.grade ?? ""}
                                  onChange={e => setGradingState(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], grade: parseFloat(e.target.value) } }))}
                                />
                                <Input
                                  placeholder="Add private feedback..."
                                  className="h-8 text-xs flex-1"
                                  defaultValue={sub.feedback || ""}
                                  onChange={e => setGradingState(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], feedback: e.target.value } }))}
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

              {isTeacher && assignment.isPeerReview && (
                <div className="space-y-3 pt-6 border-t border-border mt-6">
                  <h4 className="text-sm font-semibold px-1">Peer Reviews ({reviews?.length || 0})</h4>
                  {reviews?.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-1">No peer reviews submitted yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {reviews?.map((review: any) => (
                        <Card key={review.id} className={`shadow-none border-border overflow-hidden ${review.isFlagged ? 'bg-red-50/50 dark:bg-red-900/10' : 'bg-background'}`}>
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">Review by: {review.reviewer?.name}</span>
                              <div className="flex items-center gap-2">
                                {review.isFlagged && (
                                  <Badge variant="destructive" className="text-[10px]">Flagged</Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">Score: {review.score}</Badge>
                              </div>
                            </div>

                            <div className="space-y-2 mb-3">
                              <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">{review.content}</p>
                            </div>

                            <div className="border-t border-border pt-2 mt-2 space-y-2">
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="text"
                                  placeholder="Score"
                                  className="h-8 text-xs w-20"
                                  defaultValue={review.score}
                                  onChange={e => setModerationState(prev => ({
                                    ...prev,
                                    [review.id]: {
                                      score: e.target.value,
                                      isFlagged: prev[review.id]?.isFlagged ?? review.isFlagged
                                    }
                                  }))}
                                />
                                <label className="text-xs flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                                    defaultChecked={review.isFlagged}
                                    onChange={e => setModerationState(prev => ({
                                      ...prev,
                                      [review.id]: {
                                        score: prev[review.id]?.score ?? review.score,
                                        isFlagged: e.target.checked
                                      }
                                    }))}
                                  />
                                  <AlertTriangle className="w-3 h-3 text-red-500" />
                                  Flag
                                </label>
                                <Button
                                  size="sm"
                                  className="h-8 text-xs ml-auto"
                                  variant="secondary"
                                  onClick={() => {
                                    const state = moderationState[review.id] || { score: review.score, isFlagged: review.isFlagged };
                                    moderateReview.mutate({ reviewId: review.id, data: state });
                                  }}
                                  disabled={moderateReview.isPending}
                                >
                                  Update
                                </Button>
                              </div>
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

function TopicContent({ topicId, assignments, isTeacher }: { topicId: string, assignments: any[], isTeacher: boolean }) {
  const { data: resources, isLoading: loadingResources } = useResources(topicId);

  return (
    <div className="space-y-4">
      {/* Assignments */}
      {assignments?.map((a: any) => (
        <AssignmentItem key={a.id} assignment={a} isTeacher={isTeacher} />
      ))}

      {/* Resources/Materials */}
      {resources?.map((r: any) => (
        <ResourceItem key={r.id} resource={r} isTeacher={isTeacher} />
      ))}

      {!assignments?.length && !resources?.length && !loadingResources && (
        <p className="text-sm text-muted-foreground py-2 italic text-center bg-muted/5 rounded-lg border border-dashed">
          Empty topic.
        </p>
      )}
    </div>
  );
}

function ResourceItem({ resource, isTeacher }: { resource: any, isTeacher: boolean }) {
  const summarize = useSummarize();
  const suggestTags = useSuggestTags();
  const updateVersion = useUpdateResourceVersion();
  const [showAI, setShowAI] = useState(false);

  return (
    <div className="bg-card rounded-xl border border-border/60 p-4 transition-all hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            {resource.type === 'link' ? <BookOpen size={18} /> : <FileText size={18} />}
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{resource.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <a href={resource.url} target="_blank" className="text-xs text-primary hover:underline truncate max-w-xs">{resource.url}</a>
              {resource.previousVersions?.length > 0 && (
                <Badge variant="outline" className="text-[9px] py-0 px-1 border-primary/30 text-primary/70" title="Previous versions exist">
                  <History size={10} className="mr-1 inline" /> {resource.previousVersions.length}
                </Badge>
              )}
              {resource.tags?.map((tag: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-[10px] py-0">{tag}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isTeacher && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/20 rounded-xl" title="Update Version">
                  <Upload size={18} className="drop-shadow-sm" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Resource Version</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New File URL</label>
                    <Input id={`new-url-${resource.id}`} placeholder="https://..." defaultValue={resource.fileUrl || ''} />
                  </div>
                  <p className="text-xs text-muted-foreground">The current URL will be saved to the version history.</p>
                </div>
                <DialogFooter>
                  <Button onClick={() => {
                    const el = document.getElementById(`new-url-${resource.id}`) as HTMLInputElement;
                    if (el && el.value) {
                      updateVersion.mutate({ resourceId: resource.id, fileUrl: el.value });
                    }
                  }} disabled={updateVersion.isPending}>Save New Version</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="ghost" size="icon" onClick={() => setShowAI(!showAI)} className={showAI ? "text-primary bg-primary/10" : "text-muted-foreground"}>
            <Sparkles size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical size={16} />
          </Button>
        </div>
      </div>

      {showAI && (
        <div className="mt-4 pt-4 border-t border-border/50 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles size={12} className="text-primary" /> AI Summary
            </h5>
            {resource.summary ? (
              <p className="text-sm text-foreground bg-primary/5 p-3 rounded-lg border border-primary/10 leading-relaxed">{resource.summary}</p>
            ) : (
              <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-dashed">
                <p className="text-xs text-muted-foreground">No summary available.</p>
                {isTeacher && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => summarize.mutate({ resourceId: resource.id, text: resource.title })}
                    disabled={summarize.isPending}
                  >
                    Generate with AI
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag size={12} className="text-primary" /> Suggeted Tags
            </h5>
            <div className="flex flex-wrap gap-2">
              {suggestTags.isPending ? <p className="text-xs text-muted-foreground">Thinking...</p> : (
                <>
                  <Badge variant="outline" className="text-[10px] border-dashed cursor-pointer hover:bg-muted">#Educational</Badge>
                  <Button variant="ghost" className="h-5 text-[10px] px-2 p-0" onClick={() => suggestTags.mutate({ text: resource.title })}>
                    Auto-Suggest
                  </Button>
                </>
              )}
            </div>
          </div>

          <RecommendationsSection resourceId={resource.id} />
        </div>
      )}
    </div>
  );
}

function RecommendationsSection({ resourceId }: { resourceId: string }) {
  const { data: recommendations, isLoading } = useRecommendations(resourceId);

  if (isLoading) return <div className="animate-pulse h-10 bg-muted/20 rounded-lg"></div>;
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="space-y-2 pt-2 border-t border-border/30">
      <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
        <Users size={10} className="text-primary" /> Students Also Viewed
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {recommendations.map((rec: any) => (
          <a
            key={rec.id}
            href={rec.url}
            target="_blank"
            rel="noreferrer"
            className="group block p-2 rounded-lg bg-white border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <p className="text-[11px] font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">{rec.title}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1 opacity-70">{rec.reason || "Recommended for you"}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

function CreateMaterialDialog({ classId, topics }: { classId: string, topics: any[] }) {
  const [open, setOpen] = useState(false);
  const createResource = useCreateResource();
  const [data, setData] = useState({ title: "", url: "", type: "link", topicId: "" });

  const handleSubmit = async () => {
    if (!data.title || !data.url || !data.topicId) return;
    await createResource.mutateAsync({ topicId: data.topicId, data });
    setOpen(false);
    setData({ title: "", url: "", type: "link", topicId: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <Plus className="w-4 h-4 mr-2" />
          Material
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Material</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={data.title} onChange={e => setData({ ...data, title: e.target.value })} placeholder="e.g. Chapter 1 PDF" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">URL</label>
            <Input value={data.url} onChange={e => setData({ ...data, url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={data.type}
                onChange={e => setData({ ...data, type: e.target.value })}
              >
                <option value="link">Link</option>
                <option value="file">File</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Topic</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={data.topicId}
                onChange={e => setData({ ...data, topicId: e.target.value })}
              >
                <option value="">Select Topic</option>
                {topics?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!data.title || !data.url || !data.topicId || createResource.isPending}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LessonPlanGenerator() {
  const [open, setOpen] = useState(false);
  const generate = useGenerateLessonPlan();
  const [data, setData] = useState({ topic: "", grade: "", duration: "60 mins", objectives: "" });
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!data.topic || !data.grade) return;
    const res = await generate.mutateAsync(data);
    setResult(res.lessonPlan);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setResult(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-primary/30 text-primary hover:bg-primary/5">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Lesson Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            AI Lesson Plan Generator
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Topic / Subject</Label>
                <Input value={data.topic} onChange={e => setData({ ...data, topic: e.target.value })} placeholder="e.g. Introduction to Photosynthesis" />
              </div>
              <div className="space-y-2">
                <Label>Grade Level</Label>
                <Input value={data.grade} onChange={e => setData({ ...data, grade: e.target.value })} placeholder="e.g. 7th Grade" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input value={data.duration} onChange={e => setData({ ...data, duration: e.target.value })} placeholder="e.g. 45 minutes" />
            </div>
            <div className="space-y-2">
              <Label>Learning Objectives</Label>
              <Textarea
                value={data.objectives}
                onChange={e => setData({ ...data, objectives: e.target.value })}
                placeholder="What should students be able to do at the end of the lesson?"
                className="min-h-[100px]"
              />
            </div>
            <Button className="w-full" onClick={handleGenerate} disabled={!data.topic || !data.grade || generate.isPending}>
              {generate.isPending ? "Generating your plan..." : "Generate Lesson Plan"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-6">
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap leading-relaxed">{result}</div>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setResult(null)}>Start Over</Button>
              <Button className="flex-1" onClick={() => {
                const blob = new Blob([result], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `LessonPlan_${data.topic.replace(/\s+/g, '_')}.txt`;
                a.click();
              }}>Download .txt</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuizGeneratorDialog() {
  const [open, setOpen] = useState(false);
  const generate = useGenerateQuiz();
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<any[] | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    try {
      const res = await generate.mutateAsync({ topic });
      // The API returns the raw array or an empty array
      setResult(res);
    } catch (e) {
      console.error(e);
      setResult([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setResult(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-primary/30 text-primary hover:bg-primary/5">
          <HelpCircle className="w-4 h-4 mr-2" />
          AI Quiz Maker
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="text-primary" />
            AI Quiz Generator
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Source Text or Topic</Label>
              <Textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Paste the text or topic you want to generate a multiple choice quiz for..."
                className="min-h-[150px]"
              />
            </div>
            <Button className="w-full" onClick={handleGenerate} disabled={!topic.trim() || generate.isPending}>
              {generate.isPending ? "Generating 5 Questions..." : "Generate Quiz"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {result.length === 0 ? (
              <p className="text-muted-foreground italic text-center py-8">No quiz generated. Please ensure your Gemini API Key is valid and try again.</p>
            ) : (
              <div className="space-y-6">
                {result.map((q, i) => (
                  <div key={i} className="p-4 bg-muted/20 border border-border/50 rounded-xl space-y-3">
                    <p className="font-semibold text-foreground text-sm">{i + 1}. {q.question}</p>
                    <div className="space-y-2 pl-4">
                      {q.options.map((opt: string, optIdx: number) => (
                        <div key={optIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-bold ${q.answerIndex === optIdx ? "bg-emerald-100 border-emerald-300 text-emerald-700" : "bg-background border-border"}`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className={q.answerIndex === optIdx ? "font-medium text-foreground" : ""}>{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-4 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setResult(null)}>Generate Another</Button>
              <Button className="flex-1" onClick={() => {
                const text = result.map((q, i) =>
                  `${i + 1}. ${q.question}\n${q.options.map((o: string, j: number) => `   ${String.fromCharCode(65 + j)}) ${o}${q.answerIndex === j ? ' (CORRECT)' : ''}`).join('\n')}`
                ).join('\n\n');
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Quiz.txt`;
                a.click();
              }} disabled={result.length === 0}>Download .txt</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-sm font-semibold text-foreground mb-1 block">{children}</label>
);
