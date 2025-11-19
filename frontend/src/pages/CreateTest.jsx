import React, { useState } from "react";
import { createTest } from "../api/auth";
import { useNavigate } from "react-router-dom";

const CreateTest = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        description: "",
        difficulty: "Easy",
        public: true,
        secretCode: ""
    });

    const [questions, setQuestions] = useState([
        {
            title: "",
            description: "",
            constraints: "",
            testCases: [{ input: "", expectedOutput: "", hidden: false }]
        }
    ]);

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                title: "",
                description: "",
                constraints: "",
                testCases: [{ input: "", expectedOutput: "", hidden: false }]
            }
        ]);
    };

    const removeQuestion = (i) =>
        setQuestions(questions.filter((_, idx) => idx !== i));

    const updateQuestion = (index, key, value) => {
        const temp = [...questions];
        temp[index][key] = value;
        setQuestions(temp);
    };

    const addTestCase = (qIndex) => {
        const temp = [...questions];
        temp[qIndex].testCases.push({
            input: "",
            expectedOutput: "",
            hidden: false,
        });
        setQuestions(temp);
    };

    const updateTestCase = (qIndex, tcIndex, key, value) => {
        const temp = [...questions];
        temp[qIndex].testCases[tcIndex][key] = value;
        setQuestions(temp);
    };

    const removeTestCase = (qIndex, tcIndex) => {
        const temp = [...questions];
        temp[qIndex].testCases = temp[qIndex].testCases.filter(
            (_, idx) => idx !== tcIndex
        );
        setQuestions(temp);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...form, questions };

        try {
            await createTest(payload);
            navigate("/dashboard");
        } catch {
            alert("Failed to create test");
        }
    };

    return (
        <div className="min-h-screen bg-[#0d1117] p-8 text-gray-200">
            <div className="max-w-3xl mx-auto bg-[#161b22] border border-[#30363d] rounded-md p-6">

                <h1 className="text-xl font-bold text-[#f5a623]">Create Coding Test</h1>

                {/* BASIC FORM */}
                <input
                    className="w-full p-3 mt-4 bg-[#0d1117] border border-[#30363d] rounded"
                    placeholder="Test Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <textarea
                    className="w-full p-3 mt-3 bg-[#0d1117] border border-[#30363d] rounded"
                    rows={3}
                    placeholder="Test Description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                />

                {/* QUESTIONS */}
                <h2 className="text-lg mt-6 mb-3 font-semibold">Coding Questions</h2>

                {questions.map((q, index) => (
                    <div
                        key={index}
                        className="bg-[#0d1117] border border-[#30363d] p-4 rounded mb-4"
                    >
                        <input
                            className="w-full p-2 bg-transparent border border-[#30363d] rounded"
                            placeholder="Question Title"
                            value={q.title}
                            onChange={(e) =>
                                updateQuestion(index, "title", e.target.value)
                            }
                        />

                        <textarea
                            className="w-full p-2 mt-2 bg-transparent border border-[#30363d] rounded"
                            placeholder="Question Description"
                            rows={3}
                            value={q.description}
                            onChange={(e) =>
                                updateQuestion(index, "description", e.target.value)
                            }
                        />

                        <textarea
                            className="w-full p-2 mt-2 bg-transparent border border-[#30363d] rounded"
                            placeholder="Constraints (Optional)"
                            rows={2}
                            value={q.constraints}
                            onChange={(e) =>
                                updateQuestion(index, "constraints", e.target.value)
                            }
                        />

                        <h3 className="font-medium mt-4">Test Cases</h3>

                        {q.testCases.map((tc, tcIndex) => (
                            <div
                                key={tcIndex}
                                className="border border-[#23272a] p-3 mt-2 rounded"
                            >
                                <input
                                    className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded"
                                    placeholder="Input"
                                    value={tc.input}
                                    onChange={(e) =>
                                        updateTestCase(index, tcIndex, "input", e.target.value)
                                    }
                                />

                                <input
                                    className="w-full p-2 mt-2 bg-[#0d1117] border border-[#30363d] rounded"
                                    placeholder="Expected Output"
                                    value={tc.expectedOutput}
                                    onChange={(e) =>
                                        updateTestCase(index, tcIndex, "expectedOutput", e.target.value)
                                    }
                                />

                                <label className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        checked={tc.hidden}
                                        onChange={(e) =>
                                            updateTestCase(index, tcIndex, "hidden", e.target.checked)
                                        }
                                    />
                                    Hidden Testcase
                                </label>

                                <button
                                    type="button"
                                    onClick={() => removeTestCase(index, tcIndex)}
                                    className="mt-2 text-red-400 text-sm"
                                >
                                    Delete Testcase
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => addTestCase(index)}
                            className="mt-2 px-3 py-1 bg-[#f5a623] text-black rounded"
                        >
                            + Add Testcase
                        </button>

                        <button
                            type="button"
                            onClick={() => removeQuestion(index)}
                            className="mt-3 block text-red-400 text-sm"
                        >
                            Delete Question
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addQuestion}
                    className="px-4 py-2 bg-[#f5a623] text-black rounded mt-3"
                >
                    + Add Question
                </button>

                <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full py-3 mt-6 bg-[#f5a623] text-black font-semibold rounded"
                >
                    Create Test
                </button>
            </div>
        </div>
    );
};

export default CreateTest;
