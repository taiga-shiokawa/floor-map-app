import express from 'express'
import dotenv from 'dotenv'
import UploadFloorMapRouter from "./routes/upload-floor-map.route.js";
import cors from "cors";

import path from "path";

dotenv.config();
const PORT = process.env.LOCAL_PORT || 5000;

const __dirname = path.resolve();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: 'http://localhost:5173', // フロントエンドのURL
  credentials: true  // withCredentials: true に対応
}));

app.use("/api/upload", UploadFloorMapRouter);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));
	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});