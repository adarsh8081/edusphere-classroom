import { useParams } from "wouter";
import { Navbar } from "@/components/Navbar";
import { useClass } from "@/hooks/use-classes";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StreamTab } from "@/components/class/StreamTab";
import { ClassworkTab } from "@/components/class/ClassworkTab";
import { PeopleTab } from "@/components/class/PeopleTab";
import { AttendanceTab } from "@/components/class/AttendanceTab";
import { AnalyticsTab } from "@/components/class/AnalyticsTab";
import { GradesTab } from "@/components/class/GradesTab";
import { BotChatWidget } from "@/components/BotChatWidget";
import { LearningPathDashboard } from "@/components/LearningPathDashboard";
import { ContentGenerator } from "@/components/ContentGenerator";
import { WellbeingCheckinDialog } from "@/components/WellbeingCheckinDialog";
import { WellbeingDashboard } from "@/components/WellbeingDashboard";
import { TeacherAIPanel } from "@/components/TeacherAIPanel";
import { LeaderboardPanel } from "@/components/gamification/LeaderboardPanel";
import { ParentCommsTab } from "@/components/class/ParentCommsTab";
import { BookOpen, Settings, Video, Heart, Trophy, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit2, Trash2 } from "lucide-react";
import { useUpdateClass, useDeleteClass } from "@/hooks/use-classes";
import { useLocation } from "wouter";

