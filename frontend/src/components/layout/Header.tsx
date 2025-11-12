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
        

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-2 hover:bg-accent">
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {displayUser.UserName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium truncate max-w-[120px]">{displayUser.UserName}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {th.roles[displayUser.role as any]}
                    </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56 border shadow-premium">
              <DropdownMenuLabel>
                <div>
                  <div className="font-medium">{displayUser.UserName}</div>
                  <div className="text-sm text-muted-foreground">
                    {th.roles[displayUser.role as any]} • {displayUser.Email || `สาขา ${displayUser.BranchId}`}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            
              
             
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {th.nav.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}