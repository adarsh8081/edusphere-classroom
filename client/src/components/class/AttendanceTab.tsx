import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useClassRoster } from "@/hooks/use-classes";
import { useAttendance, useMarkAttendance } from "@/hooks/use-attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, CalendarDays, CheckCircle, XCircle, Clock } from "lucide-react";

export function AttendanceTab({ classId }: { classId: string }) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  
  const { data: roster } = useClassRoster(classId);
  const { data: attendanceRecords, isLoading } = useAttendance(classId, selectedDate);
  const markAttendance = useMarkAttendance();

  const students = roster?.filter(u => u.role === 'student') || [];
  
  // Local state for editing attendance before saving
  const [localAttendance, setLocalAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  
  // Initialize local state when data loads
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setLocalAttendance({}); // Reset local edits
  };

  const getStatusForStudent = (studentId: string) => {
    if (localAttendance[studentId]) return localAttendance[studentId];
    const record = attendanceRecords?.find((r: any) => r.studentId === studentId);
    return record ? record.status : null;
  };

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setLocalAttendance(prev => ({ ...prev, [studentId]: status }));
  };

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

  const hasUnsavedChanges = Object.keys(localAttendance).length > 0;

  const StatusBadge = ({ status }: { status: string | null }) => {
    if (!status) return <span className="text-muted-foreground text-sm">-</span>;
    switch(status) {
      case 'present': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle className="w-3 h-3 mr-1"/> Present</Badge>;
      case 'absent': return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-none"><XCircle className="w-3 h-3 mr-1"/> Absent</Badge>;
      case 'late': return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1"/> Late</Badge>;
      default: return null;
    }
  };

  if (!isTeacher) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-primary">
              <CalendarDays className="w-5 h-5" />
              My Attendance Record
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* For MVP, student view fetches all attendance for the class and filters theirs */}
            <StudentAttendanceView classId={classId} studentId={user!.id} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Select Date</label>
            <Input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-48 h-9 border-muted bg-muted/20"
            />
          </div>
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={!hasUnsavedChanges || markAttendance.isPending}
          className={`hover-elevate shadow-md ${hasUnsavedChanges ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
        >
          {markAttendance.isPending ? "Saving..." : "Save Attendance"}
          <Save className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[300px]">Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-32 text-muted-foreground">
                  No students in this class.
                </TableCell>
              </TableRow>
            ) : students.map((student) => {
              const currentStatus = getStatusForStudent(student.id);
              
              return (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-secondary text-xs">{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={currentStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                      <Button 
                        size="sm" 
                        variant={currentStatus === 'present' ? 'default' : 'outline'}
                        className={`h-8 px-2 sm:px-3 text-xs ${currentStatus === 'present' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        onClick={() => handleStatusChange(student.id, 'present')}
                      >
                        Present
                      </Button>
                      <Button 
                        size="sm" 
                        variant={currentStatus === 'absent' ? 'default' : 'outline'}
                        className={`h-8 px-2 sm:px-3 text-xs ${currentStatus === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        onClick={() => handleStatusChange(student.id, 'absent')}
                      >
                        Absent
                      </Button>
                      <Button 
                        size="sm" 
                        variant={currentStatus === 'late' ? 'default' : 'outline'}
                        className={`h-8 px-2 sm:px-3 text-xs ${currentStatus === 'late' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                        onClick={() => handleStatusChange(student.id, 'late')}
                      >
                        Late
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// Student View Helper Component
function StudentAttendanceView({ classId, studentId }: { classId: string, studentId: string }) {
  // For MVP, fetch all attendance records for the class by not passing a date
  // (Assuming backend allows omitting date to get all for class)
  const { data: allAttendance, isLoading } = useAttendance(classId, undefined);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading records...</div>;

  const myRecords = allAttendance?.filter((r: any) => r.studentId === studentId).sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  if (myRecords.length === 0) {
    return <div className="p-12 text-center text-muted-foreground">No attendance records found.</div>;
  }

  const presentCount = myRecords.filter((r:any) => r.status === 'present').length;
  const totalCount = myRecords.length;
  const rate = Math.round((presentCount / totalCount) * 100);

  return (
    <div>
      <div className="bg-muted/10 p-6 flex flex-col items-center justify-center border-b border-border">
        <div className="text-4xl font-display font-bold text-primary mb-1">{rate}%</div>
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">Attendance Rate</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Date</TableHead>
            <TableHead className="text-right pr-6">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {myRecords.map((record: any) => (
            <TableRow key={record.id}>
              <TableCell className="pl-6 font-medium">
                {format(new Date(record.date), "EEEE, MMMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right pr-6">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                  ${record.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 
                    record.status === 'absent' ? 'bg-red-100 text-red-800' : 
                    'bg-amber-100 text-amber-800'}`}>
                  {record.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
