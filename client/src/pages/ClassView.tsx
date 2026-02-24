import { useParams } from "wouter";
import { Navbar } from "@/components/Navbar";
import { useClass } from "@/hooks/use-classes";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StreamTab } from "@/components/class/StreamTab";
import { ClassworkTab } from "@/components/class/ClassworkTab";
import { PeopleTab } from "@/components/class/PeopleTab";
import { AttendanceTab } from "@/components/class/AttendanceTab";
import { BookOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClassView() {
  const { classId } = useParams();
  const { data: classData, isLoading } = useClass(classId || "");
  const { user } = useAuth();
  
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
          
          {isTeacher && (
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 hover:text-white rounded-full">
              <Settings className="w-5 h-5" />
            </Button>
          )}
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
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-base font-semibold data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-none"
            >
              Attendance
            </TabsTrigger>
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
        </Tabs>
      </main>
    </div>
  );
}
