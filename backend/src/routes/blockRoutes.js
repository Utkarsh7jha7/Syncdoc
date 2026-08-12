import express from "express";

import { createBlock } from "../controllers/blockController.js";

const router = express.Router();

router.post("/", createBlock);

export default router;