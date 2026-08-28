import Block from "../models/Block.js";


// =========================================
// CREATE BLOCK
// =========================================

export const createBlock = async (req, res) => {

    try {

        const {
            type,
            content,
            level,
            language,
            parentId
        } = req.body;


        // -----------------------------------------
        // Validate parent if provided
        // -----------------------------------------

        if (parentId) {

            const parent =
                await Block.findById(
                    parentId
                );

            if (!parent) {

                return res.status(404).json({
                    success: false,
                    message: "Parent block not found"
                });

            }

        }


        // -----------------------------------------
        // Create block
        // -----------------------------------------

        const block =
            await Block.create({

                type,

                content:
                    content || "",

                level:
                    level || 0,

                language:
                    language || null,

                parentId:
                    parentId || null,

                children: []

            });


        // -----------------------------------------
        // Add block to parent's children
        // -----------------------------------------

        if (parentId) {

            await Block.findByIdAndUpdate(
                parentId,
                {
                    $addToSet: {
                        children: block._id
                    }
                }
            );

        }


        console.log(
            "BLOCK CREATED:",
            block._id
        );


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

            message:
                "Failed to create block",

            error:
                error.message

        });

    }

};


// =========================================
// UPDATE BLOCK
// =========================================

export const updateBlock = async (req, res) => {

    try {

        const {
            blockId
        } = req.params;


        const {
            content,
            parentId,
            level,
            language,
            type
        } = req.body;


        // -----------------------------------------
        // Find existing block
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
        // Handle parent change
        // -----------------------------------------

        if (
            parentId !== undefined &&
            String(parentId || null) !==
            String(block.parentId || null)
        ) {

            // -------------------------------------
            // Validate new parent
            // -------------------------------------

            if (parentId) {

                const newParent =
                    await Block.findById(
                        parentId
                    );


                if (!newParent) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "New parent block not found"

                    });

                }


                // Prevent block becoming its own parent

                if (
                    String(parentId) ===
                    String(blockId)
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "A block cannot be its own parent"

                    });

                }

            }


            // -------------------------------------
            // Remove from old parent
            // -------------------------------------

            if (block.parentId) {

                await Block.findByIdAndUpdate(

                    block.parentId,

                    {
                        $pull: {
                            children:
                                block._id
                        }
                    }

                );

            }


            // -------------------------------------
            // Add to new parent
            // -------------------------------------

            if (parentId) {

                await Block.findByIdAndUpdate(

                    parentId,

                    {
                        $addToSet: {
                            children:
                                block._id
                        }
                    }

                );

            }


            block.parentId =
                parentId || null;

        }


        // -----------------------------------------
        // Update fields
        // -----------------------------------------

        if (
            content !== undefined
        ) {

            block.content =
                content;

        }


        if (
            level !== undefined
        ) {

            block.level =
                level;

        }


        if (
            language !== undefined
        ) {

            block.language =
                language;

        }


        if (
            type !== undefined
        ) {

            block.type =
                type;

        }


        await block.save();


        console.log(
            "BLOCK UPDATED:",
            blockId
        );


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

            message:
                "Failed to update block",

            error:
                error.message

        });

    }

};


// =========================================
// DELETE BLOCK
// =========================================

export const deleteBlock = async (req, res) => {

    try {

        const {
            blockId
        } = req.params;


        console.log(
            "DELETE BLOCK REQUEST:",
            blockId
        );


        // -----------------------------------------
        // Find block
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
        // Remove block from parent
        // -----------------------------------------

        if (
            block.parentId
        ) {

            await Block.findByIdAndUpdate(

                block.parentId,

                {
                    $pull: {
                        children:
                            block._id
                    }
                }

            );

        }


        // -----------------------------------------
        // Handle children
        // -----------------------------------------

        // Move children to root level
        // instead of leaving broken references.

        if (
            block.children &&
            block.children.length > 0
        ) {

            await Block.updateMany(

                {
                    _id: {
                        $in:
                            block.children
                    }
                },

                {
                    $set: {
                        parentId:
                            null
                    }
                }

            );

        }


        // -----------------------------------------
        // Delete block
        // -----------------------------------------

        await Block.findByIdAndDelete(
            blockId
        );


        console.log(
            "BLOCK DELETED:",
            blockId
        );


        res.status(200).json({

            success: true,

            message:
                "Block deleted successfully",

            blockId

        });


    } catch (error) {

        console.error(
            "DELETE BLOCK ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to delete block",

            error:
                error.message

        });

    }

};
// =========================================
// UPDATE BLOCK CHILDREN
// =========================================

export const updateBlockChildren = async (req, res) => {

    try {

        const { blockId } = req.params;

        const { children = [] } = req.body;

        const block =
            await Block.findByIdAndUpdate(
                blockId,
                {
                    children
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
            "UPDATE BLOCK CHILDREN ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update block children",
            error: error.message
        });

    }

};