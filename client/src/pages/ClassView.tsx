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
    <div className="min-h-screen relative z-10 pt-4">
      <Navbar />

      {/* Class Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-gradient-to-r from-primary to-cyan-500 text-white rounded-3xl overflow-hidden relative shadow-[0_20px_40px_-15px_rgba(23,226,255,0.4)] border-white/20">
          {/* Decorative floating sphere behind banner text */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-[40px] mix-blend-overlay pointer-events-none"></div>

          <div className="px-6 sm:px-12 py-10 md:py-16 relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-3 tracking-tight break-words">{classData.name}</h1>
            <p className="text-white/90 text-lg sm:text-xl max-w-2xl font-medium mb-6 sm:mb-0">{classData.subject} • {classData.grade}</p>

            <div className="flex flex-wrap gap-3 sm:absolute sm:bottom-6 sm:right-6">
              <Button
                variant="secondary"
                className="bg-white hover:bg-white/90 text-primary border-none shadow-lg transition-all font-bold rounded-xl h-10 sm:h-11 px-4 sm:px-6"
                onClick={() => window.open(`https://meet.jit.si/edusphere-${classData.classCode}`, '_blank')}
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Join Meeting
              </Button>
              {isTeacher && (
                <div className="flex gap-2 sm:gap-3">
                  <ContentGenerator classId={classId!} />
                  <Button variant="secondary" size="icon" className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-md shadow-lg rounded-xl h-10 w-10 sm:h-11 sm:w-11">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Tabs defaultValue="stream" className="w-full">
          <TabsList className="flex h-auto p-2 bg-black/5 dark:bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl mb-8 justify-start overflow-x-auto no-scrollbar gap-2 shadow-inner">
            <TabsTrigger
              value="stream"
              className="rounded-xl data-[state=active]:bg-white/80 dark:data-[state=active]:bg-black/80 data-[state=active]:shadow-md px-6 py-3 text-sm font-bold data-[state=active]:text-foreground text-muted-foreground hover:bg-white/40 transition-all border-none"
            >
              Stream
            </TabsTrigger>
            <TabsTrigger
              value="classwork"
              className="rounded-xl data-[state=active]:bg-white/80 dark:data-[state=active]:bg-black/80 data-[state=active]:shadow-md px-6 py-3 text-sm font-bold data-[state=active]:text-foreground text-muted-foreground hover:bg-white/40 transition-all border-none"
            >
              Classwork
            </TabsTrigger>
            <TabsTrigger
              value="people"
              className="rounded-xl data-[state=active]:bg-white/80 dark:data-[state=active]:bg-black/80 data-[state=active]:shadow-md px-6 py-3 text-sm font-bold data-[state=active]:text-foreground text-muted-foreground hover:bg-white/40 transition-all border-none"
            >
              People
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="rounded-xl data-[state=active]:bg-white/80 dark:data-[state=active]:bg-black/80 data-[state=active]:shadow-md px-6 py-3 text-sm font-bold data-[state=active]:text-foreground text-muted-foreground hover:bg-white/40 transition-all border-none"
            >
              Attendance
            </TabsTrigger>
            {!isTeacher && (
              <TabsTrigger
                value="grades"
                className="rounded-xl data-[state=active]:bg-white/80 dark:data-[state=active]:bg-black/80 data-[state=active]:shadow-md px-6 py-3 text-sm font-bold data-[state=active]:text-foreground text-muted-foreground hover:bg-white/40 transition-all border-none"
              >
                Grades
              </TabsTrigger>
            )}
            {isTeacher && (
              <TabsTrigger
                value="analytics"
                className="rounded-xl data-[state=active]:bg-white/80 dark:data-[state=active]:bg-black/80 data-[state=active]:shadow-md px-6 py-3 text-sm font-bold data-[state=active]:text-foreground text-muted-foreground hover:bg-white/40 transition-all border-none"
              >
                Analytics
              </TabsTrigger>
            )}
            {isTeacher && (
              <TabsTrigger
                value="wellbeing"
                className="rounded-xl data-[state=active]:bg-amber-100/80 dark:data-[state=active]:bg-amber-900/80 data-[state=active]:shadow-md px-6 py-3 text-sm font-bold data-[state=active]:text-amber-700 text-muted-foreground hover:bg-amber-50/40 transition-all border-none flexitems-center"
              >
                <Heart className="w-4 h-4 mr-2" /> Well-being
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
