import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
	res.json({ ok: true, time: new Date().toISOString() });
});

app.use("/api", routes);

// Generic error handler
app.use(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	(err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
		console.error("Unhandled error:", err);
		res.status(500).json({ error: "Internal server error" });
	}
);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
	console.log(`API listening on http://localhost:${PORT}`);
});

