import { Bell, Menu, User } from "lucide-react";
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
import { th } from "@/i18n/th";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  // Mock user data - in real app this would come from auth context
  const user = {
    name: "สมชาย ใจดี",
    role: "CENTER" as const,
    branch: "คลังสินค้าศูนย์",
    avatar: "/api/placeholder/32/32"
  };

  return (
    <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-amber-200/50 shadow-premium">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left section */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden hover:bg-amber-100 text-amber-700"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative hover:bg-amber-100 text-amber-700 p-2">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-2 hover:bg-amber-100 text-amber-700">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-amber-500 text-white">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium truncate max-w-[120px] text-amber-900">{user.name}</div>
                  <div className="text-xs text-amber-700 truncate max-w-[120px]">
                    {th.roles[user.role]}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56 border-amber-200 shadow-premium">
              <DropdownMenuLabel>
                <div>
                  <div className="font-medium text-amber-900">{user.name}</div>
                  <div className="text-sm text-amber-700">
                    {th.roles[user.role]}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-amber-200" />
              
              <DropdownMenuItem className="cursor-pointer hover:bg-amber-50 text-amber-700">
                <User className="mr-2 h-4 w-4" />
                {th.nav.profile}
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer hover:bg-amber-50 text-amber-700">
                <Bell className="mr-2 h-4 w-4" />
                {th.notifications.title}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-amber-200" />
              
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10">
                {th.nav.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}