import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useClassRoster, useClass } from "@/hooks/use-classes";
import { useAttendance, useMarkAttendance, useActiveSession, useStartAttendance } from "@/hooks/use-attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, CalendarDays, CheckCircle, XCircle, Clock, QrCode, Sparkles, History, ListChecks } from "lucide-react";
import { AttendanceQRGenerator } from "./AttendanceQRGenerator";
import { AttendanceScanner } from "./AttendanceScanner";
import { motion, AnimatePresence } from "framer-motion";

export function AttendanceTab({ classId }: { classId: string }) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<'smart' | 'manual' | 'history'>(isTeacher ? 'smart' : 'history');

  const { data: roster } = useClassRoster(classId);
  const { data: attendanceRecords, isLoading } = useAttendance(classId, selectedDate);
  const { data: activeSession } = useActiveSession(classId);

  const markAttendance = useMarkAttendance();
  const startAttendance = useStartAttendance();

  const students = roster?.filter(u => u.role === 'student') || [];
  const [localAttendance, setLocalAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});

  const handleSave = async () => {
    const recordsToSave = students.map(s => {
      const status = localAttendance[s.id] || attendanceRecords?.find((r: any) => r.studentId === s.id)?.status || 'present';
      return { studentId: s.id, status: status as 'present' | 'absent' | 'late' };
    });

    await markAttendance.mutateAsync({
      classId,
      date: selectedDate,
      records: recordsToSave
    });
    setLocalAttendance({});
  };

  const StatusBadge = ({ status }: { status: string | null }) => {
    if (!status) return <span className="text-muted-foreground text-sm">-</span>;
    switch (status) {
      case 'present': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle className="w-3 h-3 mr-1" /> Present</Badge>;
      case 'absent': return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-none"><XCircle className="w-3 h-3 mr-1" /> Absent</Badge>;
      case 'late': return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" /> Late</Badge>;
      default: return null;
    }
  };

  // ── Student View ──────────────────────────────────────────────────────────
  if (!isTeacher) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Active Session Prompt */}
        <AnimatePresence>
          {activeSession && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AttendanceScanner />
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="glass-panel border-white/10 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="w-5 h-5 text-primary" />
              Attendance History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <StudentAttendanceView classId={classId} studentId={user!.id} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Teacher View ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* View Switcher */}
      <div className="flex p-1.5 glass-panel border-white/10 rounded-2xl w-full sm:w-fit gap-2">
        <Button
          variant={viewMode === 'smart' ? 'default' : 'ghost'}
          onClick={() => setViewMode('smart')}
          className="rounded-xl gap-2 font-bold"
        >
          <QrCode className="w-4 h-4" /> Smart
        </Button>
        <Button
          variant={viewMode === 'manual' ? 'default' : 'ghost'}
          onClick={() => setViewMode('manual')}
          className="rounded-xl gap-2 font-bold"
        >
          <ListChecks className="w-4 h-4" /> Manual
        </Button>
        <Button
          variant={viewMode === 'history' ? 'default' : 'ghost'}
          onClick={() => setViewMode('history')}
          className="rounded-xl gap-2 font-bold"
        >
          <History className="w-4 h-4" /> Log
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'smart' && (
          <motion.div key="smart" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            {!activeSession ? (
              <Card className="glass-panel border-white/10 rounded-[3rem] overflow-hidden p-12 text-center border-dashed border-2">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <QrCode className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2">Smart QR Check-in</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8 font-medium">
                  Launch a 10-minute QR window for students to scan. Students earn 15 XP for checking in!
                </p>
                <Button
                  size="lg"
                  onClick={() => startAttendance.mutate(classId)}
                  disabled={startAttendance.isPending}
                  className="rounded-2xl px-10 h-14 font-bold text-lg hover-elevate shadow-2xl"
                >
                  {startAttendance.isPending ? "Starting..." : "Start Attendance Session"}
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </Card>
            ) : (
              <div className="max-w-md mx-auto">
                <AttendanceQRGenerator session={activeSession} />
                <Button
                  variant="ghost"
                  className="w-full mt-4 text-muted-foreground"
                  onClick={() => setViewMode('manual')}
                >
                  View Full Roster
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {viewMode === 'manual' && (
          <motion.div key="manual" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel border-white/10 p-4 rounded-3xl">
              <div className="flex items-center gap-4">
                <CalendarDays className="w-5 h-5 text-primary" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-44 border-none bg-white/5 font-bold"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={Object.keys(localAttendance).length === 0 || markAttendance.isPending}
                className="rounded-2xl px-8 h-12 font-bold"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>

            <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
              <Table>
                <TableHeader className="bg-white/3">
                  <TableRow>
                    <TableHead className="w-[300px]">Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const currentStatus = localAttendance[student.id] || attendanceRecords?.find((r: any) => r.studentId === student.id)?.status || null;
                    return (
                      <TableRow key={student.id} className="hover:bg-white/3 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-white/10">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">{student.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-bold">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell><StatusBadge status={currentStatus} /></TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex glass-panel p-1 rounded-xl">
                            <Button size="sm" variant={currentStatus === 'present' ? 'default' : 'ghost'} onClick={() => setLocalAttendance(p => ({ ...p, [student.id]: 'present' }))} className="h-8 rounded-lg px-3 font-bold text-[10px] uppercase tracking-tighter">Present</Button>
                            <Button size="sm" variant={currentStatus === 'absent' ? 'default' : 'ghost'} onClick={() => setLocalAttendance(p => ({ ...p, [student.id]: 'absent' }))} className="h-8 rounded-lg px-3 font-bold text-[10px] uppercase tracking-tighter">Absent</Button>
                            <Button size="sm" variant={currentStatus === 'late' ? 'default' : 'ghost'} onClick={() => setLocalAttendance(p => ({ ...p, [student.id]: 'late' }))} className="h-8 rounded-lg px-3 font-bold text-[10px] uppercase tracking-tighter">Late</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        )}

        {viewMode === 'history' && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel border-white/10 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-white/3 border-b border-white/5 flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg">Class Attendance Log</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-white/10 gap-2 h-9 px-4 font-bold shrink-0"
                onClick={() => window.open(`/api/attendance/export/${classId}`)}
              >
                <Save className="w-4 h-4" /> Export CSV
              </Button>
            </CardHeader>
            <div className="p-8 text-center text-muted-foreground italic">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-10" />
              Detailed history list coming soon in Sprint 5.
              <p className="text-xs mt-2 not-italic font-bold text-primary cursor-pointer hover:underline" onClick={() => setViewMode('manual')}>Use Manual View to check past dates.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Student View Helper Component
function StudentAttendanceView({ classId, studentId }: { classId: string, studentId: string }) {
  const { data: allAttendance, isLoading } = useAttendance(classId, undefined);
  if (isLoading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading records...</div>;

  const myRecords = allAttendance?.filter((r: any) => r.studentId === studentId).sort((a: any, b: any) => new Date(b.date || b.scannedAt).getTime() - new Date(a.date || a.scannedAt).getTime()) || [];

  if (myRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-muted-foreground opacity-30" />
        </div>
        <p className="text-muted-foreground font-medium">No attendance records found yet.</p>
      </div>
    );
  }

  const presentCount = myRecords.filter((r: any) => r.status === 'present' || !!r.scannedAt).length;
  const totalCount = myRecords.length;
  const rate = Math.round((presentCount / totalCount) * 100);

  return (
    <div>
      <div className="bg-primary/5 p-8 flex flex-col items-center justify-center border-b border-white/5">
        <div className="text-5xl font-display font-black text-primary mb-2">{rate}%</div>
        <p className="text-xs font-bold uppercase tracking-[.3em] text-muted-foreground">Attendance Rating</p>
      </div>
      <div className="divide-y divide-white/5">
        {myRecords.map((record: any) => (
          <div key={record.id} className="flex items-center justify-between p-6 hover:bg-white/2 transition-colors">
            <div>
              <p className="font-bold text-sm">{format(new Date(record.date || record.scannedAt), "EEEE, MMM d, yyyy")}</p>
              {record.scannedAt && <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">✓ Smart Check-in</p>}
            </div>
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                ${record.status === 'present' || !!record.scannedAt ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                record.status === 'absent' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              {record.scannedAt ? 'PRESENT' : record.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
