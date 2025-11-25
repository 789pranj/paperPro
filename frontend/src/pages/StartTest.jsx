// frontend/pages/StartTest.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "../api/auth";
import { Sun, Moon } from "lucide-react";

export default function StartTest() {
    const { id } = useParams();

    const boilerplate = {
        javascript: `function solve(input) {\n  // Your code here\n}`,
        python: `def solve(input):\n  # Your code here\n  pass`,
        java: `public class Solution {\n  public static void solve(String input) {\n    // Your code here\n  }\n}`,
        cpp: `#include <bits/stdc++.h>\nusing namespace std;\nvoid solve(string input) {\n  // Your code here\n}`,
    };

    const [test, setTest] = useState(null);
    const [activeQuestion, setActiveQuestion] = useState(0);
    const [language, setLanguage] = useState("javascript");
    const [code, setCode] = useState(boilerplate.javascript);
    const [customInput, setCustomInput] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(true);

    const [lastRunCount, setLastRunCount] = useState(0);
    const [lastPassedCount, setLastPassedCount] = useState(0);
    const [detailedResults, setDetailedResults] = useState([]);

    const toggleTheme = () => setDarkMode(!darkMode);

    // Load test data
    useEffect(() => {
        (async () => {
            try {
                const res = await api.get(`/tests/${id}`);
                setTest(res.data.test);

                const starterCode =
                    res.data.test.questions[0]?.starterCode?.[language] ??
                    boilerplate[language];
                setCode(starterCode);
            } catch (err) {
                setMessage("Failed to load test");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // Update code when language changes
    useEffect(() => {
        if (!test) return;
        const starterCode =
            test.questions[activeQuestion]?.starterCode?.[language] ??
            boilerplate[language];
        setCode(starterCode);
    }, [language, activeQuestion, test]);

    const currentQuestion = () => {
        if (!test?.questions?.length) return null;
        if (activeQuestion < 0 || activeQuestion >= test.questions.length)
            return test.questions[0];
        return test.questions[activeQuestion];
    };

    // ---------------------- Generate Wrapped Code ----------------------
    const generateWrappedCode = (userCode, language, inputType) => {
        const t = inputType?.toLowerCase() ?? "string";

        // Helper for multiple input parsing
        const getParser = (lang) => {
            if (lang === "javascript") {
                if (t === "number") return "const parsed = parseInt(stdin);";
                if (t === "number[]") return "const parsed = stdin.split(' ').map(Number);";
                if (t === "string[]") return "const parsed = stdin.split(' ');";
                if (t === "json") return "const parsed = JSON.parse(stdin);";
                return "const parsed = stdin;";
            }

            if (lang === "python") {
                if (t === "number") return "parsed = int(stdin)";
                if (t === "number[]") return "parsed = list(map(int, stdin.split()))";
                if (t === "string[]") return "parsed = stdin.split()";
                if (t === "json") return "import json\nparsed = json.loads(stdin)";
                return "parsed = stdin";
            }

            return ""; // For Java and C++, parsing is handled in wrapper
        };

        if (language === "javascript") {
            const parseLine = getParser("javascript");
            return `// User code
${userCode}

// Runner wrapper
const fs = require('fs');
(function main() {
  try {
    const stdin = fs.readFileSync(0, 'utf-8').trim();
    ${parseLine}
    const out = (typeof solve === 'function') ? solve(...(Array.isArray(parsed) ? parsed : [parsed])) : undefined;
    if (out !== undefined) {
      if (typeof out === 'object') console.log(JSON.stringify(out));
      else console.log(out);
    }
  } catch (e) {
    console.error(e && e.stack ? e.stack : String(e));
  }
})();`;
        }

        if (language === "python") {
            const parseLine = getParser("python");
            return `# User code
${userCode}

import sys
try:
    stdin = sys.stdin.read().strip()
    ${parseLine}
    if isinstance(parsed, (list, tuple)):
        out = solve(*parsed)
    else:
        out = solve(parsed)
    if out is not None:
        print(out)
except Exception as e:
    import traceback
    traceback.print_exc()`;
        }

        if (language === "java") {
            return `// User code (Solution class should be defined by the user)
${userCode}

import java.io.*;
public class Main {
    public static void main(String[] args) {
        try {
            BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
            StringBuilder sb = new StringBuilder();
            String line;
            boolean first = true;
            while ((line = br.readLine()) != null) {
                if (!first) sb.append("\\n");
                sb.append(line);
                first = false;
            }
            String stdin = sb.toString();
            // User should split stdin inside solve method
            Solution.solve(stdin);
        } catch(Exception e) {
            e.printStackTrace();
        }
    }
}`;
        }

        if (language === "cpp") {
            return `// User code (must define void solve(std::vector<std::string> input))
${userCode}

#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string input;
    string line;
    bool first = true;
    while(getline(cin, line)) {
        if(!first) input += "\\n";
        input += line;
        first = false;
    }
    try {
        // User must parse input inside solve
        solve({input});
    } catch(const exception &e) {
        cout << e.what() << endl;
    }
    return 0;
}`;
        }

        return userCode;
    };

    // ---------------------- Run & Submit ----------------------
    const runOnce = async () => {
        if (!test) return;
        setMessage("Running...");
        setDetailedResults([]);
        setLastPassedCount(0);
        setLastRunCount(0);

        try {
            const q = currentQuestion();
            if (!q) return;

            const input =
                customInput !== ""
                    ? customInput
                    : q.testCases?.[0]?.input ?? "";

            const wrappedCode = generateWrappedCode(code, language, q.inputType);

            const res = await api.post(`/tests/${id}/submit`, {
                code: wrappedCode,
                language,
                stdin: input,
            });

            const { stdout, stderr } = res.data || {};
            if (stderr?.trim()) setMessage(`⚠ Runtime Error:\n${stderr}`);
            else setMessage(`✅ Output:\n${stdout ?? ""}`);

            setLastRunCount(1);
            setLastPassedCount(stderr ? 0 : 1);

            setDetailedResults([
                {
                    index: 0,
                    input,
                    expected: q.testCases?.[0]?.expectedOutput ?? "",
                    got: String(stdout ?? "").trim(),
                    passed:
                        !stderr && String(stdout ?? "").trim() ===
                        String(q.testCases?.[0]?.expectedOutput ?? "").trim(),
                },
            ]);
        } catch (err) {
            console.error(err);
            setMessage("Error running code");
        }
    };

    const finalSubmit = async () => {
        if (!test) return;
        setMessage("Submitting...");
        setDetailedResults([]);
        setLastRunCount(0);
        setLastPassedCount(0);

        try {
            const q = currentQuestion();
            if (!q) return;

            const tcs = Array.isArray(q.testCases) ? q.testCases : [];
            const results = [];
            let passed = 0;
            const wrappedCode = generateWrappedCode(code, language, q.inputType);

            for (let i = 0; i < tcs.length; i++) {
                const tc = tcs[i];
                const res = await api.post(`/tests/${id}/submit`, {
                    code: wrappedCode,
                    language,
                    stdin: tc.input ?? "",
                });

                const stdout = String(res.data.stdout ?? "").trim();
                const stderr = String(res.data.stderr ?? "").trim();
                const expected = String(tc.expectedOutput ?? "").trim();
                const passedTc = !stderr && stdout === expected;
                if (passedTc) passed++;
                results.push({
                    index: i,
                    input: tc.input,
                    expected,
                    got: stdout,
                    passed: passedTc,
                    stderr,
                });
            }

            setDetailedResults(results);
            setLastRunCount(results.length);
            setLastPassedCount(passed);

            const firstFail = results.find(r => !r.passed);
            if (firstFail) {
                setMessage(
                    `✘ Wrong Answer (${passed}/${results.length} passed)\nFirst failing test #${firstFail.index + 1
                    }\nInput:\n${firstFail.input}\nExpected:\n${firstFail.expected
                    }\nYour Output:\n${firstFail.got}\n${firstFail.stderr ? `Runtime Error:\n${firstFail.stderr}` : ""
                    }`
                );
            } else {
                setMessage(`✔ Accepted (${passed}/${results.length} passed)`);
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 1000);
            }
        } catch (err) {
            console.error(err);
            setMessage("Error during final submission");
        }
    };

    if (loading) return <p className="text-center mt-20">Loading...</p>;
    if (!test)
        return (
            <p className="text-center mt-20 text-red-500">Test not found</p>
        );

    const q = currentQuestion();

    return (
        <div
            className={`${darkMode ? "bg-[#0d1117] text-gray-200" : "bg-gray-100 text-gray-800"
                } h-screen flex`}
        >
            {/* Left Panel */}
            <div className="w-1/2 h-full overflow-y-scroll p-6 border-r border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-[#f5a623]">{test.name}</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => (window.location.href = "/dashboard")}
                            className="px-3 py-1 rounded bg-red-500 text-white text-sm"
                        >
                            Leave
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-gray-700 text-white"
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </div>

                <div className="mb-4 text-green-400 font-semibold text-lg">
                    Last run: {lastPassedCount}/{lastRunCount} passed
                </div>

                <div className="flex gap-2 mb-4 flex-wrap">
                    {test.questions.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setActiveQuestion(idx);
                                setMessage("");
                                setDetailedResults([]);
                                setLastRunCount(0);
                                setLastPassedCount(0);
                            }}
                            className={`px-3 py-1 rounded-md text-sm ${activeQuestion === idx
                                    ? "bg-[#f5a623] text-black"
                                    : "bg-gray-700 text-gray-300"
                                }`}
                        >
                            Q{idx + 1}
                        </button>
                    ))}
                </div>

                <h2 className="text-xl font-semibold text-[#f5a623]">{q?.title}</h2>
                <p className="mt-2 leading-6 text-sm">{q?.description}</p>

                <h3 className="text-lg mt-4 font-semibold text-[#f5a623]">
                    Test Cases
                </h3>
                {q.testCases.map((tc, i) => (
                    <div key={i} className="bg-black/30 p-3 rounded mt-2 text-sm">
                        <p>
                            <b>Input:</b> {tc.input}
                        </p>
                        <p>
                            <b>Expected:</b> {tc.expectedOutput}
                        </p>
                    </div>
                ))}
            </div>

            {/* Right Panel */}
            <div className="w-1/2 h-full flex flex-col p-6">
                <div className="flex items-center justify-between mb-3">
                    <label className="font-semibold">Language</label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="p-2 rounded bg-gray-900 border border-gray-600"
                    >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                    </select>
                </div>

                <textarea
                    className="w-full p-2 border border-gray-600 rounded bg-gray-900 text-white mb-2"
                    rows={3}
                    placeholder="Custom Input (optional)"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                />

                <div className="flex-1 border border-gray-600 rounded overflow-hidden mb-2">
                    <Editor
                        height="100%"
                        language={language === "cpp" ? "cpp" : language}
                        theme={darkMode ? "vs-dark" : "light"}
                        value={code}
                        onChange={(value) => setCode(value ?? "")}
                        options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
                    />
                </div>

                {message && (
                    <p className="mt-2 text-yellow-400 whitespace-pre-line text-sm">
                        {message}
                    </p>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={runOnce}
                        className="mt-3 w-1/2 bg-blue-500 hover:bg-blue-600 text-black py-2 rounded font-semibold"
                    >
                        Run Code
                    </button>
                    <button
                        onClick={finalSubmit}
                        className="mt-3 w-1/2 bg-green-500 hover:bg-green-600 text-black py-2 rounded font-semibold"
                    >
                        Submit (Final)
                    </button>
                </div>

                {detailedResults.length > 0 && (
                    <div className="mt-4 overflow-auto max-h-48">
                        {detailedResults.map((r) => (
                            <div
                                key={r.index}
                                className={`p-3 rounded mb-2 ${r.passed ? "bg-green-900/40" : "bg-red-900/30"
                                    }`}
                            >
                                <div className="text-sm font-semibold">
                                    Test #{r.index + 1} — {r.passed ? "Passed" : "Failed"}
                                </div>
                                <div className="text-xs mt-1">
                                    <b>Input:</b> {String(r.input)}
                                </div>
                                <div className="text-xs">
                                    <b>Expected:</b> {String(r.expected)}
                                </div>
                                <div className="text-xs">
                                    <b>Your Output:</b> {String(r.got)}
                                </div>
                                {r.stderr && r.stderr.trim() !== "" && (
                                    <div className="text-xs text-yellow-300">
                                        <b>Runtime Error:</b> {String(r.stderr)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
