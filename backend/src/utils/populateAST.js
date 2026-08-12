import Block from "../models/Block.js";

const populateBlock = async (blockId) => {
    const block = await Block.findById(blockId).lean();

    if (!block) {
        return null;
    }

    const children = [];

    for (const childId of block.children) {
        const child = await populateBlock(childId);

        if (child) {
            children.push(child);
        }
    }

    return {
        ...block,
        children
    };
};

export const populateAST = async (blockIds) => {
    const blocks = [];

    for (const blockId of blockIds) {
        const block = await populateBlock(blockId);

        if (block) {
            blocks.push(block);
        }
    }

    return blocks;
};