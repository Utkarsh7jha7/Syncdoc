import express from "express";

import {
    createBlock,
    updateBlock,
    deleteBlock
} from "../controllers/blockController.js";

const router = express.Router();


// CREATE BLOCK
router.post(
    "/",
    createBlock
);


// UPDATE BLOCK
router.put(
    "/:blockId",
    updateBlock
);


// DELETE BLOCK
router.delete(
    "/:blockId",
    deleteBlock
);


export default router;