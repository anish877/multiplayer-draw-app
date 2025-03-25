'use client';

import { useState, useEffect, useRef, ReactElement } from "react";
import ChalkHeading from "@/components/ChalkHeading";
import ChalkButton from "@/components/ChalkButton";
import ChalkInput from "@/components/ChalkInput";
import ChalkRoom from "@/components/ChalkRoom";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { useRouter } from 'next/navigation';

// Define types for rooms and other interfaces
interface Room {
  id: string;
  name: string;
  slug: string;
  users: number;
}

interface RoomResponse {
  id: string;
  slug: string;
}

const Dashboard = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dustElements, setDustElements] = useState<ReactElement[]>([]);
  const createRoomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Get token from localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  // Fetch rooms from backend
  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<{ rooms: RoomResponse[] }>(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/rooms`);
      
      if (response.data && response.data.rooms) {
        // Transform the room data to match our component expectations
        const formattedRooms = response.data.rooms.map((room: RoomResponse) => ({
          id: room.id,
          name: room.slug.replace(/-/g, ' '), // Convert slug to readable name
          slug: room.slug,
          users: 0 // Assuming we don't have user count yet
        }));
        
        setRooms(formattedRooms);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      toast.error("Failed to load rooms");
    } finally {
      setIsLoading(false);
    }
  };

  // Load rooms when component mounts
  useEffect(() => {
    fetchRooms();
  }, []);

  // Filter rooms based on search query
  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate chalk dust on mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.95) {
        const newDust = (
          <div
            key={Date.now()}
            className="chalk-dust absolute"
            style={{
              left: `${e.clientX}px`,
              top: `${e.clientY}px`,
              animationDuration: `${1 + Math.random() * 2}s`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
            }}
          />
        );
        
        setDustElements(prev => [...prev, newDust]);
        
        // Remove dust after animation completes
        setTimeout(() => {
          setDustElements(prev => prev.slice(1));
        }, 3000);
      }
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Create a new room
  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error("You must be logged in to create a room");
      // Redirect to login page
      router.push('/login');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/create-room`, 
        { name: roomName },
        {
          withCredentials: true,
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.status === 201) {
        toast.success(`Room "${roomName}" created successfully!`);
        setRoomName("");
        setIsCreating(false);
        // Refresh the room list
        fetchRooms();
      }
    } catch (error) {
      console.error("Failed to create room:", error);
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 400 && axiosError.response?.data) {
        const errorData = axiosError.response.data as { message?: string };
        toast.error(errorData.message || "Failed to create room");
      } else {
        toast.error("Failed to create room");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Join a room
  const handleJoinRoom = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      toast.success(`Joining room: ${room.name}`);
      // Navigate to the room page using the ID
      router.push(`/canvas/${room.id}`);
    }
  };

  return (
    <div className="relative min-h-screen py-10 sm:py-16">
      {/* Chalk dust container */}
      <div className="chalk-dust-container fixed top-0 left-0 w-full h-full pointer-events-none z-10">
        {dustElements}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <header className="text-center mb-12 sm:mb-16">
          <ChalkHeading as="h1" className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6">
            Join or Create a Room
          </ChalkHeading>
          <p className="font-handwriting text-lg sm:text-xl text-chalk-gray max-w-2xl mx-auto">
            Collaborate in real-time with friends & artists worldwide
          </p>
        </header>

        {/* Create Room Section */}
        <div className="mb-16 relative">
          {isCreating ? (
            <div 
              ref={createRoomRef}
              className="chalk-container bg-chalkboard-light/20 p-6 sm:p-8 rounded-lg max-w-xl mx-auto border border-white/10 animate-chalk-fade-in"
            >
              <div className="flex items-center mb-4">
                <Plus className="text-chalk-blue mr-2 h-5 w-5" />
                <h2 className="font-chalk text-2xl">Create New Room</h2>
              </div>
              <ChalkInput
                placeholder="Enter room name..."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
                className="mb-4"
                autoFocus
                disabled={isLoading}
              />
              <div className="flex gap-3">
                <ChalkButton onClick={handleCreateRoom} variant="blue" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Room"}
                </ChalkButton>
                <ChalkButton onClick={() => setIsCreating(false)} variant="outline" disabled={isLoading}>
                  Cancel
                </ChalkButton>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <ChalkButton 
                onClick={() => setIsCreating(true)} 
                className="px-6 py-3 sm:text-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create a New Room
              </ChalkButton>
            </div>
          )}
        </div>

        {/* Live Rooms Section */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <ChalkHeading as="h2" className="text-2xl sm:text-3xl mb-4 sm:mb-0">
              Live Rooms
            </ChalkHeading>
            <div className="relative w-full sm:w-auto max-w-md">
              <ChalkInput
                placeholder="Search for a room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-chalk-gray h-4 w-4" />
            </div>
          </div>

          {isLoading ? (
            <div className="chalk-container p-8 text-center">
              <p className="font-handwriting text-chalk-gray text-xl">Loading rooms...</p>
            </div>
          ) : filteredRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredRooms.map((room, index) => (
                <ChalkRoom
                  key={room.id}
                  room={room}
                  index={index}
                  onJoin={() => handleJoinRoom(room.id)}
                />
              ))}
            </div>
          ) : (
            <div className="chalk-container p-8 text-center">
              <p className="font-handwriting text-chalk-gray text-xl mb-2">No rooms found</p>
              <p className="font-handwriting text-chalk-gray">Try a different search or create a new room</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;