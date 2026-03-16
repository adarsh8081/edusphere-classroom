import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  Menu,
  Globe,
  Users,
  Target,
  Layout,
  Sparkles,
  UserCircle,
  Award
} from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ZenMode } from "./ZenMode";
import { AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { XPBar } from "@/components/gamification/XPBar";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [showZenMode, setShowZenMode] = useState(false);

  const navItems = [
    { href: "/ecosystem", label: "Ecosystem", icon: Sparkles },
    { href: "/", label: "Classes", icon: Layout },
    { href: "/guilds", label: "Guilds", icon: Users },
    { href: "/forums", label: "Forums", icon: Globe },
    { href: "/career", label: "Career", icon: Target },
    ...(user?.role === 'student' ? [{ href: "/profile#certificates", label: "Certificates", icon: Award }] : []),
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full mb-8">
        <div className="pt-4 px-4 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-2xl mx-auto max-w-7xl border-white/10">
            <div className="flex justify-between items-center h-16 px-4">
              <Link href="/ecosystem" className="flex items-center gap-3 hover:scale-[1.02] transition-transform active:scale-95 group">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_15px_rgba(23,226,255,0.4)] border border-white/20 group-hover:rotate-12 transition-transform">
                  <BookOpen size={22} className="drop-shadow-md" />
                </div>
                <span className="text-2xl font-bold text-gradient tracking-tight drop-shadow-sm font-display">EduSphere</span>
              </Link>

              {user && (
                <div className="flex items-center gap-2 sm:gap-6">
                  {/* Desktop Navigation Items */}
                  <div className="hidden lg:flex items-center gap-1">
                    {navItems.map((item) => (
                      <Link key={item.label} href={item.href}>
                        <Button
                          variant="ghost"
                          className={`gap-2 h-10 px-4 rounded-xl transition-all font-bold text-sm
                          ${location === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                        >
                          <item.icon className={`h-4 w-4 ${location === item.href ? "text-primary" : "opacity-50"}`} />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </div>

                  <div className="h-8 w-[1px] bg-white/10 hidden lg:block mx-2"></div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex items-center gap-3">
                      {/* XP Bar — always visible for logged-in users */}
                      <XPBar />
                      <div className="h-6 w-[1px] bg-white/10" />
                      <ThemeToggle />
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-10 w-10 rounded-xl transition-all ${showZenMode ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(23,226,255,0.3)]" : "hover:bg-primary/10"}`}
                        onClick={() => setShowZenMode(true)}
                        title="Zen Mode"
                      >
                        <Sparkles className="h-5 w-5 drop-shadow-sm" />
                      </Button>

                      {user.role === 'super_admin' && (
                        <Link href="/admin">
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-red-500/10" title="Admin Panel">
                            <Shield className="h-5 w-5 text-red-500 drop-shadow-sm" />
                          </Button>
                        </Link>
                      )}
                      <Link href="/messages">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10" title="Messages">
                          <MessageSquare className="h-5 w-5 text-foreground drop-shadow-sm" />
                        </Button>
                      </Link>

                      <NotificationCenter />
                    </div>

                    {/* Mobile Menu Trigger */}
                    <div className="lg:hidden flex items-center gap-2">
                      <NotificationCenter />
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10">
                            <Menu className="h-5 w-5 text-foreground" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] glass-panel border-l border-white/10 p-0">
                          <SheetHeader className="p-6 border-b border-white/10 bg-black/5">
                            <SheetTitle className="text-left font-display text-2xl font-bold text-gradient">Menu</SheetTitle>
                          </SheetHeader>
                          <div className="flex flex-col p-4 gap-1">
                            {navItems.map((item) => (
                              <Link key={item.label} href={item.href} className={`flex items-center gap-3 p-3 rounded-xl transition-colors font-bold ${location === item.href ? "bg-primary/10 text-primary" : "hover:bg-white/5 text-muted-foreground"}`}>
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                              </Link>
                            ))}

                            <div className="my-4 pt-4 border-t border-white/10">
                              <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors">
                                <UserCircle className="w-5 h-5 text-primary" />
                                <span className="font-medium text-foreground">My Profile</span>
                              </Link>
                              <Link href="/messages" className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors">
                                <MessageSquare className="w-5 h-5 text-primary" />
                                <span className="font-medium text-foreground">Messages</span>
                              </Link>
                              {user.role === 'super_admin' && (
                                <Link href="/admin" className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-colors">
                                  <Shield className="w-5 h-5 text-red-500" />
                                  <span className="font-medium text-foreground">Admin Panel</span>
                                </Link>
                              )}
                              <Link href="/settings/notifications" className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors">
                                <Settings className="w-5 h-5 text-primary" />
                                <span className="font-medium text-foreground">Settings</span>
                              </Link>
                              <button
                                onClick={() => setShowZenMode(true)}
                                className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-primary/10 transition-colors"
                              >
                                <Sparkles className="w-5 h-5 text-primary" />
                                <span className="font-medium">Zen Mode</span>
                              </button>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                              <button
                                onClick={() => logout()}
                                className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
                              >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Log out</span>
                              </button>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>

                    {/* User Profile Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full p-0 transition-transform active:scale-90">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/20 shadow-md">
                            <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-base sm:text-lg">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 mt-2 glass-panel border-white/10 rounded-2xl p-2" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal p-3 bg-white/5 rounded-xl mb-2">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-bold leading-none">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground focus:bg-transparent px-3 py-2">
                          Role: {user.role.replace('_', ' ')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <Link href="/profile">
                          <DropdownMenuItem className="cursor-pointer focus:bg-primary/10 focus:text-primary rounded-xl px-3 py-2">
                            <UserCircle className="mr-2 h-4 w-4" />
                            <span>My Profile</span>
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/settings/notifications">
                          <DropdownMenuItem className="cursor-pointer focus:bg-primary/10 focus:text-primary rounded-xl px-3 py-2">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:bg-destructive/10 cursor-pointer rounded-xl px-3 py-2">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <AnimatePresence>
        {showZenMode && <ZenMode onClose={() => setShowZenMode(false)} />}
      </AnimatePresence>
    </>
  );
}
