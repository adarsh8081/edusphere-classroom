import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
    Camera, Edit3, Save, X, Plus, Sparkles, User,
    Loader2, CheckCircle, GraduationCap, BookOpen, Target, Trophy, Flame, Star
} from "lucide-react";
import { BadgesShowcase } from "@/components/gamification/BadgesShowcase";
import { useGamification } from "@/hooks/use-gamification";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Switch } from "@/components/ui/switch";
import { Globe, Link as LinkIcon, Share2, Eye } from "lucide-react";

// Gradient avatars based on initials
const AVATAR_GRADIENTS = [
    "from-violet-500 to-purple-600",
    "from-cyan-400 to-blue-500",
    "from-emerald-400 to-teal-500",
    "from-rose-400 to-pink-500",
    "from-amber-400 to-orange-500",
    "from-indigo-400 to-blue-600",
    "from-fuchsia-400 to-violet-500",
    "from-lime-400 to-green-500",
];

function getGradientForUser(name: string) {
    const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[idx];
}

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    teacher: { label: "Teacher", icon: GraduationCap, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    student: { label: "Student", icon: BookOpen, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    parent: { label: "Parent", icon: User, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    super_admin: { label: "Admin", icon: Target, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
};

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be under 50 characters"),
    bio: z.string().max(250, "Bio must be under 250 characters").optional(),
    skills: z.array(z.string()).optional()
});

export default function ProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data: gam } = useGamification();
    const { portfolio, updatePortfolio } = usePortfolio();

    const [isEditing, setIsEditing] = useState(false);
    const [newSkill, setNewSkill] = useState("");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [selectedGradient, setSelectedGradient] = useState("");

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: "", bio: "", skills: [] }
    });

    const editSkills = watch("skills") || [];

    const { data: profile, isLoading } = useQuery({
        queryKey: ["/api/users/profile"],
        enabled: !!user,
    });

    useEffect(() => {
        if (profile) {
            reset({
                name: (profile as any).name || "",
                bio: (profile as any).bio || "",
                skills: (profile as any).skills || []
            });
            setSelectedGradient(getGradientForUser((profile as any).name || "U"));
        }
    }, [profile, reset]);

    const updateMutation = useMutation({
        mutationFn: async (data: { name: string; bio: string; skills: string[]; avatarUrl?: string }) => {
            const res = await apiRequest("PATCH", "/api/users/profile", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
            queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
            toast({ title: "✅ Profile updated!", description: "Your changes have been saved." });
            setIsEditing(false);
        },
        onError: () => {
            toast({ variant: "destructive", title: "Failed to update profile." });
        }
    });

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_FILE_SIZE) {
            toast({ variant: "destructive", title: "Image too large.", description: "Please upload a file under 5MB." });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
        if (!ALLOWED_TYPES.includes(file.type)) {
            toast({ variant: "destructive", title: "Invalid file type.", description: "Please upload a JPG, PNG, or WebP image." });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setUploadingAvatar(true);
        try {
            const form = new FormData();
            form.append("avatar", file);
            const res = await fetch("/api/upload/avatar", {
                method: "POST",
                body: form,
                credentials: "include",
            });

            if (!res.ok) {
                const error: any = new Error("Upload failed");
                error.status = res.status;
                throw error;
            }

            const data = await res.json();
            if (data.url) {
                await updateMutation.mutateAsync({
                    name: watch("name"),
                    bio: watch("bio") || "",
                    skills: watch("skills") || [],
                    avatarUrl: data.url,
                });
                toast({ title: "✅ Avatar uploaded!" });
            }
        } catch (error: any) {
            if (error?.status === 413) {
                toast({ variant: "destructive", title: "File too large.", description: "Please use an image under 5MB." });
            } else if (error?.status === 415) {
                toast({ variant: "destructive", title: "Unsupported format.", description: "Please use JPG, PNG, or WebP." });
            } else {
                toast({ variant: "destructive", title: "Avatar upload failed.", description: "Please try again." });
            }
            console.error('[ProfilePage] Avatar upload error:', error);
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const addSkill = () => {
        const trimmed = newSkill.trim();
        if (trimmed && !editSkills.includes(trimmed)) {
            setValue("skills", [...editSkills, trimmed]);
        }
        setNewSkill("");
    };

    const removeSkill = (skill: string) => {
        setValue("skills", editSkills.filter(s => s !== skill));
    };

    const onSaveProfile = (data: z.infer<typeof profileSchema>) => {
        updateMutation.mutate({
            name: data.name,
            bio: data.bio || "",
            skills: data.skills || []
        });
    };

    if (!user) return null;

    const currentProfile = (profile as any) || user;
    const roleConfig = ROLE_CONFIG[currentProfile.role] || ROLE_CONFIG.student;
    const RoleIcon = roleConfig.icon;
    const gradient = selectedGradient || getGradientForUser(currentProfile.name || "U");
    const initials = (currentProfile.name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

    return (
        <div className="min-h-screen relative z-20 pt-4">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-8"
                >
                    {/* Profile Header Card */}
                    <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden relative">
                        {/* Animated gradient banner */}
                        <div className={`h-40 w-full bg-gradient-to-br ${gradient} relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                            <motion.div
                                className="absolute top-6 right-6 w-24 h-24 rounded-full bg-white/10 blur-xl"
                                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute bottom-4 left-10 w-16 h-16 rounded-full bg-white/10 blur-2xl"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                            />
                        </div>

                        <CardContent className="px-6 pb-6">
                            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 relative z-10">
                                {/* Animated avatar */}
                                <div className="relative group">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="w-28 h-28 rounded-2xl shadow-2xl border-4 border-background overflow-hidden cursor-pointer"
                                        onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                                    >
                                        {currentProfile.avatarUrl ? (
                                            <img
                                                src={currentProfile.avatarUrl}
                                                alt={currentProfile.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                                                <span className="text-3xl font-bold text-white">{initials}</span>
                                            </div>
                                        )}
                                        {/* Hover overlay */}
                                        <motion.div
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                                            initial={false}
                                        >
                                            {uploadingAvatar ? (
                                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                                            ) : (
                                                <Camera className="w-6 h-6 text-white" />
                                            )}
                                        </motion.div>
                                    </motion.div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarUpload}
                                    />
                                    {/* Animated ring */}
                                    <motion.div
                                        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 -z-10 blur-md transition-opacity`}
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                                        <div>
                                            {isEditing ? (
                                                <div className="flex flex-col">
                                                    <Input
                                                        {...register("name")}
                                                        className={`text-2xl font-bold h-12 bg-white/5 border-white/10 rounded-xl ${errors.name ? 'border-red-500' : ''}`}
                                                    />
                                                    {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name.message?.toString()}</span>}
                                                </div>
                                            ) : (
                                                <motion.h1
                                                    className="text-3xl font-display font-bold"
                                                    layoutId="profile-name"
                                                >
                                                    {currentProfile.name}
                                                </motion.h1>
                                            )}
                                            <p className="text-muted-foreground text-sm mt-1">{currentProfile.email}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Badge className={`${roleConfig.color} border rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-bold`}>
                                                <RoleIcon className="w-3.5 h-3.5" />
                                                {roleConfig.label}
                                            </Badge>

                                            {isEditing ? (
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={handleSubmit(onSaveProfile)}
                                                        disabled={updateMutation.isPending}
                                                        className="rounded-xl h-9 px-4 gap-2 bg-primary hover:bg-primary/90"
                                                        size="sm"
                                                    >
                                                        {updateMutation.isPending ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Save className="w-4 h-4" />
                                                        )}
                                                        Save
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setIsEditing(false)}
                                                        className="rounded-xl h-9"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsEditing(true)}
                                                    className="rounded-xl h-9 px-4 gap-2 border-white/10 hover:bg-white/5"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                    Edit Profile
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Bio Card */}
                        <Card className="glass-panel border-white/10 rounded-3xl">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary" /> About Me
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <AnimatePresence mode="wait">
                                    {isEditing ? (
                                        <motion.div
                                            key="edit-bio"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <div className="flex flex-col">
                                                <Textarea
                                                    {...register("bio")}
                                                    placeholder="Tell everyone a bit about yourself — your learning style, goals, or interests..."
                                                    className={`min-h-[120px] bg-white/5 border-white/10 rounded-xl resize-none ${errors.bio ? 'border-red-500' : ''}`}
                                                />
                                                {errors.bio && <span className="text-red-500 text-xs mt-1">{errors.bio.message?.toString()}</span>}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.p
                                            key="show-bio"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-muted-foreground leading-relaxed"
                                        >
                                            {currentProfile.bio || "No bio yet. Click 'Edit Profile' to add one!"}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>

                        {/* Skills Card */}
                        <Card className="glass-panel border-white/10 rounded-3xl">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" /> Skills I'm Learning
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2 min-h-[60px]">
                                    <AnimatePresence>
                                        {(isEditing ? editSkills : (currentProfile.skills || [])).map((skill: string) => (
                                            <motion.div
                                                key={skill}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            >
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-full px-3 py-1 border-primary/30 bg-primary/5 text-primary flex items-center gap-1.5 cursor-pointer hover:bg-primary/10"
                                                >
                                                    {skill}
                                                    {isEditing && (
                                                        <X
                                                            className="w-3 h-3 opacity-60 hover:opacity-100"
                                                            onClick={() => removeSkill(skill)}
                                                        />
                                                    )}
                                                </Badge>
                                            </motion.div>
                                        ))}
                                        {(isEditing ? editSkills : (currentProfile.skills || [])).length === 0 && (
                                            <span className="text-muted-foreground text-sm">No skills added yet.</span>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {isEditing && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-2"
                                    >
                                        <Input
                                            value={newSkill}
                                            onChange={e => setNewSkill(e.target.value)}
                                            placeholder="Add a skill (e.g. Python, React)"
                                            className="h-9 flex-1 bg-white/5 border-white/10 rounded-xl text-sm"
                                            onKeyDown={e => e.key === "Enter" && addSkill()}
                                        />
                                        <Button
                                            size="sm"
                                            onClick={addSkill}
                                            className="rounded-xl h-9 w-9 p-0"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </motion.div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Avatar Gradient Picker */}
                    {isEditing && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="glass-panel border-white/10 rounded-3xl">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-primary" /> Avatar Color Theme
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-3">
                                        {AVATAR_GRADIENTS.map((grad, i) => (
                                            <motion.button
                                                key={i}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setSelectedGradient(grad)}
                                                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} relative transition-all ${selectedGradient === grad ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""}`}
                                            >
                                                {selectedGradient === grad && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute inset-0 flex items-center justify-center"
                                                    >
                                                        <CheckCircle className="w-5 h-5 text-white drop-shadow-md" />
                                                    </motion.div>
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-3">
                                        This color shows when you don't have a profile photo uploaded.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* XP / Level stat strip */}
                    {gam && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: "Total XP", value: `${gam.totalXp} XP`, icon: Star, color: "text-primary" },
                                    { label: `Level ${gam.level} — ${gam.levelName}`, value: gam.levelIcon ?? "📚", icon: null, color: "" },
                                    { label: "Day Streak", value: `${gam.streak} 🔥`, icon: Flame, color: "text-orange-400" },
                                ].map((stat, i) => (
                                    <div key={i} className="glass-panel border-white/10 rounded-2xl p-4 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                        <p className="text-2xl font-display font-bold mt-1">{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Badges showcase */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <BadgesShowcase />
                    </motion.div>

                    {/* Portfolio Settings Card */}
                    {currentProfile.role === 'student' && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <Card className="glass-panel border-primary/20 bg-primary/5 rounded-3xl overflow-hidden">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-primary" /> Public Portfolio Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-white/5">
                                        <div className="space-y-0.5">
                                            <div className="text-sm font-bold flex items-center gap-2">
                                                Public Visibility
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Allow anyone with the link to see your achievements and work.
                                            </div>
                                        </div>
                                        <Switch
                                            checked={portfolio?.isPublic ?? false}
                                            onCheckedChange={(val) => updatePortfolio({ isPublic: val })}
                                        />
                                    </div>

                                    {portfolio && (
                                        <div className="space-y-3">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">
                                                Your Unique Portfolio URL
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-background/50 border border-white/5 rounded-xl px-4 py-2 text-sm font-mono truncate">
                                                    {window.location.origin}/portfolio/{portfolio.slug}
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="rounded-xl h-10 px-4 gap-2"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`${window.location.origin}/portfolio/${portfolio.slug}`);
                                                        toast({ title: "Link copied!" });
                                                    }}
                                                >
                                                    <LinkIcon className="w-4 h-4" /> Copy
                                                </Button>
                                                {portfolio.isPublic && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="rounded-xl h-10 px-4 gap-2"
                                                        asChild
                                                    >
                                                        <a href={`/portfolio/${portfolio.slug}`} target="_blank" rel="noreferrer">
                                                            <Eye className="w-4 h-4" /> View
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Account Info Card */}
                    <Card className="glass-panel border-white/10 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Account Info</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                    { label: "Provider", value: currentProfile.provider || "local" },
                                    { label: "Language", value: currentProfile.language || "English" },
                                    { label: "Joined", value: currentProfile.createdAt ? new Date(currentProfile.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" }) : "N/A" },
                                ].map(item => (
                                    <div key={item.label} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</p>
                                        <p className="text-sm font-bold capitalize mt-1">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
        </div >
    );
}
