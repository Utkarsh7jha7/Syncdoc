import Document from "../models/Document.js";
import Block from "../models/Block.js";
import { populateAST } from "../utils/populateAST.js";



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

            message:
                error.message

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

            message:
                error.message

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


        // -----------------------------------------
        // BUILD COMPLETE AST
        // -----------------------------------------

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

            message:
                error.message

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


        // -----------------------------------------
        // DELETE BLOCKS BELONGING TO DOCUMENT
        // -----------------------------------------

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

            message:
                error.message

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


        // -----------------------------------------
        // FIND DOCUMENT
        // -----------------------------------------

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


        // -----------------------------------------
        // FIND BLOCK
        // -----------------------------------------

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


        // -----------------------------------------
        // PREVENT DUPLICATES
        // -----------------------------------------

        const alreadyExists =
            document.blocks.some(
                (id) =>
                    id.toString() ===
                    blockId.toString()
            );


        if (!alreadyExists) {

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
            "ADD BLOCK TO DOCUMENT ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                error.message

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


        if (!Array.isArray(blockIds)) {

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


        // -----------------------------------------
        // SAVE NEW ORDER
        // -----------------------------------------

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

            message:
                error.message

        });

    }

};