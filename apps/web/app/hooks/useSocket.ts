import { useEffect, useState } from "react";
import { WS_URL } from "../config";

const useSocket = () => {
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ4OGNkZWZiLWQxOTQtNGUzNy1hZWRjLWM4OTA3YzY5MTdkOSIsImVtYWlsIjoiYW5pc2hzdW1hbjIzMDVAZ21haWwuY29tIiwibmFtZSI6IkFuaXNoIiwiaWF0IjoxNzM5MTExMTIwLCJleHAiOjE3MzkxOTc1MjB9.Y8qaO3X_rpoaI1ueQDeB4zoh-V7j2loCkW0oBFgcKzM")

        ws.onopen = () => {
            setLoading(false);
            setSocket(ws);
        };
    }, []);

    return {
        loading,
        socket,
    };
};

export default useSocket;
