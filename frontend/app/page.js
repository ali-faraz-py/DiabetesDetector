"use client";

import { useEffect, useRef, useState } from "react";

const FIELDS = [
  { key: "pregnancies", label: "Pregnancies", min: 0, max: 17, step: 1, default: 3, avg: 3.8 },
  { key: "glucose", label: "Glucose (mg/dL)", min: 0, max: 300, step: 1, default: 120, avg: 121.7 },
  { key: "blood_pressure", label: "Blood pressure (mm Hg)", min: 24, max: 122, step: 1, default: 70, avg: 72.4 },
  { key: "skin_thickness", label: "Skin thickness (mm)", min: 7, max: 99, step: 1, default: 20, avg: 27.3 },
  { key: "insulin", label: "Insulin (mu U/mL)", min: 14, max: 846, step: 1, default: 79, avg: 94.7 },
  { key: "bmi", label: "BMI", min: 18.2, max: 67.1, step: 0.1, default: 32, avg: 32.5 },
  { key: "diabetes_pedigree_function", label: "Pedigree function", min: 0.078, max: 2.42, step: 0.01, default: 0.5, avg: 0.5 },
  { key: "age", label: "Age", min: 21, max: 81, step: 1, default: 33, avg: 33.2 },
];

const GITHUB_URL = "https://github.com/ali-faraz-py/DiabetesDetector";
const FIND_DOCTOR_URL = "https://oladoc.com/pakistan/lahore/endocrinologist";

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

// Draws a shareable PNG summarizing the result onto an offscreen canvas,
// then triggers a download. Colors are hardcoded (not read from CSS vars)
// because canvas can't resolve CSS custom properties on its own.
function downloadShareCard(result) {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");

  const isHigh = result.risk_label === "High Risk";
  const accent = isHigh ? "#E3A857" : "#7FA98C";

  ctx.fillStyle = "#EDF3EF";
  ctx.fillRect(0, 0, 600, 400);

  ctx.fillStyle = "#2B3A42";
  ctx.font = "600 22px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("Diabetes Risk Diagnostic", 300, 60);

  ctx.fillStyle = accent;
  ctx.font = "700 40px Georgia, serif";
  ctx.fillText(result.risk_label, 300, 190);

  ctx.fillStyle = "#2B3A42";
  ctx.font = "400 22px sans-serif";
  ctx.fillText(`${Math.round(result.probability * 100)}% estimated probability`, 300, 230);

  ctx.font = "400 14px sans-serif";
  ctx.fillStyle = "#2B3A42";
  ctx.globalAlpha = 0.7;
  ctx.fillText("Screening estimate only \u2014 not a medical diagnosis.", 300, 340);
  ctx.globalAlpha = 1;

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "diabetes-risk-result.png";
  link.click();
}

export default function Home() {
  const [values, setValues] = useState(
    Object.fromEntries(FIELDS.map((f) => [f.key, f.default]))
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

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
      setHistory((h) => [
        { id: Date.now(), values: { ...values }, ...data },
        ...h,
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;
    const lines = [
      "Diabetes Risk Assessment Report",
      "--------------------------------",
      ...FIELDS.map((f) => `${f.label}: ${values[f.key]} (avg: ${f.avg})`),
      "--------------------------------",
      `Result: ${result.risk_label}`,
      `Probability: ${(result.probability * 100).toFixed(2)}%`,
      "",
      "This is a screening estimate, not a diagnosis.",
      "Please consult a doctor about what these numbers mean for you.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "diabetes-risk-report.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const pulseColor =
    result == null
      ? "var(--accent-teal)"
      : result.risk_label === "High Risk"
      ? "var(--accent-amber)"
      : "var(--accent-sage)";

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-16 md:py-24">
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-5 right-6 text-sm font-sans underline opacity-70 hover:opacity-100"
      >
        View on GitHub
      </a>

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
              <span className="text-xs opacity-50">avg: {f.avg}</span>
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

          <div className="flex flex-wrap justify-center gap-3 mt-5">
            <button
              onClick={handleDownloadReport}
              className="rounded-full border border-accent-teal text-accent-teal font-sans text-sm px-5 py-2 hover:bg-accent-teal hover:text-white transition-colors"
            >
              Download report
            </button>
            <button
              onClick={() => downloadShareCard(result)}
              className="rounded-full border border-accent-teal text-accent-teal font-sans text-sm px-5 py-2 hover:bg-accent-teal hover:text-white transition-colors"
            >
              Download shareable card
            </button>
          </div>

          {result.risk_label === "High Risk" && (
            <a
              href={FIND_DOCTOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 rounded-full bg-accent-amber text-white font-sans text-sm px-6 py-2 hover:opacity-90 transition-opacity"
            >
              Find an endocrinologist near you
            </a>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="w-full max-w-md mt-12">
          <h2 className="font-display text-xl text-center mb-4">
            This session&apos;s checks
          </h2>
          <ul className="flex flex-col gap-2">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex justify-between items-center bg-surface rounded-lg px-4 py-2 text-sm font-sans"
              >
                <span>{new Date(h.id).toLocaleTimeString()}</span>
                <span
                  className={
                    h.risk_label === "High Risk"
                      ? "text-accent-amber"
                      : "text-accent-sage"
                  }
                >
                  {h.risk_label} ({Math.round(h.probability * 100)}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}