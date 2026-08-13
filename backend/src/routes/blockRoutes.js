import express from "express";

import {
    createBlock,
    updateBlock
} from "../controllers/blockController.js";
const router = express.Router();

router.post("/", createBlock);
router.put("/:id", updateBlock);

export default router;