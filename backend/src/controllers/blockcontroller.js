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