function ClassSettingsDropdown({ classData }: { classData: any }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [name, setName] = useState(classData.name);
  const [description, setDescription] = useState(classData.description || "");
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();
  const [, setLocation] = useLocation();

  const handleUpdate = async () => {
    if (!name.trim()) return;
    await updateClass.mutateAsync({ id: classData.id, data: { name, description } });
    setIsEditDialogOpen(false);
  };

  const handleDelete = async () => {
    await deleteClass.mutateAsync(classData.id);
    setIsDeleteDialogOpen(false);
    setLocation("/");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-xl shadow-2xl rounded-2xl h-12 w-12 sm:h-14 sm:w-14">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-xl border-white/10">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)} className="cursor-pointer gap-2">
            <Edit2 className="w-4 h-4" /> Edit Class
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="cursor-pointer gap-2 text-red-500 focus:bg-red-500/10 focus:text-red-500">
            <Trash2 className="w-4 h-4" /> Delete Class
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-panel border-white/10 bg-background/80 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle>Edit Class Details</DialogTitle>
            <DialogDescription>Update your class name and description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Class Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Advanced Mathematics" className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn?" className="bg-background/50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateClass.isPending || !name.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="glass-panel border-red-500/20 bg-background/80 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong className="text-foreground">{classData.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteClass.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ClassView() {
  const { classId } = useParams();
  const { data: classData, isLoading } = useClass(classId || "");
  const { user } = useAuth();
  const [showCheckin, setShowCheckin] = useState(false);

  // Show wellbeing check-in once per session for students
  useEffect(() => {
    if (!user || user.role !== 'student' || !classId) return;
    const key = `wellbeing_checkin_${classId}_${new Date().toDateString()}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      const timer = setTimeout(() => setShowCheckin(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [classId, user]);

  if (!classId) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-48 bg-muted animate-pulse"></div>
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <div className="h-10 bg-muted w-1/3 rounded animate-pulse mb-8"></div>
          <div className="h-[400px] bg-muted rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <BookOpen className="w-16 h-16 text-muted-foreground opacity-20 mb-4" />
          <h2 className="text-2xl font-bold">Class not found</h2>
          <p className="text-muted-foreground mt-2">The class you are looking for does not exist or you don't have access.</p>
        </div>
      </div>
    );
  }

  const isTeacher = user?.role === 'teacher';

  return (
    <div className="min-h-screen relative z-10 pt-4">
      <Navbar />

      {/* Class Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="holographic-card bg-gradient-to-br from-primary to-indigo-600 text-white rounded-[2.5rem] overflow-hidden relative shadow-2xl border-white/10 group">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-[60px] mix-blend-overlay pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>

          <div className="px-6 sm:px-12 py-10 md:py-16 relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-extrabold mb-3 tracking-tight break-words drop-shadow-2xl">{classData.name}</h1>
            <p className="text-white/80 text-lg sm:text-xl max-w-2xl font-bold uppercase tracking-widest mb-6 sm:mb-0 drop-shadow-md">{classData.subject} • {classData.grade}</p>

            <div className="flex flex-wrap gap-4 sm:absolute sm:bottom-8 sm:right-8">
              <Button
                variant="secondary"
                className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white hover:text-primary text-white shadow-2xl transition-all font-bold rounded-2xl h-12 sm:h-14 px-6 sm:px-8 group/btn"
                onClick={() => window.open(`https://meet.jit.si/edusphere-${classData.classCode}`, '_blank')}
              >
                <Video className="w-5 h-5 sm:w-6 sm:h-6 mr-3 group-hover/btn:scale-110 transition-transform" />
                Live Session
              </Button>
              {isTeacher && (
                <div className="flex gap-3">
                  <ContentGenerator classId={classId!} />
                  <ClassSettingsDropdown classData={classData} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Tabs defaultValue="stream" className="w-full">
          <TabsList className="flex h-auto p-2 glass-panel border-white/10 rounded-[2rem] mb-10 justify-start overflow-x-auto scroll-hide gap-2 shadow-2xl">
            {[
              { value: "stream", label: "Stream", icon: null },
              { value: "classwork", label: "Classwork", icon: null },
              { value: "people", label: "People", icon: null },
              { value: "attendance", label: "Attendance", icon: null },
              { value: "grades", label: "Grades", icon: null, hide: isTeacher },
              { value: "leaderboard", label: "Leaderboard", icon: Trophy, color: "text-yellow-400" },
              { value: "analytics", label: "Analytics", icon: null, hide: !isTeacher },
              { value: "parent_comms", label: "Parent Comms", icon: MessageSquare, hide: !isTeacher, color: "text-blue-400" },
              { value: "wellbeing", label: "Well-being", icon: Heart, hide: !isTeacher, color: "text-rose-400" },
            ].filter(t => !t.hide).map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={`rounded-[1.25rem] px-6 py-3 text-sm font-bold transition-all border-none
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20
                  text-muted-foreground hover:bg-white/5 hover:text-foreground`}
              >
                {tab.icon && <tab.icon className={`w-4 h-4 mr-2 ${tab.color}`} />}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="stream" className="mt-0 outline-none">
            <StreamTab classId={classData.id} />
          </TabsContent>

          <TabsContent value="classwork" className="mt-0 outline-none">
            <ClassworkTab classId={classData.id} />
          </TabsContent>

          <TabsContent value="people" className="mt-0 outline-none">
            <PeopleTab classId={classData.id} classCode={classData.classCode} isTeacher={isTeacher} />
          </TabsContent>

          <TabsContent value="attendance" className="mt-0 outline-none">
            <AttendanceTab classId={classData.id} />
          </TabsContent>

          {!isTeacher && (
            <TabsContent value="grades" className="mt-0 outline-none">
              <GradesTab classId={classData.id} />
            </TabsContent>
          )}

          <TabsContent value="leaderboard" className="mt-0 outline-none">
            <div className="max-w-2xl mx-auto">
              <LeaderboardPanel classId={classData.id} />
            </div>
          </TabsContent>

          {isTeacher && (
            <TabsContent value="analytics" className="mt-6">
              <div className="space-y-6">
                <TeacherAIPanel classId={classId!} />
                <LearningPathDashboard classId={classId} />
                <AnalyticsTab classId={classId!} />
              </div>
            </TabsContent>
          )}

          {isTeacher && (
            <TabsContent value="parent_comms" className="mt-6">
              <ParentCommsTab classId={classId!} />
            </TabsContent>
          )}

          {isTeacher && (
            <TabsContent value="wellbeing" className="mt-6">
              <WellbeingDashboard classId={classId!} />
            </TabsContent>
          )}
        </Tabs>
      </main>
      <BotChatWidget classId={classId} />
      {/* Student daily wellbeing check-in (auto pop-up, once per session) */}
      {!isTeacher && classId && (
        <WellbeingCheckinDialog
          classId={classId}
          open={showCheckin}
          onClose={() => setShowCheckin(false)}
        />
      )}
    </div>
  );
}
