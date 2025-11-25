import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/auth";

const EditTest = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get(`/tests/${testId}`);
                setTest(res.data.test);
            } catch {
                alert("Failed to load test");
            }
            setLoading(false);
        })();
    }, [testId]);

    if (loading) return <p className="text-center mt-10">Loading...</p>;

    const updateField = (field, value) => setTest({ ...test, [field]: value });

    const updateQuestionField = (qIndex, field, value) => {
        const updated = [...test.questions];
        updated[qIndex][field] = value;
        setTest({ ...test, questions: updated });
    };

    const updateTestCase = (qIndex, tcIndex, key, value) => {
        const updated = [...test.questions];
        updated[qIndex].testCases[tcIndex][key] = value;
        setTest({ ...test, questions: updated });
    };

    const addQuestion = () => {
        setTest({
            ...test,
            questions: [
                ...test.questions,
                { title: "", description: "", testCases: [{ inputs: [{ value: "", type: "string" }], expectedOutput: "", outputType: "string" }] }
            ]
        });
    };

    const deleteQuestion = (qIndex) => {
        if (!window.confirm("Delete this question?")) return;
        setTest({ ...test, questions: test.questions.filter((_, i) => i !== qIndex) });
    };

    const addTestCase = (qIndex) => {
        const updated = [...test.questions];
        updated[qIndex].testCases.push({ inputs: [{ value: "", type: "string" }], expectedOutput: "", outputType: "string" });
        setTest({ ...test, questions: updated });
    };

    const addInput = (qIndex, tcIndex) => {
        const updated = [...test.questions];
        updated[qIndex].testCases[tcIndex].inputs.push({ value: "", type: "string" });
        setTest({ ...test, questions: updated });
    };

    const updateInput = (qIndex, tcIndex, iIndex, key, value) => {
        const updated = [...test.questions];
        updated[qIndex].testCases[tcIndex].inputs[iIndex][key] = value;
        setTest({ ...test, questions: updated });
    };

    const removeInput = (qIndex, tcIndex, iIndex) => {
        const updated = [...test.questions];
        updated[qIndex].testCases[tcIndex].inputs = updated[qIndex].testCases[tcIndex].inputs.filter((_, idx) => idx !== iIndex);
        setTest({ ...test, questions: updated });
    };

    const saveTest = async () => {
        try {
            setSaving(true);
            await api.put(`/tests/${testId}`, test);
            alert("Test updated!");
            navigate("/dashboard");
        } catch {
            alert("Failed to save");
        }
        setSaving(false);
    };

    return (
        <div className="min-h-screen bg-[#0d1117] p-8 text-gray-200">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl text-[#f5a623] font-semibold mb-5">Edit Test</h1>

                {/* Basic Info */}
                <div className="bg-[#161b22] p-5 rounded-lg border border-[#30363d]">
                    <label>Name</label>
                    <input className="w-full p-3 bg-[#0d1117] rounded border border-[#30363d]" value={test.name} onChange={(e) => updateField("name", e.target.value)} />
                    <label className="mt-4 block">Description</label>
                    <textarea className="w-full p-3 bg-[#0d1117] rounded border border-[#30363d]" value={test.description} onChange={(e) => updateField("description", e.target.value)} />
                </div>

                {/* Questions */}
                <h2 className="text-xl font-semibold mt-8 mb-3">Coding Questions</h2>

                {test.questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-[#161b22] p-5 mb-5 rounded border border-[#30363d]">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Question {qIndex + 1}</h3>
                            <button onClick={() => deleteQuestion(qIndex)} className="text-red-400 text-sm">Delete</button>
                        </div>
                        <input className="w-full p-3 bg-[#0d1117] rounded border border-[#30363d]" value={q.title} onChange={(e) => updateQuestionField(qIndex, "title", e.target.value)} />
                        <textarea className="w-full p-3 mt-2 bg-[#0d1117] rounded border border-[#30363d]" value={q.description} onChange={(e) => updateQuestionField(qIndex, "description", e.target.value)} />

                        {/* Test Cases */}
                        <h4 className="mt-4 font-semibold">Test Cases</h4>
                        {q.testCases.map((tc, tcIndex) => (
                            <div key={tcIndex} className="border p-3 mt-3 rounded border-[#30363d]">
                                {tc.inputs.map((inp, iIndex) => (
                                    <div key={iIndex} className="mb-2">
                                        <input className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded"
                                            placeholder={`Input ${iIndex + 1}`}
                                            value={inp.value}
                                            onChange={(e) => updateInput(qIndex, tcIndex, iIndex, "value", e.target.value)} />
                                        <select className="w-full p-2 mt-1 bg-[#0d1117] border border-[#30363d] rounded"
                                            value={inp.type}
                                            onChange={(e) => updateInput(qIndex, tcIndex, iIndex, "type", e.target.value)}>
                                            <option value="string">String</option>
                                            <option value="number">Number</option>
                                            <option value="array">Array</option>
                                            <option value="object">Object</option>
                                        </select>
                                        {tc.inputs.length > 1 && <button onClick={() => removeInput(qIndex, tcIndex, iIndex)} className="text-red-400 text-sm mt-1">Remove Input</button>}
                                    </div>
                                ))}
                                <button onClick={() => addInput(qIndex, tcIndex)} className="mt-1 px-2 py-1 bg-[#f5a623] text-black rounded">+ Add Input</button>

                                <textarea className="w-full p-2 mt-2 bg-[#0d1117] border border-[#30363d] rounded" placeholder="Expected Output" value={tc.expectedOutput} onChange={(e) => updateTestCase(qIndex, tcIndex, "expectedOutput", e.target.value)} />
                            </div>
                        ))}
                        <button onClick={() => addTestCase(qIndex)} className="mt-3 px-3 py-1 bg-[#f5a623] text-black rounded">+ Add Test Case</button>
                    </div>
                ))}

                <button onClick={addQuestion} className="mt-3 px-4 py-2 bg-[#f5a623] text-black rounded-md">+ Add Question</button>
                <button onClick={saveTest} disabled={saving} className="mt-6 w-full py-3 bg-[#f5a623] text-black rounded-md">{saving ? "Saving..." : "Save Test"}</button>
            </div>
        </div>
    );
};

export default EditTest;
