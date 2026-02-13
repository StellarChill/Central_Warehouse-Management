import { Bell, Menu, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { th } from "../../i18n/th";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  onMenuClick: () => void;
  hideMenu?: boolean;
}

export function Header({ onMenuClick, hideMenu }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // ถ้าไม่มี user ให้ลองอ่าน fallback จาก localStorage (กรณี LIFF เขียนค่าโดยตรง)
  let displayUser = user;
  if (!displayUser) {
    try {
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        displayUser = {
          ...parsed,
          role: parsed && typeof parsed.RoleId === 'number' ? (parsed.RoleId === 1 ? 'ADMIN' : parsed.RoleId === 2 ? 'CENTER' : 'BRANCH') : 'BRANCH',
        } as any;
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  if (!displayUser) return null;

  return (
    <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-premium">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {!hideMenu && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden hover:bg-accent"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}


          {/* User menu (Darker Contrast) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full md:w-auto md:px-3 md:gap-3 border border-border/40 hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {displayUser.UserName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start gap-0.5 text-left">
                  <span className="text-sm font-semibold leading-none text-foreground">{displayUser.UserName}</span>
                  <span className="text-[11px] font-medium text-muted-foreground">{th.roles[displayUser.role as any]}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">{displayUser.UserName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {displayUser.Email || `ID: ${displayUser.UserId}`}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer font-medium">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{th.nav.logout}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}