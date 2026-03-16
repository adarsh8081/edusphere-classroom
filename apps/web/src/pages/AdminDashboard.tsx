import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Users, BookOpen, FileText, ClipboardList, Send, Plus,
    Shield, Trash2, Search, Activity, Heart, AlertTriangle,
    BarChart3, GraduationCap, UserCheck, UserX, School,
    LayoutDashboard, TrendingUp, Calendar, Award
} from "lucide-react";
import { motion } from "framer-motion";

const roleBadgeColors: Record<string, string> = {
    super_admin: "bg-red-100 text-red-800 border-red-200",
    teacher: "bg-blue-100 text-blue-800 border-blue-200",
    student: "bg-green-100 text-green-800 border-green-200",
    parent: "bg-purple-100 text-purple-800 border-purple-200",
};

function StatCard({ title, value, icon: Icon, gradient }: { title: string; value: number | string; icon: any; gradient: string }) {
    return (
        <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className={`absolute inset-0 ${gradient} opacity-10`} />
            <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold mt-1">{value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function OverviewTab() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["/api/admin/stats"],
        queryFn: async () => {
            const res = await fetch("/api/admin/stats", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch stats");
            return res.json();
        },
    });

    const { data: activity } = useQuery({
        queryKey: ["/api/admin/activity"],
        queryFn: async () => {
            const res = await fetch("/api/admin/activity?limit=20", { credentials: "include" });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
    });

    if (isLoading) {
        return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} gradient="bg-gradient-to-br from-blue-500 to-blue-600" />
                <StatCard title="Teachers" value={stats?.totalTeachers || 0} icon={GraduationCap} gradient="bg-gradient-to-br from-indigo-500 to-indigo-600" />
                <StatCard title="Students" value={stats?.totalStudents || 0} icon={UserCheck} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
                <StatCard title="Parents" value={stats?.totalParents || 0} icon={UserX} gradient="bg-gradient-to-br from-purple-500 to-purple-600" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Classes" value={stats?.totalClasses || 0} icon={School} gradient="bg-gradient-to-br from-amber-500 to-amber-600" />
                <StatCard title="Posts" value={stats?.totalPosts || 0} icon={FileText} gradient="bg-gradient-to-br from-cyan-500 to-cyan-600" />
                <StatCard title="Assignments" value={stats?.totalAssignments || 0} icon={ClipboardList} gradient="bg-gradient-to-br from-rose-500 to-rose-600" />
                <StatCard title="Submissions" value={stats?.totalSubmissions || 0} icon={Send} gradient="bg-gradient-to-br from-teal-500 to-teal-600" />
                <StatCard title="Enrollments" value={stats?.totalEnrollments || 0} icon={BookOpen} gradient="bg-gradient-to-br from-orange-500 to-orange-600" />
            </div>

            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {activity && activity.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {activity.map((act: any, i: number) => (
                                <div key={act.id || i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                        {act.userName?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{act.userName}</p>
                                        <p className="text-xs text-muted-foreground">{act.activityType?.replace(/_/g, " ")}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">{act.userRole}</Badge>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {act.createdAt ? new Date(act.createdAt).toLocaleDateString() : ""}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No recent activity</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function UsersTab() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [roleFilter, setRoleFilter] = useState("all");
    const [search, setSearch] = useState("");
    const { user: currentUser } = useAuth();

    // User Creation State
    const [createOpen, setCreateOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "student" });

    const { data: allUsers, isLoading } = useQuery({
        queryKey: ["/api/admin/users", roleFilter, search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (roleFilter !== "all") params.set("role", roleFilter);
            if (search) params.set("search", search);
            const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role }),
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to update role");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            toast({ title: "Role updated", description: "User role has been changed." });
        },
        onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to update role." }),
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE", credentials: "include" });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            toast({ title: "User deleted", description: "User has been removed from the platform." });
        },
        onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
    });

    const createUserMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to create user");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            toast({ title: "User created", description: "The new user account is ready for use." });
            setCreateOpen(false);
            setFormData({ name: "", email: "", password: "", role: "student" }); // reset
        },
        onError: (e: Error) => toast({ variant: "destructive", title: "Creation Error", description: e.message }),
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password || !formData.role) return;
        createUserMutation.mutate(formData);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-10 h-11"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px] h-11">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                    </SelectContent>
                </Select>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-11 shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all rounded-lg w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" /> Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New Account</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Account Type</Label>
                                <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="teacher">Teacher</SelectItem>
                                        <SelectItem value="super_admin">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Temporary Password</Label>
                                <Input id="password" type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createUserMutation.isPending}>
                                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-32"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
            ) : (
                <Card className="border-none shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-muted/50 border-b">
                                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Name</th>
                                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Email</th>
                                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Role</th>
                                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Joined</th>
                                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers?.map((u: any) => (
                                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm">
                                                    {u.name?.charAt(0)?.toUpperCase() || "?"}
                                                </div>
                                                <span className="font-medium text-sm">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                                        <td className="p-4">
                                            <Select
                                                defaultValue={u.role}
                                                onValueChange={(role) => updateRoleMutation.mutate({ userId: u.id, role })}
                                                disabled={u.id === currentUser?.id}
                                            >
                                                <SelectTrigger className="w-[140px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                                    <SelectItem value="teacher">Teacher</SelectItem>
                                                    <SelectItem value="student">Student</SelectItem>
                                                    <SelectItem value="parent">Parent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                                        </td>
                                        <td className="p-4 text-right">
                                            {u.id !== currentUser?.id && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete user "{u.name}"?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently remove this user, their enrollments, and notifications. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => deleteUserMutation.mutate(u.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {allUsers?.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No users found</p>
                    )}
                </Card>
            )}
        </div>
    );
}

