import Test from "../models/Test.js";
import Submission from "../models/Submission.js";


export const createTest = async (req, res) => {
  try {
    const { name, description, secretCode, public: isPublic, questions } = req.body;

    const test = await Test.create({
      name,
      description,
      secretCode,
      public: isPublic,
      questions,   // <-- MULTIPLE CODING QUESTIONS
      author: req.user._id,
    });

    res.status(201).json({ test });
  } catch (err) {
    console.error("Create Test Error:", err);
    res.status(500).json({ message: "Failed to create test" });
  }
};


export const getMyTests = async (req, res) => {
  try {
    const tests = await Test.find({ author: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({ tests });
  } catch (err) {
    console.error("Get Tests Error:", err);
    res.status(500).json({ message: "Failed to fetch tests" });
  }
};


export const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .select("-questions.testCases.expectedOutput");

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.json({ test });
  } catch (err) {
    console.error("Get Test Error:", err);
    res.status(500).json({ message: "Failed to fetch test" });
  }
};


export const createSubmission = async (req, res) => {
  try {
    const { code, language, questionIndex } = req.body;

    const submission = await Submission.create({
      user: req.user._id,
      test: req.params.id,
      questionIndex,  // important for multi-question tests
      code,
      language,
      status: "Pending",
    });

    res.status(201).json({ submission });
  } catch (err) {
    console.error("Create Submission Error:", err);
    res.status(500).json({ message: "Failed to create submission" });
  }
};


export const updateTest = async (req, res) => {
  try {
    const updated = await Test.findByIdAndUpdate(
      req.params.id,
      req.body, 
      { new: true }
    );

    res.json({ test: updated });
  } catch (err) {
    console.error("Update Test Error:", err);
    res.status(500).json({ message: "Failed to update test" });
  }
};
