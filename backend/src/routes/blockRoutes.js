import express from "express";
import {
    createBlock,
    updateBlock,
    deleteBlock,
    updateBlockChildren
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
router.put(
    "/:blockId/children",
    updateBlockChildren
);


// DELETE BLOCK
router.delete(
    "/:blockId",
    deleteBlock
);


export default router;