function ClassesTab() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: allClasses, isLoading } = useQuery({
        queryKey: ["/api/admin/classes"],
        queryFn: async () => {
            const res = await fetch("/api/admin/classes", { credentials: "include" });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
    });

    const deleteClassMutation = useMutation({
        mutationFn: async (classId: string) => {
            const res = await fetch(`/api/admin/classes/${classId}`, { method: "DELETE", credentials: "include" });
            if (!res.ok) throw new Error("Failed");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            toast({ title: "Class deleted", description: "Class and associated data removed." });
        },
        onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to delete class." }),
    });

    if (isLoading) {
        return <div className="flex items-center justify-center h-32"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
    }

    return (
        <Card className="border-none shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-muted/50 border-b">
                            <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Class Name</th>
                            <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Subject</th>
                            <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Teacher</th>
                            <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Code</th>
                            <th className="text-center p-4 text-sm font-semibold text-muted-foreground">Students</th>
                            <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Created</th>
                            <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allClasses?.map((cls: any) => (
                            <tr key={cls.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                <td className="p-4 font-medium text-sm">{cls.name}</td>
                                <td className="p-4 text-sm text-muted-foreground">{cls.subject || "—"}</td>
                                <td className="p-4">
                                    <div>
                                        <p className="text-sm font-medium">{cls.teacherName}</p>
                                        <p className="text-xs text-muted-foreground">{cls.teacherEmail}</p>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <code className="px-2 py-1 bg-muted rounded text-xs font-mono">{cls.classCode}</code>
                                </td>
                                <td className="p-4 text-center">
                                    <Badge variant="secondary" className="font-bold">{cls.studentCount}</Badge>
                                </td>
                                <td className="p-4 text-sm text-muted-foreground">
                                    {cls.createdAt ? new Date(cls.createdAt).toLocaleDateString() : "—"}
                                </td>
                                <td className="p-4 text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete class "{cls.name}"?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently remove this class, all its posts, assignments, and enrollments. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => deleteClassMutation.mutate(cls.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {allClasses?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No classes found</p>
            )}
        </Card>
    );
}

function SystemTab() {
    const { data: stats } = useQuery({
        queryKey: ["/api/admin/stats"],
        queryFn: async () => {
            const res = await fetch("/api/admin/stats", { credentials: "include" });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        AI Service Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">Chat Model</span>
                        <code className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">gemini-2.0-flash-lite</code>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">Embedding Model</span>
                        <code className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">gemini-embedding-001</code>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">API Key</span>
                        <Badge variant="outline" className="text-xs">
                            {process.env.GOOGLE_GEMINI_API_KEY ? "Configured" : "••••••••"}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">Rate Limit</span>
                        <span className="text-xs text-muted-foreground">20 req/min per user</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">Retry Strategy</span>
                        <span className="text-xs text-muted-foreground">Exponential backoff (3 retries)</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5 text-primary" />
                        Platform Health
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">Database</span>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">ORM</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">Drizzle + PostgreSQL</code>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">Session Store</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">MemoryStore</code>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">Auth</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">Passport Local</code>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">Total Records</span>
                        <span className="text-sm font-bold text-primary">
                            {stats ? Object.values(stats).reduce((a: number, b: any) => a + Number(b), 0) : 0}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function WellbeingTab() {
    const { data: flagged, isLoading } = useQuery({
        queryKey: ["/api/admin/wellbeing/flagged"],
        queryFn: async () => {
            const res = await fetch("/api/admin/wellbeing/flagged", { credentials: "include" });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
    });

    if (isLoading) {
        return <div className="flex items-center justify-center h-32"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
    }

    return (
        <div className="space-y-4">
            {flagged && flagged.length > 0 ? (
                <Card className="border-none shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-red-50 border-b">
                                    <th className="text-left p-4 text-sm font-semibold text-red-800">Student</th>
                                    <th className="text-left p-4 text-sm font-semibold text-red-800">Class</th>
                                    <th className="text-center p-4 text-sm font-semibold text-red-800">Mood</th>
                                    <th className="text-center p-4 text-sm font-semibold text-red-800">AI Score</th>
                                    <th className="text-left p-4 text-sm font-semibold text-red-800">Notes</th>
                                    <th className="text-left p-4 text-sm font-semibold text-red-800">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flagged.map((entry: any) => (
                                    <tr key={entry.id} className="border-b last:border-0 hover:bg-red-50/50 transition-colors">
                                        <td className="p-4">
                                            <div>
                                                <p className="text-sm font-medium">{entry.studentName}</p>
                                                <p className="text-xs text-muted-foreground">{entry.studentEmail}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm">{entry.className}</td>
                                        <td className="p-4 text-center">
                                            <Badge variant="destructive" className="font-bold">{entry.moodScore}/5</Badge>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-sm font-medium">{entry.aiSentimentScore ?? "—"}</span>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">{entry.notes || "—"}</td>
                                        <td className="p-4 text-xs text-muted-foreground">
                                            {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                <Card className="border-none shadow-lg">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Heart className="h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-semibold">No Flagged Entries</h3>
                        <p className="text-muted-foreground text-sm mt-1">All students are doing well — no wellbeing concerns flagged.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function InstitutionalCockpitTab() {
    const { data: cockpit, isLoading } = useQuery({
        queryKey: ["/api/admin/institutional-stats"],
        queryFn: async () => {
            const res = await fetch("/api/admin/institutional-stats", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch cockpit stats");
            return res.json();
        },
    });

    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;

    return (
        <div className="space-y-8 pb-10">
            {/* Top Metrics Hierarchy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Users size={120} />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-indigo-100 uppercase tracking-widest text-xs font-black">Platform Reach</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black mb-2">{cockpit?.totals.users}</div>
                        <p className="text-indigo-100/70 text-sm font-medium">Total active users in the ecosystem</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <TrendingUp size={120} />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-emerald-100 uppercase tracking-widest text-xs font-black">Avg Wellbeing Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black mb-2">{cockpit?.wellbeing.averageMood}/5</div>
                        <p className="text-emerald-100/70 text-sm font-medium">Platform-wide emotional baseline</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-600 to-pink-700 text-white border-none shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Shield size={120} />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-rose-100 uppercase tracking-widest text-xs font-black">Wellbeing Flags</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black mb-2">{cockpit?.wellbeing.activeFlags}</div>
                        <p className="text-rose-100/70 text-sm font-medium">Students requiring urgent support</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Daily Activity Heatmap (Simplified) */}
                <Card className="lg:col-span-2 border-none shadow-xl bg-white/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Engagement Heatmap (Last 30 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2 justify-center py-6">
                            {cockpit?.heatmap.map((day: any, i: number) => {
                                const intensity = Math.min(Number(day.count) / 10, 1);
                                return (
                                    <motion.div
                                        key={i}
                                        whileHover={{ scale: 1.2 }}
                                        className="w-8 h-8 rounded-md cursor-help relative group"
                                        style={{
                                            backgroundColor: `rgba(16, 185, 129, ${0.1 + intensity * 0.9})`,
                                            border: intensity > 0.5 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                        }}
                                    >
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                            {new Date(day.date).toLocaleDateString()}: {day.count} activities
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Class Rankings */}
                <Card className="border-none shadow-xl bg-white/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-amber-500" />
                            Top Performing Classes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-muted/10">
                            {cockpit?.rankings.map((cls: any, i: number) => (
                                <div key={cls.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-muted-foreground w-4">{i + 1}</span>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm truncate max-w-[120px]">{cls.name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold">{cls.studentCount} Students</span>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">
                                        {cls.postCount} Posts
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { user, isLoading: authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== "super_admin") {
        return <Redirect to="/" />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                            <p className="text-muted-foreground text-sm">Manage your entire EduSphere platform</p>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="cockpit" className="w-full">
                    <TabsList className="w-full sm:w-auto h-12 p-1 bg-white shadow-sm border rounded-xl mb-8">
                        <TabsTrigger value="cockpit" className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            Cockpit
                        </TabsTrigger>
                        <TabsTrigger value="overview" className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="users" className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Users className="h-4 w-4 mr-2" />
                            Users
                        </TabsTrigger>
                        <TabsTrigger value="classes" className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <School className="h-4 w-4 mr-2" />
                            Classes
                        </TabsTrigger>
                        <TabsTrigger value="system" className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Shield className="h-4 w-4 mr-2" />
                            System
                        </TabsTrigger>
                        <TabsTrigger value="wellbeing" className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Heart className="h-4 w-4 mr-2" />
                            Wellbeing
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="cockpit"><InstitutionalCockpitTab /></TabsContent>
                    <TabsContent value="overview"><OverviewTab /></TabsContent>
                    <TabsContent value="users"><UsersTab /></TabsContent>
                    <TabsContent value="classes"><ClassesTab /></TabsContent>
                    <TabsContent value="system"><SystemTab /></TabsContent>
                    <TabsContent value="wellbeing"><WellbeingTab /></TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
