"use client";

import { useState } from "react";

const FIELDS = [
  { key: "pregnancies", label: "Pregnancies", min: 0, max: 17, step: 1, default: 3 },
  { key: "glucose", label: "Glucose (mg/dL)", min: 0, max: 300, step: 1, default: 120 },
  { key: "blood_pressure", label: "Blood pressure (mm Hg)", min: 24, max: 122, step: 1, default: 70 },
  { key: "skin_thickness", label: "Skin thickness (mm)", min: 7, max: 99, step: 1, default: 20 },
  { key: "insulin", label: "Insulin (mu U/mL)", min: 14, max: 846, step: 1, default: 79 },
  { key: "bmi", label: "BMI", min: 18.2, max: 67.1, step: 0.1, default: 32 },
  { key: "diabetes_pedigree_function", label: "Pedigree function", min: 0.078, max: 2.42, step: 0.01, default: 0.5 },
  { key: "age", label: "Age", min: 21, max: 81, step: 1, default: 33 },
];

export default function Home() {
  const [values, setValues] = useState(
    Object.fromEntries(FIELDS.map((f) => [f.key, f.default]))
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (key, val) => {
    setValues((v) => ({ ...v, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`API responded with ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pulseColor =
    result == null
      ? "var(--accent-teal)"
      : result.risk_label === "High Risk"
      ? "var(--accent-amber)"
      : "var(--accent-sage)";

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-16 md:py-24">
      <div className="max-w-xl w-full text-center">
        <h1 className="font-display text-4xl md:text-5xl leading-tight">
          Understand your diabetes risk
        </h1>
        <p className="font-sans text-base mt-4 opacity-80">
          Enter a few clinical readings and we&apos;ll estimate your risk,
          the same way a screening test would.
        </p>
      </div>

      <div className="w-full max-w-xl my-10 h-16 overflow-hidden">
        <svg
          viewBox="0 0 600 60"
          className="w-[200%] h-full pulse-wave"
          style={{ "--pulse-color": pulseColor }}
        >
          <path
            d="M0 30 C 25 5, 50 5, 75 30 S 125 55, 150 30 S 200 5, 225 30 S 275 55, 300 30 S 350 5, 375 30 S 425 55, 450 30 S 500 5, 525 30 S 575 55, 600 30"
            fill="none"
            stroke="var(--pulse-color)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M600 30 C 625 5, 650 5, 675 30 S 725 55, 750 30 S 800 5, 825 30 S 875 55, 900 30 S 950 5, 975 30 S 1025 55, 1050 30 S 1100 5, 1125 30 S 1175 55, 1200 30"
            fill="none"
            stroke="var(--pulse-color)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-surface rounded-2xl px-8 py-8"
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          {FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-1 text-sm font-sans">
              <span className="opacity-70">{f.label}</span>
              <input
                type="number"
                min={f.min}
                max={f.max}
                step={f.step}
                value={values[f.key]}
                onChange={(e) => handleChange(f.key, parseFloat(e.target.value))}
                className="rounded-md border border-foreground/15 bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-teal"
              />
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-8 w-full rounded-full bg-accent-teal text-white font-sans text-sm py-3 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Check my risk"}
        </button>

        {error && (
          <p className="mt-4 text-sm text-accent-amber text-center">
            Something went wrong: {error}
          </p>
        )}
      </form>

      {result && (
        <div className="w-full max-w-md mt-8 text-center">
          <p className="font-display text-3xl">
            {result.risk_label} &mdash; {Math.round(result.probability * 100)}%
          </p>
          <p className="font-sans text-sm mt-2 opacity-70">
            This is a screening estimate, not a diagnosis. Talk to a doctor
            about what these numbers mean for you.
          </p>
        </div>
      )}

      <style jsx>{`
        .pulse-wave {
          animation: pulse-scroll 6s linear infinite;
        }
        @keyframes pulse-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-wave { animation: none; }
        }
      `}</style>
    </main>
  );
}