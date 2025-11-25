// backend/controllers/test.controller.js
import Test from "../models/Test.js";
import axios from "axios";

// ----------------- Judge0 CE API -----------------
const JUDGE0_URL = "https://ce.judge0.com"; // Public CE server
const JUDGE0_HEADERS = {
  "Content-Type": "application/json",
};

// Language mapping for Judge0
const LANGUAGE_MAP = {
  javascript: 63, // Node.js
  python: 71, // Python 3
  java: 62, // Java
  cpp: 54, // C++
};

// ----------------- Code Wrappers -----------------
function buildFinalCode(code, language) {
  const lower = String(language || "").toLowerCase();

  const hasPythonSolve = /def\s+solve\s*\(/.test(code);
  const hasJSSolve =
    /function\s+solve\s*\(/.test(code) ||
    /const\s+solve\s*=/.test(code) ||
    /let\s+solve\s*=/.test(code);
  const hasJavaSolve = /class\s+Solution|static\s+void\s+solve\s*\(/.test(code);
  const hasCppSolve = /void\s+solve\s*\(/.test(code);

  const hasMainCpp = /\bint\s+main\s*\(/.test(code);
  const hasMainJava = /public\s+static\s+void\s+main\s*\(/.test(code);

  if (lower.includes("python") && hasPythonSolve) {
    return `${code}

if __name__ == "__main__":
    import sys
    data = sys.stdin.read()
    if data.endswith("\\n"):
        data = data[:-1]
    solve(data)
`;
  }

  if (
    (lower.includes("javascript") || lower.includes("node")) &&
    hasJSSolve
  ) {
    return `// User code
${code}

// Runner wrapper
const __fs = typeof fs === "undefined" ? require('fs') : fs;
const __piston_input = __fs.readFileSync(0, 'utf-8').replace(/\\n$/, '');
if (typeof solve === 'function') solve(__piston_input);
`;
  }

  if (lower.includes("java") && hasJavaSolve && !hasMainJava) {
    return `import java.io.*;
import java.util.*;

// User code
${code}

public class MainWrapper {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();
        String line;
        boolean first = true;
        while ((line = br.readLine()) != null) {
            if (!first) sb.append("\\n");
            sb.append(line);
            first = false;
            if (!br.ready()) break;
        }
        Solution.solve(sb.toString());
    }
}
`;
  }

  if ((lower.includes("c++") || lower.includes("cpp")) && hasCppSolve && !hasMainCpp) {
    return `${code}

#include <bits/stdc++.h>
using namespace std;

int main() {
    string input, line;
    bool first = true;
    while (getline(cin, line)) {
        if (!first) input += "\\n";
        input += line;
        first = false;
    }
    solve(input);
    return 0;
}
`;
  }

  return code; // fallback
}

// ----------------- Run code on Judge0 CE -----------------
async function runCodeJudge0(userCode, userLanguage, stdin) {
  try {
    const finalCode = buildFinalCode(userCode, userLanguage);
    const languageId = LANGUAGE_MAP[userLanguage.toLowerCase()] || 63; // default JS

    const submissionRes = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: finalCode,
        language_id: languageId,
        stdin: stdin || "",
      },
      { headers: JUDGE0_HEADERS }
    );

    const result = submissionRes.data;

    return {
      stdout: result.stdout || "",
      stderr: result.stderr || result.compile_output || "",
    };
  } catch (err) {
    console.error(
      "Judge0 execution error:",
      err.response?.data || err.message || err
    );
    throw new Error("Failed to execute code on Judge0");
  }
}

// ----------------- Controllers -----------------

// POST /api/tests/:id/submit
export const createSubmission = async (req, res) => {
  try {
    const { code, language, stdin } = req.body;
    if (!code || !language)
      return res.status(400).json({ message: "code and language required" });

    const result = await runCodeJudge0(code, language, stdin ?? "");
    return res.json({ stdout: result.stdout, stderr: result.stderr });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Submission failed", error: err?.message });
  }
};

// POST /api/tests/:id/submit-all
export const submitFullTest = async (req, res) => {
  try {
    const { answers } = req.body; // [{ questionIndex, code, language }]
    if (!answers) return res.status(400).json({ message: "Answers required" });

    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const results = [];
    let totalScore = 0;

    for (const ans of answers) {
      const qIndex = ans.questionIndex;
      const question = test.questions[qIndex];
      if (!question) continue;

      let passedCount = 0;
      const details = [];

      for (const tc of question.testCases) {
        try {
          // Support multiple inputs
          const inputStr = Array.isArray(tc.inputs)
            ? tc.inputs.map((i) => prepareInput(i.value, i.type)).join(" ")
            : prepareInput(tc.input, tc.inputType);

          const runResult = await runCodeJudge0(ans.code, ans.language, inputStr);

          const got = parseOutput(runResult.stdout?.trim() ?? "", tc.outputType || "string");

          const expected = parseOutput(tc.expectedOutput, tc.outputType || "string");

          const passed =
            (!runResult.stderr || runResult.stderr.trim() === "") &&
            JSON.stringify(got) === JSON.stringify(expected);

          if (passed) passedCount += 1;

          details.push({
            inputs: tc.inputs || [{ value: tc.input, type: tc.inputType }],
            expected: tc.expectedOutput,
            outputType: tc.outputType || "string",
            got,
            passed,
            stderr: runResult.stderr,
          });
        } catch (err) {
          details.push({
            inputs: tc.inputs || [{ value: tc.input, type: tc.inputType }],
            expected: tc.expectedOutput,
            got: err.message,
            passed: false,
            stderr: err.message,
          });
        }
      }

      const score = (passedCount / question.testCases.length) * 100;
      totalScore += score;

      results.push({
        questionIndex: qIndex,
        passed: passedCount,
        total: question.testCases.length,
        score,
        details,
      });
    }

    totalScore = results.length > 0 ? totalScore / results.length : 0;

    return res.json({ results, totalScore });
  } catch (err) {
    console.error("Full Test Submission Error:", err);
    return res
      .status(500)
      .json({ message: "Failed to submit test", error: err.message });
  }
};

// ----------------- Test CRUD -----------------
export const createTest = async (req, res) => {
  try {
    const {
      name,
      description,
      secretCode,
      public: isPublic,
      questions,
    } = req.body;
    const test = await Test.create({
      name,
      description,
      secretCode,
      public: isPublic,
      questions,
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
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });
    res.json({ test });
  } catch (err) {
    console.error("Get Test Error:", err);
    res.status(500).json({ message: "Failed to fetch test" });
  }
};

export const updateTest = async (req, res) => {
  try {
    const updated = await Test.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ test: updated });
  } catch (err) {
    console.error("Update Test Error:", err);
    res.status(500).json({ message: "Failed to update test" });
  }
};

// ----------------- Helpers -----------------
function prepareInput(input, type) {
  switch (type) {
    case "number":
      return String(input);
    case "array":
    case "object":
      return JSON.stringify(input);
    case "string":
    default:
      return String(input);
  }
}

function parseOutput(output, type) {
  switch (type) {
    case "number":
      return Number(output);
    case "array":
    case "object":
      try {
        return JSON.parse(output);
      } catch {
        return output;
      }
    case "string":
    default:
      return String(output);
  }
}
