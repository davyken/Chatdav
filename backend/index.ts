import app from "./src/app";
import { connectDB } from "./src/config/database";
import { createServer } from "http";
import { initializeSocket } from "./src/utils/socket";

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

initializeSocket(httpServer);

connectDB()
  .then(() => {
    // @ts-ignore - Node.js types issue with listen overload
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log("Server is running on PORT:", PORT);
      console.log("Server is accessible at:");
      console.log("  - http://localhost:", PORT);
      console.log("  - http://127.0.0.1:", PORT);
      console.log("  - http://<your-local-ip>:", PORT);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
