import app from "./app";
import dotenv from "dotenv";

dotenv.config();

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
  console.log(
    `Events Service URL: ${process.env.EVENTS_SERVICE_URL || "http://localhost:8080"}`,
  );
});
