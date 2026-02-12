import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

export function useSocket(): Socket | null {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return;
    }
    const s = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
      auth: { token }
    });
    s.on("connect", () => {
      setSocket(s);
    });
    s.on("connect_error", () => {
      setSocket(null);
    });
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [token]);

  return socket;
}
