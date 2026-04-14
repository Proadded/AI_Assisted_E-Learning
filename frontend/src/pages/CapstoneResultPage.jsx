import { useEffect } from "react";
import { useParams } from "react-router-dom";
import useCapstoneStore from "../store/useCapstoneStore.js";

const CapstoneResultPage = () => {
  const { sessionId } = useParams();
  const { result, isLoading, error, fetchResult } = useCapstoneStore();

  useEffect(() => {
    if (!sessionId) return;
    fetchResult(sessionId);
  }, [sessionId, fetchResult]);

  if (isLoading && !result) {
    return <div className="p-6 text-stone-600">Loading capstone result...</div>;
  }

  if (error && !result) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  const session = result?.session;
  if (!session) {
    return <div className="p-6 text-stone-600">Result not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-3">Capstone Result</h1>
      <p className="text-stone-700 mb-6">
        Score: <span className="font-semibold">{session.score ?? 0}%</span> ·{" "}
        {session.passed ? "Passed" : "Not passed"}
      </p>
      <div className="space-y-4">
        {(session.questions || []).map((q, index) => (
          <div key={`${q.stem}-${index}`} className="border rounded-xl p-4 bg-white">
            <p className="font-medium">{index + 1}. {q.stem}</p>
            <p className={`mt-2 text-sm ${q.isCorrect ? "text-emerald-700" : "text-red-700"}`}>
              {q.isCorrect ? "Correct" : "Incorrect"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CapstoneResultPage;
