import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { POINTS } from '../../shared/points.js';

export default function Quiz() {
  const { refresh } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api('/quiz/current')
      .then((q) => {
        setQuiz(q);
        if (q.attempt) setResult(q.attempt);
      })
      .catch((e) => setError(e.message));
  }, []);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const r = await api('/quiz/submit', { method: 'POST', body: { answers } });
      setResult(r);
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz) return <p className="text-ash">{error || 'Loading...'}</p>;

  const reviewById = Object.fromEntries((result?.review || []).map((r) => [r.id, r]));
  const answered = quiz.questions.filter((q) => answers[q.id] !== undefined).length;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-4xl">Weekly quiz</h1>
        <p className="mt-1">
          {POINTS.QUIZ_PER_CORRECT} points per right answer, plus {POINTS.QUIZ_PERFECT_BONUS} for a perfect score. New
          questions every Monday.
        </p>
      </div>

      {result && (
        <div className="rounded-3xl bg-brand-400 p-5 text-center">
          <p className="font-heading text-4xl font-bold">{result.correct} / {result.total}</p>
          <p className="font-heading text-xl font-semibold">+{result.points} points</p>
          <p className="mt-1 text-sm">{result.correct === result.total ? 'Perfect! Quiz Ace badge unlocked.' : 'Check the answers below. See you Monday!'}</p>
        </div>
      )}

      <ol className="space-y-4">
        {quiz.questions.map((q, qi) => {
          const review = reviewById[q.id];
          return (
            <li key={q.id} className="card p-5">
              <p className="text-sm font-bold text-brand-700">Question {qi + 1} of {quiz.questions.length}</p>
              <p className="mt-1 font-heading text-xl font-semibold">{q.question}</p>
              <div className="mt-3 grid gap-2">
                {q.choices.map((c, ci) => {
                  let cls = 'border-brand-100 bg-white hover:bg-brand-50';
                  if (review) {
                    if (ci === review.answer) cls = 'border-brand-600 bg-brand-200';
                    else if (ci === review.chosen) cls = 'border-stop bg-red-50';
                    else cls = 'border-brand-50 bg-white text-ash';
                  } else if (answers[q.id] === ci) {
                    cls = 'border-brand-700 bg-brand-100';
                  }
                  return (
                    <button
                      key={c}
                      disabled={Boolean(result)}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: ci }))}
                      className={`rounded-2xl border-2 px-4 py-3 text-left font-semibold ${cls}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              {review && <p className="mt-3 text-sm">{review.correct ? 'Correct! ' : 'Not quite. '}{review.explanation}</p>}
            </li>
          );
        })}
      </ol>

      {error && <p className="text-stop">{error}</p>}
      {!result && (
        <button className="btn-primary btn-big w-full" disabled={answered < quiz.questions.length || submitting} onClick={submit}>
          {submitting ? 'Checking...' : `Submit (${answered}/${quiz.questions.length} answered)`}
        </button>
      )}
    </div>
  );
}
