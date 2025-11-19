import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    code: { type: String, required: true },
    language: { type: String, default: "javascript" },
    passedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Pending", "Running", "Finished", "Error"],
      default: "Pending",
    },
    resultDetails: { type: mongoose.Schema.Types.Mixed }, // store per-case results
  },
  { timestamps: true }
);

export default mongoose.models.Submission ||
  mongoose.model("Submission", submissionSchema);
