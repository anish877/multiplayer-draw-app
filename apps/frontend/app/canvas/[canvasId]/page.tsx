import RoomCanvas from '@/components/RoomCanvas';

const Canvas = async ({params}:{params:{canvasId:string}}) => {
    const roomId = (await params).canvasId
    return (
        <>
            <RoomCanvas roomId={roomId}/>
        </>
    )
}

export default Canvas
