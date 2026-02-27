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
import { BookOpen, Settings, Video, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

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
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Class Banner */}
      <div className="bg-gradient-to-r from-primary to-violet-600 text-white shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">{classData.name}</h1>
          <p className="text-white/80 text-lg max-w-2xl">{classData.subject} • {classData.grade}</p>

          <div className="flex gap-2 absolute top-4 right-4">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 transition-all font-semibold"
              onClick={() => window.open(`https://meet.jit.si/edusphere-${classData.classCode}`, '_blank')}
            >
              <Video className="w-4 h-4 mr-2" />
              Join Class Meeting
            </Button>
            {isTeacher && (
              <div className="flex gap-2">
                <ContentGenerator classId={classId!} />
                <Button variant="secondary" size="icon" className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-full">
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="stream" className="w-full">
          <TabsList className="flex h-auto p-0 bg-transparent border-b border-border/60 rounded-none mb-8 justify-start overflow-x-auto no-scrollbar gap-8">
            <TabsTrigger
              value="stream"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-base font-semibold data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-none"
            >
              Stream
            </TabsTrigger>
            <TabsTrigger
              value="classwork"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-base font-semibold data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-none"
            >
              Classwork
            </TabsTrigger>
            <TabsTrigger
              value="people"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-base font-semibold data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-none"
            >
              People
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-base font-semibold data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-none"
            >
              Attendance
            </TabsTrigger>
            {!isTeacher && (
              <TabsTrigger
                value="grades"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-base font-semibold data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-none"
              >
                Grades
              </TabsTrigger>
            )}
            {isTeacher && (
              <TabsTrigger
                value="analytics"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-base font-semibold data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-none"
              >
                Analytics
              </TabsTrigger>
            )}
            {isTeacher && (
              <TabsTrigger
                value="wellbeing"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-base font-semibold data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-none"
              >
                <Heart className="w-4 h-4 mr-1.5" /> Well-being
              </TabsTrigger>
            )}
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

          {isTeacher && (
            <TabsContent value="analytics" className="mt-6">
              <div className="space-y-6">
                <LearningPathDashboard classId={classId} />
                <AnalyticsTab classId={classId!} />
              </div>
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
