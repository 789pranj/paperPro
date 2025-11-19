import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/auth";

const EditTest = () => {
    const { testId } = useParams();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load existing test
    useEffect(() => {
        (async () => {
            try {
                const res = await api.get(`/tests/${testId}`);
                setTest(res.data.test);
            } catch (err) {
                console.error(err);
                alert("Failed to load test");
            }
            setLoading(false);
        })();
    }, [testId]);

    // Update top-level field
    const updateField = (field, value) => {
        setTest({ ...test, [field]: value });
    };

    // Update question-level field
    const updateQuestionField = (qIndex, field, value) => {
        const updated = [...test.questions];
        updated[qIndex][field] = value;
        setTest({ ...test, questions: updated });
    };

    // Update test case inside a question
    const updateTestCase = (qIndex, tcIndex, field, value) => {
        const updatedQuestions = [...test.questions];
        updatedQuestions[qIndex].testCases[tcIndex][field] = value;
        setTest({ ...test, questions: updatedQuestions });
    };

    // Add a new question
    const addQuestion = () => {
        const newQuestion = {
            title: "",
            description: "",
            starterCode: "",
            testCases: [{ input: "", expectedOutput: "" }],
        };

        setTest({ ...test, questions: [...test.questions, newQuestion] });
    };

    // Add test case to a question
    const addTestCase = (qIndex) => {
        const updated = [...test.questions];
        updated[qIndex].testCases.push({ input: "", expectedOutput: "" });
        setTest({ ...test, questions: updated });
    };

    // Delete a question
    const deleteQuestion = (qIndex) => {
        if (!window.confirm("Delete this question?")) return;

        const updated = test.questions.filter((_, i) => i !== qIndex);
        setTest({ ...test, questions: updated });
    };

    // Save test
    const saveTest = async () => {
        try {
            setSaving(true);
            await api.put(`/tests/${testId}`, test);
            alert("Test updated!");
            navigate("/dashboard");
        } catch (err) {
            console.error(err);
            alert("Failed to save");
        }
        setSaving(false);
    };

    if (loading) return <p className="text-center mt-10">Loading...</p>;

    return (
        <div className="min-h-screen bg-[#0d1117] p-8 text-gray-200">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl text-[#f5a623] font-semibold mb-5">Edit Test</h1>

                {/* BASIC DETAILS */}
                <div className="bg-[#161b22] p-5 rounded-lg border border-[#30363d]">
                    <label>Name</label>
                    <input
                        className="w-full p-3 bg-[#0d1117] rounded border border-[#30363d]"
                        value={test.name}
                        onChange={(e) => updateField("name", e.target.value)}
                    />

                    <label className="mt-4 block">Description</label>
                    <textarea
                        className="w-full p-3 bg-[#0d1117] rounded border border-[#30363d]"
                        value={test.description}
                        onChange={(e) => updateField("description", e.target.value)}
                    />

                    <label className="mt-4 block">Difficulty</label>
                    <select
                        className="w-full p-3 bg-[#0d1117] rounded border border-[#30363d]"
                        value={test.difficulty}
                        onChange={(e) => updateField("difficulty", e.target.value)}
                    >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                    </select>

                    <label className="mt-4 block">Secret Code</label>
                    <input
                        className="w-full p-3 bg-[#0d1117] rounded border border-[#30363d]"
                        value={test.secretCode}
                        onChange={(e) => updateField("secretCode", e.target.value)}
                    />

                    <label className="mt-4 block">Public Test?</label>
                    <select
                        className="w-full p-3 bg-[#0d1117] rounded border border-[#30363d]"
                        value={test.public}
                        onChange={(e) => updateField("public", e.target.value === "true")}
                    >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                </div>

                {/* QUESTIONS */}
                <h2 className="text-xl font-semibold mt-8 mb-3">Coding Questions</h2>

                {test.questions.map((q, qIndex) => (
                    <div
                        key={qIndex}
                        className="bg-[#161b22] p-5 mb-5 rounded border border-[#30363d]"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">
                                Question {qIndex + 1}
                            </h3>
                            <button
                                onClick={() => deleteQuestion(qIndex)}
                                className="text-red-400 text-sm"
                            >
                                Delete
                            </button>
                        </div>

                        <label className="mt-3 block">Title</label>
                        <input
                            className="w-full p-3 bg-[#0d1117] rounded border border-[#30363d]"
                            value={q.title}
                            onChange={(e) =>
                                updateQuestionField(qIndex, "title", e.target.value)
                            }
                        />

                        <label className="mt-3 block">Description</label>
                        <textarea
                            className="w-full p-3 bg-[#0d1117] rounded border border-[#30363d]"
                            value={q.description}
                            onChange={(e) =>
                                updateQuestionField(qIndex, "description", e.target.value)
                            }
                        />

                        <label className="mt-3 block">Starter Code</label>
                        <textarea
                            className="w-full p-3 bg-[#0d1117] rounded border border-[#30363d]"
                            value={q.starterCode}
                            onChange={(e) =>
                                updateQuestionField(qIndex, "starterCode", e.target.value)
                            }
                        />

                        {/* TEST CASES */}
                        <h4 className="mt-4 font-semibold">Test Cases</h4>

                        {q.testCases.map((tc, tcIndex) => (
                            <div key={tcIndex} className="border p-3 mt-3 rounded border-[#30363d]">
                                <label>Input:</label>
                                <textarea
                                    className="w-full p-2 bg-[#0d1117] rounded border border-[#30363d]"
                                    value={tc.input}
                                    onChange={(e) =>
                                        updateTestCase(qIndex, tcIndex, "input", e.target.value)
                                    }
                                />

                                <label className="mt-2 block">Expected Output:</label>
                                <textarea
                                    className="w-full p-2 bg-[#0d1117] rounded border border-[#30363d]"
                                    value={tc.expectedOutput}
                                    onChange={(e) =>
                                        updateTestCase(qIndex, tcIndex, "expectedOutput", e.target.value)
                                    }
                                />
                            </div>
                        ))}

                        <button
                            onClick={() => addTestCase(qIndex)}
                            className="mt-3 px-3 py-1 bg-[#f5a623] text-black rounded"
                        >
                            + Add Test Case
                        </button>
                    </div>
                ))}

                <button
                    onClick={addQuestion}
                    className="mt-3 px-4 py-2 bg-[#f5a623] text-black rounded-md"
                >
                    + Add Question
                </button>

                {/* SAVE */}
                <button
                    onClick={saveTest}
                    disabled={saving}
                    className="mt-6 w-full py-3 bg-[#f5a623] text-black rounded-md"
                >
                    {saving ? "Saving..." : "Save Test"}
                </button>
            </div>
        </div>
    );
};

export default EditTest;
