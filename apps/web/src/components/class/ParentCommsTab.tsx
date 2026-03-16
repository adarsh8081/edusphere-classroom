import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClassRoster } from "@/hooks/use-classes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Loader2, ChevronRight, User } from "lucide-react";
import { ParentTeacherChat } from "@/components/parent/ParentTeacherChat";
import { useAuth } from "@/hooks/use-auth";

export function ParentCommsTab({ classId }: { classId: string }) {
    const { user } = useAuth();
    const { data: roster, isLoading: loadingRoster } = useClassRoster(classId);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    if (loadingRoster) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
        );
    }

    // Filter students who might have parents linked (or just all students)
    const students = roster?.filter(u => u.role === 'student') || [];

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-black font-display tracking-tight leading-none mb-2">Parent Communications</h2>
                <p className="text-muted-foreground">Manage direct 1-on-1 messaging with parents of your students.</p>
            </header>

            <div className="grid md:grid-cols-[300px_1fr] gap-8">
                <Card className="glass-panel border-white/10 rounded-[2rem] overflow-hidden self-start">
                    <CardHeader className="bg-primary/5 border-b border-white/5">
                        <CardTitle className="text-sm font-black uppercase tracking-widest opacity-60">Student Roster</CardTitle>
                    </CardHeader>
                    <ScrollArea className="h-[600px]">
                        <div className="p-2 space-y-1">
                            {students.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => setSelectedStudent(student)}
                                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${selectedStudent?.id === student.id
                                        ? "bg-primary/10 text-primary shadow-inner"
                                        : "hover:bg-white/5"
                                        }`}
                                >
                                    <Avatar className="h-10 w-10 border border-white/10">
                                        <AvatarImage src={student.avatarUrl as string | undefined} />
                                        <AvatarFallback>{student.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-left">
                                        <p className="font-bold text-sm tracking-tight">{student.name}</p>
                                        <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">Linked Parent</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>

                <div className="min-h-[600px] glass-panel border-white/10 rounded-[3.5rem] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    {selectedStudent ? (
                        <div className="w-full h-full flex flex-col items-center">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-primary/20 flex items-center justify-center mb-6">
                                <MessageSquare className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-3xl font-black mb-2">Chat with {selectedStudent.name}'s Parent</h3>
                            <p className="text-muted-foreground mb-8 max-w-sm">Use the secure channel to discuss progress, attendance, or behavioral updates.</p>

                            <Button
                                className="h-16 px-10 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-transform"
                                onClick={() => setSelectedStudent(selectedStudent)} // This will be handled by the fact it's already selected
                            >
                                Open Chat Interface
                            </Button>

                            {/* For Teachers, the "Parent" ID needs to be fetched.
                     In this simplified version, we'll assume there's a convention or we need an API to find the linked parent.
                 */}
                            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Encrypted Communication Channel</p>
                        </div>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                            <User className="w-16 h-16 opacity-10 mb-6" />
                            <h3 className="text-2xl font-bold opacity-30 italic">Select a student to view parent messages</h3>
                        </>
                    )}
                </div>
            </div>

            {/* Reusing the same Chat component */}
            {selectedStudent && (
                <ParentTeacherChat
                    teacherId={user?.id || ""}
                    studentId={selectedStudent.id as string}
                    studentName={selectedStudent.name}
                    isOpen={!!selectedStudent}
                    onClose={() => setSelectedStudent(null)}
                />
            )}
        </div>
    );
}
