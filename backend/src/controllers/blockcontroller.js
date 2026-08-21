import Block from "../models/Block.js";


// =========================================
// CREATE BLOCK
// =========================================

export const createBlock = async (req, res) => {

    try {

        const block =
            await Block.create(req.body);

        res.status(201).json({
            success: true,
            block
        });

    } catch (error) {

        console.error(
            "CREATE BLOCK ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to create block",
            error: error.message
        });

    }
};


// =========================================
// UPDATE BLOCK
// =========================================

export const updateBlock = async (req, res) => {

    try {

        const { blockId } = req.params;

        const block =
            await Block.findByIdAndUpdate(
                blockId,
                {
                    content: req.body.content
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!block) {

            return res.status(404).json({
                success: false,
                message: "Block not found"
            });

        }

        res.status(200).json({
            success: true,
            block
        });

    } catch (error) {

        console.error(
            "UPDATE BLOCK ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update block",
            error: error.message
        });

    }
};


// =========================================
// DELETE BLOCK
// =========================================

export const deleteBlock = async (req, res) => {

    try {

        const { blockId } = req.params;

        console.log(
            "DELETE BLOCK REQUEST:",
            blockId
        );

        const block =
            await Block.findByIdAndDelete(
                blockId
            );

        if (!block) {

            return res.status(404).json({
                success: false,
                message: "Block not found"
            });

        }

        console.log(
            "BLOCK DELETED:",
            blockId
        );

        res.status(200).json({
            success: true,
            message: "Block deleted successfully",
            blockId
        });

    } catch (error) {

        console.error(
            "DELETE BLOCK ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to delete block",
            error: error.message
        });

    }
};