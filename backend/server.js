import express from 'express'
import dotenv from 'dotenv'
import UploadFloorMapRouter from "./routes/upload-floor-map.route.js";
import cors from "cors";

dotenv.config();
const PORT = process.env.LOCAL_PORT || 5000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: 'http://localhost:5173', // フロントエンドのURL
  credentials: true  // withCredentials: true に対応
}));

app.use("/api/upload", UploadFloorMapRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});