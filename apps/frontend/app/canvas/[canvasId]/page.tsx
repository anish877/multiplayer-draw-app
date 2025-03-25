import RoomCanvas from '@/components/RoomCanvas';
import { NextPage } from 'next';

// Ensure Next.js properly infers the `params` type
interface PageProps {
  params: { canvasId: string };
}

const Canvas: NextPage<PageProps> = ({ params }) => {
  return <RoomCanvas roomId={params.canvasId} />;
};

export default Canvas;
