import mongoose from "mongoose";

const blockSchema = new mongoose.Schema(
    {
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

        content: {
            type: String,
            default: ""
        },

        level: {
            type: Number,
            default: 0
        },

        language: {
            type: String,
            default: null
        },

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

export default mongoose.model("Block", blockSchema);