"use client";

import { useEffect, useRef, useState } from "react";

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

function ecgSegment(o) {
  return (
    `L${0 + o},30 ` +
    `L${20 + o},30 ` +
    `C${26 + o},30 ${28 + o},20 ${34 + o},20 ` +
    `C${40 + o},20 ${42 + o},30 ${48 + o},30 ` +
    `L${60 + o},30 ` +
    `L${68 + o},34 L${74 + o},6 L${80 + o},52 L${88 + o},30 ` +
    `L${100 + o},30 ` +
    `C${112 + o},30 ${118 + o},14 ${130 + o},14 ` +
    `C${142 + o},14 ${148 + o},30 ${160 + o},30 ` +
    `L${200 + o},30 `
  );
}

function buildEcgPath(repeats, unitWidth) {
  let d = `M0,30 `;
  for (let i = 0; i < repeats; i++) {
    d += ecgSegment(i * unitWidth);
  }
  return d.trim();
}

const BEAT_COUNT = 4;
const UNIT_WIDTH = 200;
const ECG_PATH = buildEcgPath(BEAT_COUNT, UNIT_WIDTH);

function PulseLine({ color }) {
  const pathRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;

    if (prefersReducedMotion) {
      path.style.strokeDashoffset = "0";
      return;
    }

    animRef.current = path.animate(
      [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
      { duration: 3200, iterations: Infinity, easing: "linear" }
    );

    return () => animRef.current?.cancel();
  }, []);

  return (
    <svg
      viewBox={`0 0 ${BEAT_COUNT * UNIT_WIDTH} 60`}
      className="w-full h-full"
    >
      <path
        ref={pathRef}
        d={ECG_PATH}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

      <div className="w-full max-w-xl my-10 h-16">
        <PulseLine color={pulseColor} />
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
    </main>
  );
}