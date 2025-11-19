import React, { useState } from "react";
import { getTest } from "../api/auth";
import { useNavigate } from "react-router-dom";

const GiveTest = () => {
    const [testId, setTestId] = useState("");
    const [test, setTest] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const loadTest = async () => {
        setError("");

        try {
            const res = await getTest(testId);
            setTest(res.data.test);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load test");
        }
    };

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-200 p-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-2xl text-[#f5a623] font-semibold">Enter Test ID</h2>

                    <div className="flex gap-2 mt-3">
                        <input
                            value={testId}
                            onChange={(e) => setTestId(e.target.value)}
                            className="flex-1 p-3 bg-[#161b22] border border-[#30363d] rounded-md"
                            placeholder="Test ID"
                        />
                        <button
                            onClick={loadTest}
                            className="px-4 py-2 bg-[#f5a623] rounded-md text-black"
                        >
                            Load
                        </button>
                    </div>

                    {error && <p className="text-red-400 mt-2">{error}</p>}
                </div>

                {test && (
                    <div className="bg-[#161b22] p-4 rounded-md border border-[#30363d]">
                        <h3 className="font-semibold text-lg">{test.name}</h3>
                        <p className="text-sm text-gray-400">{test.description}</p>

                        <div className="mt-4 flex gap-3">
                            <button
                                onClick={() => navigate(`/tests/${test._id}/start`)}
                                className="px-4 py-2 bg-[#f5a623] rounded-md text-black"
                            >
                                Start Test
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GiveTest;
