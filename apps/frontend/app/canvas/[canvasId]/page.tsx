import RoomCanvas from '@/components/RoomCanvas';

// Define an interface for the page props that matches Next.js page component requirements
interface CanvasPageProps {
  params: {
    canvasId: string;
  };
}

// Use the defined interface for type checking
const Canvas = async ({ params }: CanvasPageProps) => {
    const roomId = params.canvasId;
    return (
        <>
            <RoomCanvas roomId={roomId} />
        </>
    );
};

export default Canvas;