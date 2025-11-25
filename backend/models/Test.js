import mongoose from "mongoose";

// Each input in a test case
const inputSchema = new mongoose.Schema({
  type: { type: String, enum: ["number", "string", "array", "object"], default: "string" },
  value: { type: String, required: true },
});

const testCaseSchema = new mongoose.Schema({
  inputs: [inputSchema], // <-- multiple inputs
  expectedOutput: { type: String, required: true },
  hidden: { type: Boolean, default: false },
});

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  constraints: { type: String },
  testCases: [testCaseSchema],
});

const testSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    secretCode: { type: String },
    public: { type: Boolean, default: false },
    questions: [questionSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Test || mongoose.model("Test", testSchema);
