import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { BookOpen } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-violet-500 shadow-xl shadow-primary/20 mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-center text-4xl font-display font-extrabold text-foreground tracking-tight">
          EduSphere
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground font-medium">
          The modern classroom experience.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="glass-card border-none shadow-2xl overflow-hidden rounded-2xl">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/50 rounded-none border-b border-border/50">
              <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-semibold">Login</TabsTrigger>
              <TabsTrigger value="register" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-semibold">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-0">
              <CardContent className="p-8">
                <form className="space-y-6" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      required 
                      className="h-11 bg-white/50"
                      value={loginData.email}
                      onChange={e => setLoginData({...loginData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      required 
                      className="h-11 bg-white/50"
                      value={loginData.password}
                      onChange={e => setLoginData({...loginData, password: e.target.value})}
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-semibold hover-elevate shadow-lg shadow-primary/20" disabled={isLoggingIn}>
                    {isLoggingIn ? "Signing in..." : "Sign in to EduSphere"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <CardContent className="p-8">
                <form className="space-y-5" onSubmit={handleRegister}>
                  <div className="space-y-2">
                    <Label>I am a...</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        className={`border-2 rounded-xl p-3 text-center cursor-pointer transition-all ${registerData.role === 'student' ? 'border-primary bg-primary/5 text-primary font-semibold' : 'border-border hover:border-primary/50 text-muted-foreground'}`}
                        onClick={() => setRegisterData({...registerData, role: 'student'})}
                      >
                        Student
                      </div>
                      <div 
                        className={`border-2 rounded-xl p-3 text-center cursor-pointer transition-all ${registerData.role === 'teacher' ? 'border-primary bg-primary/5 text-primary font-semibold' : 'border-border hover:border-primary/50 text-muted-foreground'}`}
                        onClick={() => setRegisterData({...registerData, role: 'teacher'})}
                      >
                        Teacher
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      required 
                      className="h-11 bg-white/50"
                      value={registerData.name}
                      onChange={e => setRegisterData({...registerData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email address</Label>
                    <Input 
                      id="reg-email" 
                      type="email" 
                      required 
                      className="h-11 bg-white/50"
                      value={registerData.email}
                      onChange={e => setRegisterData({...registerData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input 
                      id="reg-password" 
                      type="password" 
                      required 
                      className="h-11 bg-white/50"
                      value={registerData.password}
                      onChange={e => setRegisterData({...registerData, password: e.target.value})}
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-semibold hover-elevate shadow-lg shadow-primary/20" disabled={isRegistering}>
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
