import "dotenv/config";
import { createServer } from "node:http";
import app from "./app";
import { initSocket } from "./socket";

const PORT = Number(process.env.PORT ?? 3003);

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});