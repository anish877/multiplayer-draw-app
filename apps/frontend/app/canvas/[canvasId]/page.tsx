import RoomCanvas from '@/components/RoomCanvas';
import { Params } from 'next/dist/server/request/params';

// More flexible type definition for page props
export type CanvasPageProps = {
  params: Params;
  searchParams?: { [key: string]: string | string[] | undefined };
};

// Use a more generic approach to handle params
const Canvas = ({ params }: CanvasPageProps) => {
    // Safely extract canvasId, providing a fallback
    const roomId = params.canvasId ? String(params.canvasId) : '';
    
    return (
        <>
            <RoomCanvas roomId={roomId} />
        </>
    );
};

export default Canvas;

// Optional: Add metadata export if needed
export const generateMetadata = ({ params }: CanvasPageProps) => {
    return {
        title: `Canvas: ${params.canvasId || 'New Canvas'}`
    };
};