import Document from "../models/Document.js";
import Block from "../models/Block.js";
import DocumentVersion from "../models/DocumentVersion.js";

import {
    populateAST
} from "../utils/populateAST.js";


// =========================================
// CREATE DOCUMENT
// =========================================

export const createDocument = async (
    req,
    res
) => {

    try {

        const {
            title,
            blocks = []
        } = req.body;


        const document =
            await Document.create({
                title,
                blocks
            });


        res.status(201).json({
            success: true,
            document
        });


    } catch (error) {

        console.error(
            "CREATE DOCUMENT ERROR:",
            error
        );


        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// =========================================
// GET ALL DOCUMENTS
// =========================================

export const getDocuments = async (
    req,
    res
) => {

    try {

        const documents =
            await Document.find()
                .populate("blocks");


        res.status(200).json({
            success: true,
            documents
        });


    } catch (error) {

        console.error(
            "GET DOCUMENTS ERROR:",
            error
        );


        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// =========================================
// GET SINGLE DOCUMENT
// =========================================

export const getDocument = async (
    req,
    res
) => {

    try {

        const document =
            await Document
                .findById(
                    req.params.id
                )
                .lean();


        if (!document) {

            return res.status(404).json({
                success: false,
                message:
                    "Document not found"
            });

        }


        const blocks =
            await populateAST(
                document.blocks
            );


        document.blocks =
            blocks;


        res.status(200).json({
            success: true,
            document
        });


    } catch (error) {

        console.error(
            "GET DOCUMENT ERROR:",
            error
        );


        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// =========================================
// DELETE DOCUMENT
// =========================================

export const deleteDocument = async (
    req,
    res
) => {

    try {

        const document =
            await Document.findByIdAndDelete(
                req.params.id
            );


        if (!document) {

            return res.status(404).json({
                success: false,
                message:
                    "Document not found"
            });

        }


        await DocumentVersion.deleteMany({
            documentId:
                document._id
        });


        if (
            document.blocks &&
            document.blocks.length > 0
        ) {

            await Block.deleteMany({
                _id: {
                    $in:
                        document.blocks
                }
            });

        }


        res.status(200).json({
            success: true,
            message:
                "Document deleted"
        });


    } catch (error) {

        console.error(
            "DELETE DOCUMENT ERROR:",
            error
        );


        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// =========================================
// ADD BLOCK TO DOCUMENT
// =========================================

export const addBlockToDocument = async (
    req,
    res
) => {

    try {

        const {
            documentId
        } = req.params;


        const {
            blockId
        } = req.body;


        const document =
            await Document.findById(
                documentId
            );


        if (!document) {

            return res.status(404).json({
                success: false,
                message:
                    "Document not found"
            });

        }


        const block =
            await Block.findById(
                blockId
            );


        if (!block) {

            return res.status(404).json({
                success: false,
                message:
                    "Block not found"
            });

        }


        const exists =
            document.blocks.some(
                (id) =>
                    String(id) ===
                    String(blockId)
            );


        if (!exists) {

            document.blocks.push(
                blockId
            );

            await document.save();

        }


        res.status(200).json({
            success: true,
            document
        });


    } catch (error) {

        console.error(
            "ADD BLOCK ERROR:",
            error
        );


        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// =========================================
// REORDER BLOCKS
// =========================================

export const reorderBlocks = async (
    req,
    res
) => {

    try {

        const {
            documentId
        } = req.params;


        const {
            blockIds
        } = req.body;


        if (
            !Array.isArray(blockIds)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "blockIds must be an array"
            });

        }


        const document =
            await Document.findById(
                documentId
            );


        if (!document) {

            return res.status(404).json({
                success: false,
                message:
                    "Document not found"
            });

        }


        document.blocks =
            blockIds;


        await document.save();


        res.status(200).json({
            success: true,
            document
        });


    } catch (error) {

        console.error(
            "REORDER BLOCKS ERROR:",
            error
        );


        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// =========================================
// CREATE VERSION
// =========================================

export const createVersion = async (
    req,
    res
) => {

    try {

        const {
            documentId
        } = req.params;


        const document =
            await Document
                .findById(
                    documentId
                )
                .lean();


        if (!document) {

            return res.status(404).json({
                success: false,
                message:
                    "Document not found"
            });

        }


        // =====================================
        // FIND VERSION NUMBER
        // =====================================

        const lastVersion =
            await DocumentVersion
                .findOne({
                    documentId
                })
                .sort({
                    versionNumber:
                        -1
                });


        const versionNumber =
            lastVersion
                ? lastVersion.versionNumber + 1
                : 1;


        // =====================================
        // LOAD ALL BLOCKS
        // =====================================

        const blockIds =
            await collectAllBlockIds(
                document.blocks
            );


        const blocks =
            await Block.find({
                _id: {
                    $in:
                        blockIds
                }
            })
                .lean();


        // =====================================
        // SNAPSHOT
        // =====================================

        const blockSnapshots =
            blocks.map(
                (block) => ({

                    blockId:
                        block._id,

                    type:
                        block.type,

                    content:
                        block.content || "",

                    level:
                        block.level || 0,

                    language:
                        block.language || null,

                    parentId:
                        block.parentId || null,

                    children:
                        block.children || []

                })
            );


        const version =
            await DocumentVersion.create({

                documentId:

                    document._id,

                versionNumber,

                title:

                    document.title,

                blocks:

                    blockSnapshots

            });


        res.status(201).json({
            success: true,
            version
        });


    } catch (error) {

        console.error(
            "CREATE VERSION ERROR:",
            error
        );


        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// =========================================
// COLLECT ALL BLOCK IDS RECURSIVELY
// =========================================

const collectAllBlockIds =
    async (
        rootIds
    ) => {

        const ids =
            new Set();


        const visit =
            async (
                blockId
            ) => {

                const id =
                    blockId.toString();


                if (
                    ids.has(id)
                ) {

                    return;

                }


                ids.add(id);


                const block =
                    await Block
                        .findById(
                            blockId
                        )
                        .select(
                            "children"
                        )
                        .lean();


                if (!block) {
                    return;
                }


                for (
                    const childId
                    of block.children || []
                ) {

                    await visit(
                        childId
                    );

                }

            };


        for (
            const blockId
            of rootIds || []
        ) {

            await visit(
                blockId
            );

        }


        return [
            ...ids
        ];

    };


// =========================================
// GET VERSION HISTORY
// =========================================

export const getVersions = async (
    req,
    res
) => {

    try {

        const {
            documentId
        } = req.params;


        const versions =
            await DocumentVersion
                .find({
                    documentId
                })
                .sort({
                    versionNumber:
                        -1
                })
                .select(
                    "_id versionNumber title createdAt"
                );


        res.status(200).json({
            success: true,
            versions
        });


    } catch (error) {

        console.error(
            "GET VERSIONS ERROR:",
            error
        );


        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// =========================================
// RESTORE VERSION
// =========================================

export const restoreVersion = async (
    req,
    res
) => {

    try {

        const {
            documentId,
            versionId
        } = req.params;


        const document =
            await Document.findById(
                documentId
            );


        if (!document) {

            return res.status(404).json({
                success: false,
                message:
                    "Document not found"
            });

        }


        const version =
            await DocumentVersion.findOne({

                _id:
                    versionId,

                documentId

            });


        if (!version) {

            return res.status(404).json({
                success: false,
                message:
                    "Version not found"
            });

        }


        // =====================================
        // CREATE CURRENT BACKUP
        // =====================================

        const currentBlockIds =
            await collectAllBlockIds(
                document.blocks
            );


        const currentBlocks =
            await Block.find({
                _id: {
                    $in:
                        currentBlockIds
                }
            })
                .lean();


        const lastVersion =
            await DocumentVersion
                .findOne({
                    documentId
                })
                .sort({
                    versionNumber:
                        -1
                });


        const backupNumber =
            lastVersion
                ? lastVersion.versionNumber + 1
                : 1;


        await DocumentVersion.create({

            documentId:

                document._id,

            versionNumber:

                backupNumber,

            title:

                document.title,

            blocks:

                currentBlocks.map(
                    (block) => ({

                        blockId:
                            block._id,

                        type:
                            block.type,

                        content:
                            block.content || "",

                        level:
                            block.level || 0,

                        language:
                            block.language || null,

                        parentId:
                            block.parentId || null,

                        children:
                            block.children || []

                    })
                )

        });


        // =====================================
        // RESTORE BLOCKS
        // =====================================

        const restoredIds = [];


        for (
            const snapshot
            of version.blocks
        ) {

            await Block.findByIdAndUpdate(

                snapshot.blockId,

                {

                    type:
                        snapshot.type,

                    content:
                        snapshot.content,

                    level:
                        snapshot.level,

                    language:
                        snapshot.language,

                    parentId:
                        snapshot.parentId,

                    children:
                        snapshot.children

                },

                {
                    upsert:
                        true,

                    new:
                        true

                }

            );


            restoredIds.push(
                snapshot.blockId
            );

        }


        // =====================================
        // RESTORE DOCUMENT
        // =====================================

        document.title =
            version.title;


        // Root blocks = blocks where
        // parentId is null

        document.blocks =
            version.blocks
                .filter(
                    (block) =>
                        !block.parentId
                )
                .map(
                    (block) =>
                        block.blockId
                );


        await document.save();


        res.status(200).json({

            success: true,

            message:
                "Version restored successfully",

            document

        });


    } catch (error) {

        console.error(
            "RESTORE VERSION ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};