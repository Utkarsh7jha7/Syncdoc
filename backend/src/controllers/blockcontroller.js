import Block from "../models/Block.js";

export const createBlock = async (req, res) => {
    try {
        const block = await Block.create(req.body);

        res.status(201).json({
            success: true,
            block
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
export const updateBlock = async (req, res) => {
    try {
        const { content } = req.body;

        const block = await Block.findByIdAndUpdate(
            req.params.id,
            {
                content
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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};