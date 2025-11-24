// backend/controllers/test.controller.js
import Test from "../models/Test.js";

let _pistonClient = null;
const PISTON_SERVER = "https://emkc.org";

// load piston-client dynamically (works with different exports)
async function getPistonClient() {
  if (_pistonClient) return _pistonClient;
  try {
    const mod = await import("piston-client");
    if (mod.Piston) {
      _pistonClient = new mod.Piston({ server: PISTON_SERVER });
    } else if (mod.default) {
      _pistonClient = mod.default({ server: PISTON_SERVER });
    } else {
      throw new Error("Unknown piston-client export shape");
    }
    return _pistonClient;
  } catch (err) {
    console.error("Failed to load piston-client module:", err);
    throw err;
  }
}

// runtime mapping
const LANGUAGE_MAP = {
  javascript: "javascript",
  python: "python3",
  java: "java",
  cpp: "c++",
};

// Build final code and wrapper for function-style templates
function buildFinalCode(code, runtime) {
  const lower = String(runtime || "").toLowerCase();

  const hasPythonSolve = /def\s+solve\s*\(/.test(code);
  const hasJSSolve = /function\s+solve\s*\(/.test(code) || /const\s+solve\s*=/.test(code) || /let\s+solve\s*=/.test(code);
  const hasJavaSolve = /class\s+Solution|static\s+void\s+solve\s*\(/.test(code);
  const hasCppSolve = /void\s+solve\s*\(/.test(code);

  const hasMainCpp = /\bint\s+main\s*\(/.test(code);
  const hasMainJava = /public\s+static\s+void\s+main\s*\(/.test(code);

  // PYTHON
  if (lower.includes("python")) {
    if (hasPythonSolve) {
      // Use __main__ wrapper to call solve with full stdin (trim trailing newline)
      return `${code}

if __name__ == "__main__":
    import sys
    data = sys.stdin.read()
    # remove only the final trailing newline commonly present in testcases
    if data.endswith("\\n"):
        data = data[:-1]
    solve(data)
`;
    } else {
      return code;
    }
  }

  // JAVASCRIPT / NODE
  if (lower.includes("javascript") || lower.includes("node")) {
    if (hasJSSolve) {
      return `${code}

// wrapper to read stdin and call solve
const fs = require('fs');
const __piston_input = fs.readFileSync(0, 'utf-8').replace(/\\n$/, '');
if (typeof solve === 'function') solve(__piston_input);
`;
    } else {
      return code;
    }
  }

  // JAVA
  if (lower.includes("java")) {
    if (hasJavaSolve && !hasMainJava) {
      // add MainWrapper that calls Solution.solve
      return `${code}

import java.io.*;
import java.util.*;
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
        String _in = sb.toString();
        Solution.solve(_in);
    }
}
`;
    } else {
      return code;
    }
  }

  // C++
  if (lower.includes("c++") || lower.includes("cpp")) {
    if (hasCppSolve && !hasMainCpp) {
      return `${code}

int main() {
    std::string input;
    std::string line;
    bool first = true;
    while (std::getline(std::cin, line)) {
        if (!first) input += "\\n";
        input += line;
        first = false;
    }
    solve(input);
    return 0;
}
`;
    } else {
      return code;
    }
  }

  // fallback: no wrapper
  return code;
}

// Robust execution: try two common invocation styles and pick the first useful result
async function execOnPiston(runtime, finalCode, stdin) {
  const client = await getPistonClient();

  // Try call style A: client.execute(runtime, code, { stdin })
  try {
    const resA = await client.execute(runtime, finalCode, { stdin });
    // If resA contains meaningful run data, return it
    if (resA && (resA.run || resA.stdout || resA.output)) {
      // Normalize stdout/stderr from possible shapes
      const stdout = resA.run?.stdout ?? resA.stdout ?? (resA.output ? String(resA.output) : "");
      const stderr = resA.run?.stderr ?? resA.stderr ?? "";
      return { stdout: String(stdout ?? ""), stderr: String(stderr ?? ""), raw: resA, usedStyle: "A" };
    }
  } catch (errA) {
    // swallow, will try style B
    console.warn("piston style A failed:", errA && errA.message ? errA.message : errA);
  }

  // Try call style B: client.execute({ language, files: [{content}], stdin })
  try {
    // Some piston-client versions accept a single object
    const payload = {
      language: runtime,
      files: [{ content: finalCode }],
      stdin,
    };
    // try both execute and run method names defensively
    let resB;
    if (typeof client.execute === "function") {
      resB = await client.execute(payload.language, finalCode, { stdin });
    }
    // fallback: try client.run or client.execute with object
    if (!resB && typeof client.run === "function") {
      resB = await client.run(payload);
    }
    if (!resB && typeof client.execute === "function") {
      // try object form (some libs accept an object)
      try {
        resB = await client.execute(payload);
      } catch (_) {
        // ignore
      }
    }

    if (resB) {
      const stdout = resB.run?.stdout ?? resB.stdout ?? (resB.output ? String(resB.output) : "");
      const stderr = resB.run?.stderr ?? resB.stderr ?? "";
      return { stdout: String(stdout ?? ""), stderr: String(stderr ?? ""), raw: resB, usedStyle: "B" };
    }
  } catch (errB) {
    console.warn("piston style B failed:", errB && errB.message ? errB.message : errB);
  }

  // if all fails, throw
  throw new Error("Failed to execute code on piston (both call styles failed). See server logs.");
}

// top-level run wrapper (builds code, runs on piston)
async function runCodePiston(userCode, userLanguage, stdin) {
  const runtime = LANGUAGE_MAP[userLanguage] || userLanguage || "javascript";
  const finalCode = buildFinalCode(userCode, runtime);

  // debug log (can remove later)
  console.info("Running on piston:", { runtime, stdinSample: String(stdin).slice(0, 200) });

  const execRes = await execOnPiston(runtime, finalCode, stdin ?? "");
  // execRes = { stdout, stderr, raw, usedStyle }
  // log raw for debugging
  console.debug("Piston response:", { usedStyle: execRes.usedStyle, raw: execRes.raw });

  return { stdout: execRes.stdout ?? "", stderr: execRes.stderr ?? "" };
}

/**
 * POST /api/tests/:id/submit
 * Body: { code, language, stdin }
 * returns { stdout, stderr }
 */
export const createSubmission = async (req, res) => {
  try {
    const { code, language, stdin } = req.body;
    if (!code || !language) return res.status(400).json({ message: "code and language required" });

    // run
    const result = await runCodePiston(code, language, stdin ?? "");

    // Defensive: if stdout looks like source code (very unlikely now), include debug tag
    const stdoutStr = String(result.stdout ?? "");
    const stderrStr = String(result.stderr ?? "");
    return res.json({ stdout: stdoutStr, stderr: stderrStr });
  } catch (err) {
    console.error("Submission Error:", err && (err.stack || err.message || err));
    return res.status(500).json({ message: "Something went wrong during submission", error: err?.message });
  }
};

// other endpoints unchanged...
export const createTest = async (req, res) => {
  try {
    const { name, description, secretCode, public: isPublic, questions } = req.body;
    const test = await Test.create({ name, description, secretCode, public: isPublic, questions, author: req.user._id });
    res.status(201).json({ test });
  } catch (err) {
    console.error("Create Test Error:", err);
    res.status(500).json({ message: "Failed to create test" });
  }
};

export const getMyTests = async (req, res) => {
  try {
    const tests = await Test.find({ author: req.user._id }).sort({ createdAt: -1 });
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
    const updated = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ test: updated });
  } catch (err) {
    console.error("Update Test Error:", err);
    res.status(500).json({ message: "Failed to update test" });
  }
};
