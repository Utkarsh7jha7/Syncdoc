import express from "express";
import {
    createDocument,
    getDocuments,
    getDocument,
    deleteDocument,
    addBlockToDocument
} from "../controllers/documentController.js";


const router = express.Router();

router.post("/", createDocument);

router.get("/", getDocuments);

router.get("/:id", getDocument);

router.delete("/:id", deleteDocument);
router.post("/:documentId/blocks", addBlockToDocument);

export default router;