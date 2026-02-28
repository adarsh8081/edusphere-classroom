import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { BookOpen } from "lucide-react";

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
  const { login, register, isLoggingIn, isRegistering, user } = useAuth();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "", role: "student" });

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  if (user) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginData);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(registerData);
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
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-16 p-2 bg-black/5 dark:bg-white/5 rounded-none border-b border-white/10">
              <TabsTrigger value="login" className="rounded-xl data-[state=active]:bg-white/80 dark:data-[state=active]:bg-black/80 data-[state=active]:shadow-lg text-sm font-bold transition-all hover:bg-white/40">Login</TabsTrigger>
              <TabsTrigger value="register" className="rounded-xl data-[state=active]:bg-white/80 dark:data-[state=active]:bg-black/80 data-[state=active]:shadow-lg text-sm font-bold transition-all hover:bg-white/40">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <CardContent className="p-6 sm:p-8">
                {/* OAuth Buttons */}
                <div className="space-y-3 mb-6">
                  <a href="/api/auth/google" className="block">
                    <Button type="button" variant="outline" className="w-full h-11 text-sm font-medium gap-3 hover:bg-gray-50 border-gray-200">
                      <GoogleIcon className="w-5 h-5" />
                      Continue with Google
                    </Button>
                  </a>
                  <a href="/api/auth/github" className="block">
                    <Button type="button" variant="outline" className="w-full h-11 text-sm font-medium gap-3 hover:bg-gray-50 border-gray-200">
                      <GitHubIcon className="w-5 h-5" />
                      Continue with GitHub
                    </Button>
                  </a>
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-muted-foreground font-medium">or continue with email</span>
                  </div>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold ml-1">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      className="h-12 glossy-panel border-white/20 shadow-inner rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      value={loginData.email}
                      onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-bold ml-1">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      className="h-12 glossy-panel border-white/20 shadow-inner rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      value={loginData.password}
                      onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-semibold hover-elevate shadow-lg shadow-primary/20" disabled={isLoggingIn}>
                    {isLoggingIn ? "Signing in..." : "Sign in to EduSphere"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <CardContent className="p-6 sm:p-8">
                {/* OAuth Buttons */}
                <div className="space-y-3 mb-6">
                  <a href="/api/auth/google" className="block">
                    <Button type="button" variant="outline" className="w-full h-12 text-sm font-bold gap-3 glossy-panel hover:-translate-y-1 transition-transform border-white/20">
                      <GoogleIcon className="w-6 h-6" />
                      Sign up with Google
                    </Button>
                  </a>
                  <a href="/api/auth/github" className="block">
                    <Button type="button" variant="outline" className="w-full h-12 text-sm font-bold gap-3 glossy-panel hover:-translate-y-1 transition-transform border-white/20">
                      <GitHubIcon className="w-6 h-6" />
                      Sign up with GitHub
                    </Button>
                  </a>
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-muted-foreground font-medium">or sign up with email</span>
                  </div>
                </div>

                <form className="space-y-5" onSubmit={handleRegister}>
                  <div className="space-y-2">
                    <Label className="font-bold ml-1">I am a...</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`border-2 rounded-2xl p-4 text-center cursor-pointer transition-all ${registerData.role === 'student' ? 'border-primary bg-primary/20 text-primary font-bold shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]' : 'border-white/20 bg-white/5 hover:bg-white/10 text-muted-foreground matte-surface'}`}
                        onClick={() => setRegisterData({ ...registerData, role: 'student' })}
                      >
                        Student
                      </div>
                      <div
                        className={`border-2 rounded-2xl p-4 text-center cursor-pointer transition-all ${registerData.role === 'teacher' ? 'border-primary bg-primary/20 text-primary font-bold shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]' : 'border-white/20 bg-white/5 hover:bg-white/10 text-muted-foreground matte-surface'}`}
                        onClick={() => setRegisterData({ ...registerData, role: 'teacher' })}
                      >
                        Teacher
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-bold ml-1">Full Name</Label>
                    <Input
                      id="name"
                      required
                      className="h-12 glossy-panel border-white/20 shadow-inner rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      value={registerData.name}
                      onChange={e => setRegisterData({ ...registerData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="font-bold ml-1">Email address</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      required
                      className="h-12 glossy-panel border-white/20 shadow-inner rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      value={registerData.email}
                      onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="font-bold ml-1">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      required
                      className="h-12 glossy-panel border-white/20 shadow-inner rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      value={registerData.password}
                      onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg font-bold hover-elevate shadow-lg shadow-primary/30 rounded-xl" disabled={isRegistering}>
                    {isRegistering ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
