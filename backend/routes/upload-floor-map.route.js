import express from "express";
import multer from "multer";
import { uploadFloorMap } from "../controllers/upload-floor-map.controller.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/floor-map", upload.single("image"), uploadFloorMap);


export default router;