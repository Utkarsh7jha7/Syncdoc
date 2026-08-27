import Block from "../models/Block.js";


// =========================================
// POPULATE SINGLE BLOCK
// =========================================

const populateBlock = async (
    blockId,
    visited = new Set()
) => {

    // -----------------------------------------
    // PREVENT CIRCULAR REFERENCES
    // -----------------------------------------

    const id =
        blockId.toString();


    if (visited.has(id)) {

        console.warn(
            "CIRCULAR AST REFERENCE DETECTED:",
            id
        );

        return null;

    }


    visited.add(id);


    // -----------------------------------------
    // FIND BLOCK
    // -----------------------------------------

    const block =
        await Block.findById(
            blockId
        ).lean();


    if (!block) {

        return null;

    }


    // -----------------------------------------
    // POPULATE CHILDREN
    // -----------------------------------------

    const children = [];


    for (
        const childId of block.children || []
    ) {

        const child =
            await populateBlock(
                childId,
                new Set(visited)
            );


        if (child) {

            children.push(
                child
            );

        }

    }


    // -----------------------------------------
    // RETURN AST NODE
    // -----------------------------------------

    return {

        ...block,

        children

    };

};



// =========================================
// POPULATE COMPLETE AST
// =========================================

export const populateAST = async (
    blockIds
) => {

    const blocks = [];


    for (
        const blockId of blockIds || []
    ) {

        const block =
            await populateBlock(
                blockId
            );


        if (block) {

            blocks.push(
                block
            );

        }

    }


    return blocks;

};