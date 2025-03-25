import { PageProps } from "@/.next/types/app/layout";
import RoomCanvas from "@/components/RoomCanvas";

const Canvas = async ({ params }: PageProps) => {
    const resolvedParams = await params; // Ensures params is awaited if needed
    return <RoomCanvas roomId={resolvedParams.canvasId} />;
  };

  export default Canvas