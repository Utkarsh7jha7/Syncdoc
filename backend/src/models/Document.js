import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        blocks: [
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

export default mongoose.model("Document", documentSchema);