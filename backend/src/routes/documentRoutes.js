import express from "express";

import {
    createDocument,
    getDocuments,
    getDocument,
    deleteDocument,
    addBlockToDocument,
    reorderBlocks,
    createVersion,
    getVersions,
    restoreVersion
} from "../controllers/documentController.js";


const router = express.Router();


// =========================================
// DOCUMENT ROUTES
// =========================================

// CREATE DOCUMENT
router.post(
    "/",
    createDocument
);


// GET ALL DOCUMENTS
router.get(
    "/",
    getDocuments
);


// GET SINGLE DOCUMENT
router.get(
    "/:id",
    getDocument
);


// DELETE DOCUMENT
router.delete(
    "/:id",
    deleteDocument
);


// =========================================
// DOCUMENT BLOCK ROUTES
// =========================================

// ADD BLOCK TO DOCUMENT
router.post(
    "/:documentId/blocks",
    addBlockToDocument
);


// REORDER ROOT BLOCKS
router.put(
    "/:documentId/reorder",
    reorderBlocks
);


// =========================================
// VERSION HISTORY
// =========================================

// CREATE VERSION
router.post(
    "/:documentId/versions",
    createVersion
);


// GET VERSION HISTORY
router.get(
    "/:documentId/versions",
    getVersions
);


// RESTORE VERSION
router.post(
    "/:documentId/versions/:versionId/restore",
    restoreVersion
);


export default router;