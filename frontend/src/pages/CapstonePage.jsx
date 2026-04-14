import { useEffect, useMemo, useRef } from "react";
import { io } from "socket.io-client";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useCapstoneStore from "../store/useCapstoneStore.js";

const CapstonePage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get("sessionId");
  const navigatedRef = useRef(false);

  const { session, answers, isLoading, error, generateExam, setAnswer, submitExam } = useCapstoneStore();

  useEffect(() => {
    if (!courseId) return;
    generateExam(courseId, sessionIdFromUrl);
  }, [courseId, sessionIdFromUrl, generateExam]);

  useEffect(() => {
    const socket = io("http://localhost:3001", { withCredentials: true });

    socket.on("capstone:result", ({ sessionId }) => {
      if (!session?._id || sessionId !== session._id || navigatedRef.current) return;
      navigatedRef.current = true;
      navigate(`/capstone/${courseId}/result/${sessionId}`);
    });

    return () => socket.disconnect();
  }, [courseId, navigate, session?._id]);

  const allAnswered = useMemo(() => {
    if (!session?.questions?.length) return false;
    return session.questions.every((_, idx) => answers[idx] !== undefined && answers[idx] !== null);
  }, [answers, session?.questions]);

  const handleSubmit = async () => {
    if (!session?._id || navigatedRef.current) return;
    const response = await submitExam(session._id);
    if (response?.sessionId && !navigatedRef.current) {
      navigatedRef.current = true;
      navigate(`/capstone/${courseId}/result/${response.sessionId}`);
    }
  };

  if (isLoading && !session) {
    return <div className="p-6 text-stone-600">Loading capstone exam...</div>;
  }

  if (error && !session) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!session) {
    return <div className="p-6 text-stone-600">No capstone session available.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Capstone Exam</h1>
      <div className="space-y-4">
        {session.questions.map((q, index) => (
          <div key={`${q.stem}-${index}`} className="border rounded-xl p-4 bg-white">
            <p className="font-medium mb-3">{index + 1}. {q.stem}</p>
            <div className="space-y-2">
              {q.options.map((option, optionIndex) => (
                <label key={`${index}-${optionIndex}`} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`capstone-q-${index}`}
                    checked={answers[index] === optionIndex}
                    onChange={() => setAnswer(index, optionIndex)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allAnswered || isLoading}
        className="mt-6 px-5 py-2.5 rounded-lg bg-amber-500 text-black font-semibold disabled:opacity-50"
      >
        Submit Final Exam
      </button>
    </div>
  );
};

export default CapstonePage;
