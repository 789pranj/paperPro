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
            testCases: [
                {
                    inputs: [{ value: "", type: "string" }],
                    expectedOutput: "",
                    outputType: "string",
                    hidden: false
                }
            ]
        }
    ]);

    // ----- Question Functions -----
    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                title: "",
                description: "",
                constraints: "",
                testCases: [{ inputs: [{ value: "", type: "string" }], expectedOutput: "", outputType: "string", hidden: false }]
            }
        ]);
    };

    const removeQuestion = (i) => setQuestions(questions.filter((_, idx) => idx !== i));

    const updateQuestion = (index, key, value) => {
        const temp = [...questions];
        temp[index][key] = value;
        setQuestions(temp);
    };

    // ----- Test Case Functions -----
    const addTestCase = (qIndex) => {
        const temp = [...questions];
        temp[qIndex].testCases.push({
            inputs: [{ value: "", type: "string" }],
            expectedOutput: "",
            outputType: "string",
            hidden: false
        });
        setQuestions(temp);
    };

    const removeTestCase = (qIndex, tcIndex) => {
        const temp = [...questions];
        temp[qIndex].testCases = temp[qIndex].testCases.filter((_, idx) => idx !== tcIndex);
        setQuestions(temp);
    };

    const updateTestCase = (qIndex, tcIndex, key, value) => {
        const temp = [...questions];
        temp[qIndex].testCases[tcIndex][key] = value;
        setQuestions(temp);
    };

    // ----- Inputs per Test Case -----
    const addInput = (qIndex, tcIndex) => {
        const temp = [...questions];
        temp[qIndex].testCases[tcIndex].inputs.push({ value: "", type: "string" });
        setQuestions(temp);
    };

    const updateInput = (qIndex, tcIndex, inputIndex, key, value) => {
        const temp = [...questions];
        temp[qIndex].testCases[tcIndex].inputs[inputIndex][key] = value;
        setQuestions(temp);
    };

    const removeInput = (qIndex, tcIndex, inputIndex) => {
        const temp = [...questions];
        temp[qIndex].testCases[tcIndex].inputs = temp[qIndex].testCases[tcIndex].inputs.filter((_, idx) => idx !== inputIndex);
        setQuestions(temp);
    };

    // ----- Submit -----
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

                {/* Basic Test Info */}
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

                {/* Questions */}
                <h2 className="text-lg mt-6 mb-3 font-semibold">Coding Questions</h2>

                {questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-[#0d1117] border border-[#30363d] p-4 rounded mb-4">
                        <input
                            className="w-full p-2 bg-transparent border border-[#30363d] rounded"
                            placeholder="Question Title"
                            value={q.title}
                            onChange={(e) => updateQuestion(qIndex, "title", e.target.value)}
                        />
                        <textarea
                            className="w-full p-2 mt-2 bg-transparent border border-[#30363d] rounded"
                            placeholder="Question Description"
                            rows={3}
                            value={q.description}
                            onChange={(e) => updateQuestion(qIndex, "description", e.target.value)}
                        />
                        <textarea
                            className="w-full p-2 mt-2 bg-transparent border border-[#30363d] rounded"
                            placeholder="Constraints (Optional)"
                            rows={2}
                            value={q.constraints}
                            onChange={(e) => updateQuestion(qIndex, "constraints", e.target.value)}
                        />

                        {/* Test Cases */}
                        <h3 className="font-medium mt-4">Test Cases</h3>
                        {q.testCases.map((tc, tcIndex) => (
                            <div key={tcIndex} className="border border-[#23272a] p-3 mt-2 rounded">
                                {tc.inputs.map((inp, iIndex) => (
                                    <div key={iIndex} className="mb-2">
                                        <input
                                            className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded"
                                            placeholder={`Input ${iIndex + 1}`}
                                            value={inp.value}
                                            onChange={(e) => updateInput(qIndex, tcIndex, iIndex, "value", e.target.value)}
                                        />
                                        <select
                                            className="w-full p-2 mt-1 bg-[#0d1117] border border-[#30363d] rounded"
                                            value={inp.type}
                                            onChange={(e) => updateInput(qIndex, tcIndex, iIndex, "type", e.target.value)}
                                        >
                                            <option value="string">String</option>
                                            <option value="number">Number</option>
                                            <option value="array">Array</option>
                                            <option value="object">Object</option>
                                        </select>
                                        {tc.inputs.length > 1 && (
                                            <button type="button" onClick={() => removeInput(qIndex, tcIndex, iIndex)} className="text-red-400 text-sm mt-1">Remove Input</button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={() => addInput(qIndex, tcIndex)} className="mt-1 px-2 py-1 bg-[#f5a623] text-black rounded">+ Add Input</button>

                                <input
                                    className="w-full p-2 mt-2 bg-[#0d1117] border border-[#30363d] rounded"
                                    placeholder="Expected Output"
                                    value={tc.expectedOutput}
                                    onChange={(e) => updateTestCase(qIndex, tcIndex, "expectedOutput", e.target.value)}
                                />
                                <label className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        checked={tc.hidden}
                                        onChange={(e) => updateTestCase(qIndex, tcIndex, "hidden", e.target.checked)}
                                    />
                                    Hidden Testcase
                                </label>
                                <button type="button" onClick={() => removeTestCase(qIndex, tcIndex)} className="mt-2 text-red-400 text-sm">Delete Testcase</button>
                            </div>
                        ))}

                        <button type="button" onClick={() => addTestCase(qIndex)} className="mt-2 px-3 py-1 bg-[#f5a623] text-black rounded">+ Add Testcase</button>
                        <button type="button" onClick={() => removeQuestion(qIndex)} className="mt-3 block text-red-400 text-sm">Delete Question</button>
                    </div>
                ))}

                <button type="button" onClick={addQuestion} className="px-4 py-2 bg-[#f5a623] text-black rounded mt-3">+ Add Question</button>
                <button type="button" onClick={handleSubmit} className="w-full py-3 mt-6 bg-[#f5a623] text-black font-semibold rounded">Create Test</button>
            </div>
        </div>
    );
};

export default CreateTest;
