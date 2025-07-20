import app from "./app";
import "./sseServer"; // imports and runs the SSE server
import dotenv from "dotenv";

dotenv.config();

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

// Combine with app.ts into one app server file?
