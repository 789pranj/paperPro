import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/auth";
import Editor from "@monaco-editor/react";
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
    const [code, setCode] = useState(boilerplate["javascript"]);
    const [customInput, setCustomInput] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(true);

    const [lastRunCount, setLastRunCount] = useState(0);
    const [lastPassedCount, setLastPassedCount] = useState(0);
    const [detailedResults, setDetailedResults] = useState([]);

    const toggleTheme = () => setDarkMode(!darkMode);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get(`/tests/${id}`);
                setTest(res.data.test);
                setCode(boilerplate[language]);
            } catch (err) {
                setMessage("Failed to load test");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    useEffect(() => {
        setCode(boilerplate[language] ?? "");
    }, [language]);

    const currentQuestion = () => {
        if (!test || !Array.isArray(test.questions) || test.questions.length === 0) return null;
        if (activeQuestion < 0 || activeQuestion >= test.questions.length) return test.questions[0];
        return test.questions[activeQuestion];
    };

    const runOnce = async () => {
        if (!test) return;
        setMessage("Running...");
        setDetailedResults([]);
        setLastPassedCount(0);
        setLastRunCount(0);

        try {
            const q = currentQuestion();

            const input = customInput !== "" 
                ? customInput 
                : (q.testCases && q.testCases.length ? q.testCases[0].input : "");

            const res = await api.post(`/tests/${id}/submit`, {
                code,
                language,
                stdin: input,
            });

            const { stdout, stderr } = res.data || {};

            if (stderr && String(stderr).trim() !== "") {
                setMessage(`⚠ Runtime Error:\n${String(stderr)}`);
            } else {
                setMessage(`✅ Output:\n${String(stdout ?? "").replace(/\r\n/g, "\n")}`);
            }

            setLastRunCount(1);
            setLastPassedCount(stderr ? 0 : 1);

            setDetailedResults([
                {
                    index: 0,
                    input,
                    expected: q.testCases && q.testCases[0] ? q.testCases[0].expectedOutput : "",
                    got: String(stdout ?? "").trim(),
                    passed: q.testCases && q.testCases[0]
                        ? (String(stdout ?? "").trim() === String(q.testCases[0].expectedOutput ?? "").trim())
                        : null,
                },
            ]);
        } catch (err) {
            console.error(err);
            setMessage("Error running code");
        }
    };

    const finalSubmit = async () => {
        if (!test) return;
        setMessage("Submitting (running all test cases)...");
        setDetailedResults([]);
        setLastRunCount(0);
        setLastPassedCount(0);

        try {
            const q = currentQuestion();
            const tcs = Array.isArray(q.testCases) ? q.testCases : [];

            const results = [];
            let passed = 0;

            for (let i = 0; i < tcs.length; i++) {
                const tc = tcs[i];

                const res = await api.post(`/tests/${id}/submit`, {
                    code,
                    language,
                    stdin: tc.input ?? "",
                });

                const { stdout, stderr } = res.data || {};
                const got = String(stdout ?? "").trim();
                const expected = String(tc.expectedOutput ?? "").trim();

                const passedTc = (!stderr || String(stderr).trim() === "") && (got === expected);
                if (passedTc) passed++;

                results.push({
                    index: i,
                    input: tc.input,
                    expected,
                    got,
                    passed: passedTc,
                    stderr: stderr ? String(stderr) : "",
                });
            }

            setDetailedResults(results);
            setLastRunCount(results.length);
            setLastPassedCount(passed);

            const firstFail = results.find(r => !r.passed);

            if (firstFail) {
                setMessage(
`✘ Wrong Answer (${passed}/${results.length} passed)
First failing test #${firstFail.index + 1}
Input:
${firstFail.input}
Expected:
${firstFail.expected}
Your Output:
${firstFail.got}
${firstFail.stderr ? `Runtime Error:\n${firstFail.stderr}` : ""}`
                );
            } else {
                setMessage(`✔ Accepted (${passed}/${results.length} passed)`);

                // ⭐ AUTO REDIRECT AFTER 1 SECOND ⭐
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 1000);
            }
        } catch (err) {
            console.error("Final submit error:", err);
            setMessage("Error during final submission");
        }
    };

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        setCode(boilerplate[newLang] ?? "");
    };

    if (loading) return <p className="text-center mt-20">Loading...</p>;
    if (!test) return <p className="text-center mt-20 text-red-500">Test not found</p>;

    const q = currentQuestion();

    return (
        <div className={`${darkMode ? "bg-[#0d1117] text-gray-200" : "bg-gray-100 text-gray-800"} h-screen flex`}>

            {/* ---------- LEFT PANEL ---------- */}
            <div className="w-1/2 h-full overflow-y-scroll p-6 border-r border-gray-700">

                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-[#f5a623]">{test.name}</h1>

                    {/* ⭐ Leave Button Added ⭐ */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => (window.location.href = "/dashboard")}
                            className="px-3 py-1 rounded bg-red-500 text-white text-sm"
                        >
                            Leave
                        </button>

                        <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-700 text-white">
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
                            className={`px-3 py-1 rounded-md text-sm ${
                                activeQuestion === idx ? "bg-[#f5a623] text-black" : "bg-gray-700 text-gray-300"
                            }`}
                        >
                            Q{idx + 1}
                        </button>
                    ))}
                </div>

                <h2 className="text-xl font-semibold text-[#f5a623]">{q?.title}</h2>
                <p className="mt-2 leading-6 text-sm">{q?.description}</p>

                <h3 className="text-lg mt-4 font-semibold text-[#f5a623]">Test Cases</h3>
                {q.testCases.map((tc, i) => (
                    <div key={i} className="bg-black/30 p-3 rounded mt-2 text-sm">
                        <p><b>Input:</b> {tc.input}</p>
                        <p><b>Expected:</b> {tc.expectedOutput}</p>
                    </div>
                ))}
            </div>

            {/* ---------- RIGHT PANEL ---------- */}
            <div className="w-1/2 h-full flex flex-col p-6">

                <div className="flex items-center justify-between mb-3">
                    <label className="font-semibold">Language</label>
                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="p-2 rounded bg-gray-900 border border-gray-600"
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
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

                {message && <p className="mt-2 text-yellow-400 whitespace-pre-line text-sm">{message}</p>}

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
                            <div key={r.index} className={`p-3 rounded mb-2 ${r.passed ? "bg-green-900/40" : "bg-red-900/30"}`}>
                                <div className="text-sm font-semibold">Test #{r.index + 1} — {r.passed ? "Passed" : "Failed"}</div>
                                <div className="text-xs mt-1"><b>Input:</b> {String(r.input)}</div>
                                <div className="text-xs"><b>Expected:</b> {String(r.expected)}</div>
                                <div className="text-xs"><b>Your Output:</b> {String(r.got)}</div>
                                {r.stderr && r.stderr.trim() !== "" && (
                                    <div className="text-xs text-yellow-300"><b>Runtime Error:</b> {String(r.stderr)}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
