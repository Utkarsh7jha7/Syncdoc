import Document from "../models/Document.js";
import Block from "../models/Block.js";
import { populateAST } from "../utils/populateAST.js";

export const createDocument = async (req, res) => {
    try {
        const { title, blocks = [] } = req.body;

        const document = await Document.create({
            title,
            blocks
        });

        res.status(201).json({
            success: true,
            document
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getDocuments = async (req, res) => {
    try {
        const documents = await Document.find()
            .populate("blocks");

        res.status(200).json({
            success: true,
            documents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getDocument = async (req, res) => {
    try {
        const document = await Document
            .findById(req.params.id)
            .lean();

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        const blocks = await populateAST(document.blocks);

        document.blocks = blocks;

        res.status(200).json({
            success: true,
            document
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteDocument = async (req, res) => {
    try {
        const document = await Document.findByIdAndDelete(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Document deleted"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
export const addBlockToDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        const { blockId } = req.body;

        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        const block = await Block.findById(blockId);

        if (!block) {
            return res.status(404).json({
                success: false,
                message: "Block not found"
            });
        }

        document.blocks.push(blockId);

        await document.save();

        res.status(200).json({
            success: true,
            document
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};