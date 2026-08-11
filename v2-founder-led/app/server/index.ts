import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 8787);
const { app } = createApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`Northstar API listening on http://localhost:${port}`);
});
