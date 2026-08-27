import mongoose from "mongoose";

const blockSchema = new mongoose.Schema(
    {
        // =========================================
        // BLOCK TYPE
        // =========================================

        type: {
            type: String,
            required: true,
            enum: [
                "paragraph",
                "heading",
                "code",
                "bullet",
                "numbered-list",
                "quote",
                "list-item"
            ]
        },

        // =========================================
        // BLOCK CONTENT
        // =========================================

        content: {
            type: String,
            default: ""
        },

        // =========================================
        // HEADING / NESTING LEVEL
        // =========================================

        level: {
            type: Number,
            default: 0
        },

        // =========================================
        // CODE LANGUAGE
        // =========================================

        language: {
            type: String,
            default: null
        },

        // =========================================
        // PARENT BLOCK
        // =========================================
        // null = root-level block

        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Block",
            default: null
        },

        // =========================================
        // CHILD BLOCKS
        // =========================================

        children: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Block"
            }
        ]
    },

    {
        timestamps: true
    }
);

export default mongoose.model(
    "Block",
    blockSchema
);

