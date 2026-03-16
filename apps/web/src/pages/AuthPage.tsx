import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be under 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  role: z.string().min(1, 'Please select a role')
});

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { login, register: registerApi, isLoggingIn, isRegistering, user } = useAuth();
  const { toast } = useToast();

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  const {
    register: registerSignup,
    handleSubmit: handleRegisterSubmit,
    setValue: setRegisterValue,
    watch: watchRegister,
    formState: { errors: registerErrors }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "student" }
  });

  const [isGoogleLoading, setGoogleLoading] = useState(false);
  const [isGithubLoading, setGithubLoading] = useState(false);

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  if (user) return null;

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    await login(data);
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    await registerApi(data as any);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic glossy orb effects for the background behind the glass card */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-primary/20 rounded-full blur-[80px] sm:blur-[100px] animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-400/20 rounded-full blur-[80px] sm:blur-[100px] animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="mx-auto w-full max-w-md text-center relative z-10 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 shadow-[inset_0_2px_10px_rgba(255,255,255,0.2)] border border-primary/20 mb-6 backdrop-blur-sm animate-pulse-glow">
          <BookOpen className="w-10 h-10 text-primary drop-shadow-md" />
        </div>
        <h2 className="text-center text-4xl sm:text-5xl font-display font-extrabold text-foreground tracking-tight drop-shadow-sm">
          EduSphere
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground font-medium">
          The modern classroom experience.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="glossy-panel border-white/20 shadow-2xl overflow-hidden rounded-3xl">
          <CardContent className="p-6 sm:p-8">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 rounded-xl bg-white/5 p-1">
                <TabsTrigger value="login" className="rounded-lg font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form className="space-y-5" onSubmit={handleLoginSubmit(onLogin)}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="font-bold ml-1">Email address</Label>
                    <Input
                      id="login-email"
                      type="email"
                      {...registerLogin("email")}
                      className={`h-12 glossy-panel border-white/20 shadow-inner rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${loginErrors.email ? 'border-red-500' : ''}`}
                    />
                    {loginErrors.email && <p className="text-red-500 text-xs font-medium ml-1 mt-1 text-left">{loginErrors.email.message?.toString()}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="font-bold ml-1">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      {...registerLogin("password")}
                      className={`h-12 glossy-panel border-white/20 shadow-inner rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${loginErrors.password ? 'border-red-500' : ''}`}
                    />
                    {loginErrors.password && <p className="text-red-500 text-xs font-medium ml-1 mt-1 text-left">{loginErrors.password.message?.toString()}</p>}
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-semibold hover-elevate shadow-lg shadow-primary/20" disabled={isLoggingIn}>
                    {isLoggingIn ? "Signing in..." : "Sign in to EduSphere"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form className="space-y-4" onSubmit={handleRegisterSubmit(onRegister)}>
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="font-bold ml-1">Full Name</Label>
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="Enter your full name"
                      {...registerSignup("name")}
                      className={`h-12 glossy-panel border-white/20 shadow-inner rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${registerErrors.name ? 'border-red-500' : ''}`}
                    />
                    {registerErrors.name && <p className="text-red-500 text-xs font-medium ml-1 mt-1 text-left">{registerErrors.name.message?.toString()}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="font-bold ml-1">Email address</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      {...registerSignup("email")}
                      className={`h-12 glossy-panel border-white/20 shadow-inner rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${registerErrors.email ? 'border-red-500' : ''}`}
                    />
                    {registerErrors.email && <p className="text-red-500 text-xs font-medium ml-1 mt-1 text-left">{registerErrors.email.message?.toString()}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="font-bold ml-1">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Create a strong password"
                      {...registerSignup("password")}
                      className={`h-12 glossy-panel border-white/20 shadow-inner rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${registerErrors.password ? 'border-red-500' : ''}`}
                    />
                    {registerErrors.password && <p className="text-red-500 text-xs font-medium ml-1 mt-1 text-left">{registerErrors.password.message?.toString()}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-role" className="font-bold ml-1">I am a...</Label>
                    <Select value={watchRegister("role")} onValueChange={(val) => setRegisterValue("role", val)}>
                      <SelectTrigger id="reg-role" className={`h-12 glossy-panel border-white/20 shadow-inner rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${registerErrors.role ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent className="glass-panel border-white/10">
                        <SelectItem value="student">🎓 Student</SelectItem>
                        <SelectItem value="teacher">👨‍🏫 Teacher</SelectItem>
                      </SelectContent>
                    </Select>
                    {registerErrors.role && <p className="text-red-500 text-xs font-medium ml-1 mt-1 text-left">{registerErrors.role.message?.toString()}</p>}
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-semibold hover-elevate shadow-lg shadow-primary/20" disabled={isRegistering}>
                    {isRegistering ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* OAuth Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-bold tracking-wider">or continue with</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-11 rounded-xl border-white/10 hover:bg-white/5 font-semibold gap-2 transition-all hover:scale-[1.02] active:scale-95"
                disabled={isGoogleLoading}
                onClick={async () => {
                  try {
                    setGoogleLoading(true);
                    const response = await fetch('/api/auth/google');
                    if (!response.ok) throw new Error(`OAuth initiation failed: ${response.status}`);
                    // Fallback to direct redirect if JSON parsing fails on a 302
                    try { const { redirectUrl } = await response.json(); if (redirectUrl) { window.location.href = redirectUrl; return; } } catch { }
                    window.location.href = "/api/auth/google";
                  } catch (error) {
                    toast({ variant: "destructive", title: "OAuth Error", description: "Google Sign-In is currently unavailable. Please use email/password." });
                    console.error('[AuthPage] OAuth redirect error:', error);
                    setGoogleLoading(false);
                  }
                }}
              >
                {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon className="w-5 h-5" />}
                Google
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl border-white/10 hover:bg-white/5 font-semibold gap-2 transition-all hover:scale-[1.02] active:scale-95"
                disabled={isGithubLoading}
                onClick={async () => {
                  try {
                    setGithubLoading(true);
                    const response = await fetch('/api/auth/github');
                    if (!response.ok) throw new Error(`OAuth initiation failed: ${response.status}`);
                    try { const { redirectUrl } = await response.json(); if (redirectUrl) { window.location.href = redirectUrl; return; } } catch { }
                    window.location.href = "/api/auth/github";
                  } catch (error) {
                    toast({ variant: "destructive", title: "OAuth Error", description: "GitHub Sign-In is currently unavailable. Please use email/password." });
                    console.error('[AuthPage] OAuth redirect error:', error);
                    setGithubLoading(false);
                  }
                }}
              >
                {isGithubLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GitHubIcon className="w-5 h-5" />}
                GitHub
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
