import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/auth";
import Editor from "@monaco-editor/react";

const StartTest = () => {
    const { id } = useParams();

    const boilerplate = {
        javascript: "// Write your JavaScript code here",
        python: "# Write your Python code here",
        java: `// Write your Java code here
public class Solution {
    public static void main(String[] args) {
        
    }
}`,
        cpp: `// Write your C++ code here
#include <bits/stdc++.h>
using namespace std;

int main() {
    return 0;
}`
    };

    const [test, setTest] = useState(null);
    const [activeQuestion, setActiveQuestion] = useState(0);
    const [language, setLanguage] = useState("javascript");
    const [code, setCode] = useState(boilerplate[language]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        setCode(boilerplate[language]);
    }, [language]);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get(`/tests/${id}`);
                setTest(res.data.test);
            } catch (err) {
                console.error(err);
                setMessage("Failed to load test");
            }
            setLoading(false);
        })();
    }, [id]);

    const submitSolution = async () => {
        setMessage("");
        try {
            await api.post(`/tests/${id}/submissions`, {
                code,
                language,
                questionIndex: activeQuestion,
            });
            setMessage("Solution submitted successfully! (status: pending)");
            setCode(boilerplate[language]);
        } catch (err) {
            console.error(err);
            setMessage("Submission failed");
        }
    };

    if (loading) return <p className="text-center text-gray-400 mt-20">Loading...</p>;
    if (!test) return <p className="text-center text-red-400 mt-20">Test not found</p>;

    const q = test.questions[activeQuestion];

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-200 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-semibold text-[#f5a623]">{test.name}</h1>

                <div className="flex gap-2 mt-4">
                    {test.questions.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveQuestion(idx)}
                            className={`px-4 py-2 rounded-md ${
                                activeQuestion === idx ? "bg-[#f5a623] text-black" : "bg-[#30363d]"
                            }`}
                        >
                            Q{idx + 1}
                        </button>
                    ))}
                </div>

                <div className="bg-[#161b22] p-6 border border-[#30363d] rounded-lg mt-6">
                    <h2 className="text-xl font-semibold text-[#f5a623]">{q.title}</h2>
                    <p className="mt-2 text-gray-300">{q.description}</p>

                    <h3 className="text-lg text-[#f5a623] mt-4">Test Cases:</h3>
                    {q.testCases.map((tc, i) => (
                        <div key={i} className="bg-black/30 p-3 rounded mt-2">
                            <p><b>Input:</b> {tc.input}</p>
                            <p><b>Expected Output:</b> {tc.expectedOutput}</p>
                        </div>
                    ))}

                    <div className="mt-4 mb-4">
                        <label className="block mb-2">Language</label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="p-2 bg-[#0d1117] border border-[#30363d] rounded-md"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                        </select>
                    </div>

                    <Editor
                        height="400px"
                        language={language}
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value)}
                        options={{
                            automaticLayout: true,
                            tabSize: 2,
                            fontSize: 14,
                            minimap: { enabled: false },
                        }}
                    />

                    {message && <p className="mt-2 text-center text-[#f5a623]">{message}</p>}

                    <button
                        onClick={submitSolution}
                        className="mt-4 w-full bg-[#f5a623] text-black py-3 rounded-md font-semibold"
                    >
                        Submit Solution
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StartTest;
