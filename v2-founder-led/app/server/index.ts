import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 8787);
const { app, catalogue } = createApp();

void catalogue.refresh(true).then((snapshot) => {
  console.log(`Catalogue ready: ${snapshot.sourceKind} ${snapshot.snapshotId} (${snapshot.freshness})`);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Northstar API listening on http://localhost:${port}`);
});
