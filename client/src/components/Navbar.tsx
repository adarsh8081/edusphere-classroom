import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, MessageSquare, Settings, Shield, Menu } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full mb-8">
      {/* Matte padding area to give the navbar actual physical space from the top */}
      <div className="pt-4 px-4 sm:px-6 lg:px-8">
        <div className="glossy-panel rounded-2xl mx-auto max-w-7xl">
          <div className="flex justify-between items-center h-16 px-4">
            <Link href="/" className="flex items-center gap-3 hover:scale-[1.02] transition-transform active:scale-95">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_15px_rgba(23,226,255,0.4)] border border-white/20">
                <BookOpen size={22} className="drop-shadow-md" />
              </div>
              <span className="text-2xl font-bold text-gradient tracking-tight drop-shadow-sm">EduSphere</span>
            </Link>

            {user && (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Desktop Navigation Items */}
                <div className="hidden sm:flex items-center gap-3">
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
                <div className="sm:hidden flex items-center gap-2">
                  <NotificationCenter />
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10">
                        <Menu className="h-5 w-5 text-foreground" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] glossy-panel border-l border-white/10 p-0">
                      <SheetHeader className="p-6 border-b border-white/10 bg-black/5 dark:bg-white/5">
                        <SheetTitle className="text-left font-display text-xl text-gradient">Menu</SheetTitle>
                      </SheetHeader>
                      <div className="flex flex-col p-4 gap-2">
                        <Link href="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors">
                          <BookOpen className="w-5 h-5 text-primary" />
                          <span className="font-medium text-foreground">Dashboard</span>
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
                        <div className="mt-4 pt-4 border-t border-white/10">
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
                    <Button variant="ghost" className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full p-0 btn-tactile">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/20 shadow-md">
                        <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-base sm:text-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mt-2 glossy-panel border-white/10 rounded-xl" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-3 bg-black/5 dark:bg-white/5 rounded-t-lg">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground focus:bg-transparent">
                      Role: {user.role.replace('_', ' ')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <Link href="/settings/notifications">
                      <DropdownMenuItem className="cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg mx-1 my-1">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg mx-1 mb-1">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
