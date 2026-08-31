import mongoose from "mongoose";

const blockSnapshotSchema = new mongoose.Schema(
    {
        blockId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        type: {
            type: String,
            required: true
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

        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        children: [
            {
                type: mongoose.Schema.Types.ObjectId
            }
        ]
    },
    {
        _id: false
    }
);


const documentVersionSchema =
    new mongoose.Schema(
        {
            documentId: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "Document",

                required: true
            },

            versionNumber: {
                type: Number,
                required: true
            },

            title: {
                type: String,
                required: true
            },

            blocks: [
                blockSnapshotSchema
            ]
        },

        {
            timestamps: true
        }
    );


export default mongoose.model(
    "DocumentVersion",
    documentVersionSchema
);