import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OnlineUsersDropdown = ({ users }: { users: { name: string; userId: string }[] }) => {
    console.log(users)
  return (
    <Card className="absolute top-4 right-4 bg-[#272727] border-[#3d3d3d] z-10 font-sans">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="h-10 px-4 py-2 flex items-center gap-2 text-[#d4d4d4] hover:bg-[#444444]"
          >
            <Users className="h-5 w-5" />
            <span>{users.length} Online</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-56 bg-[#272727] border-[#3d3d3d] text-[#d4d4d4] font-sans"
        >
          <DropdownMenuLabel>Online Users</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#3d3d3d]" />
          {users.map((user) => (
            <DropdownMenuItem
              key={user.userId}
              className="hover:bg-[#444444] cursor-default"
            >
              {user.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
};

export default OnlineUsersDropdown;