import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";

let io: Server | null = null;

export const userRoom = (userId: string) => `user:${userId}`;

// Accepts "<token>", "Bearer <token>" or a quoted token
function cleanToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const token = raw
    .trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/^["']|["']$/g, "");
  return token.length > 0 ? token : null;
}

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin:
        process.env.CORS_ORIGIN ??
        process.env.CLIENT_URL ??
        "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  // Reject sockets without a valid access token (same check as the REST API)
  io.use((socket, next) => {
    const token =
      cleanToken(socket.handshake.auth?.token) ??
      cleanToken(socket.handshake.headers.authorization);

    if (!token) {
      console.error("Socket auth failed: no token in handshake");
      return next(new Error("UNAUTHORIZED"));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.data.userId = decoded.sub;
      socket.data.roles = decoded.roles ?? [];
      next();
    } catch (err) {
      console.error("Socket auth failed:", (err as Error).message);
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.data.userId));
    console.log(`Socket connected: ${socket.id} (user ${socket.data.userId})`);

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id}`, reason);
    });
  });

  return io;
}

// Send an event to one user, on every device they have open
export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(userRoom(userId)).emit(event, payload);
}