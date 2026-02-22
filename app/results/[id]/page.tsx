"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type OptionResult = {
  option_id: string;
  name: string;
  description: string;
  count: number;
  percentage: number;
};

type EventResultsResponse = {
  event_id?: string;
  event_title?: string;
  event_description?: string; // may contain HTML
  status?: string;
  total_votes: number;
  options: OptionResult[];
};

const CHART_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber / orange
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

export default function ResultsPage() {
  const params = useParams();
  const eventId = typeof params?.id === "string" ? params.id : "";
  const [data, setData] = useState<EventResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openOptionIds, setOpenOptionIds] = useState<Set<string>>(new Set());

  const toggleOption = (id: string) => {
    setOpenOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setError("Missing event ID");
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const url = `${baseUrl}/api/votes/event-results?event_id=${encodeURIComponent(eventId)}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load results: ${res.status}`);
        return res.json();
      })
      .then((body: EventResultsResponse) => {
        setData(body);
        setError(null);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load results");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading results…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error ?? "No data"}</p>
          <Link
            href="/events"
            className="inline-block px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
          >
            Back to events
          </Link>
        </div>
      </div>
    );
  }

  const options = data.options ?? [];
  const totalVotes = data.total_votes ?? 0;
  const isComplete = (data.status ?? "").toLowerCase() === "complete";

  // Pie chart: include all options. 100% = full circle; 0% = thin stripe (~1°)
  const centerX = 50;
  const centerY = 50;
  const radius = 45;
  const MIN_ANGLE = 3; // degrees for 0% options (thin stripe)

  const pieChart = options.map((opt, i) => ({
    percent: Math.max(0, Math.min(100, opt.percentage ?? 0)),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const numZeros = pieChart.filter((s) => s.percent === 0).length;
  const remainingAngle = 360 - numZeros * MIN_ANGLE;

  let currentAngle = -90; // start at 12 o'clock
  const pieSegments = pieChart.map((segment) => {
    const displayAngle =
      segment.percent === 0 ? MIN_ANGLE : (segment.percent / 100) * remainingAngle;
    const startAngle = currentAngle;
    const endAngle = currentAngle + displayAngle;
    currentAngle = endAngle;
    return { ...segment, startAngle, endAngle };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            href="/events"
            className="text-gray-400 hover:text-white transition"
          >
            ← Back to events
          </Link>
          {isComplete && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              Complete
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {data.event_title ?? "Event results"}
        </h1>

      

        <p className="text-gray-400 mb-10">
          Total votes: <span className="text-white font-medium">{totalVotes}</span>
        </p>

        {/* Pie chart */}
        <div className="flex flex-col sm:flex-row items-center gap-10 mb-12">
          <div className="flex-shrink-0 relative self-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative w-[160px] h-[160px]">
              <svg
                width="160"
                height="160"
                viewBox="0 0 100 100"
                className="drop-shadow-2xl relative z-10"
              >
                {pieSegments.map((segment, segIdx) => {
                    const startAngleRad = (segment.startAngle * Math.PI) / 180;
                    const endAngleRad = (segment.endAngle * Math.PI) / 180;

                    const x1 = centerX + radius * Math.cos(startAngleRad);
                    const y1 = centerY + radius * Math.sin(startAngleRad);
                    const x2 = centerX + radius * Math.cos(endAngleRad);
                    const y2 = centerY + radius * Math.sin(endAngleRad);

                    const angle = segment.endAngle - segment.startAngle;
                    const largeArcFlag = angle > 180 ? 1 : 0;

                    const pathData = [
                      `M ${centerX} ${centerY}`,
                      `L ${x1} ${y1}`,
                      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      "Z",
                    ].join(" ");

                    return (
                      <path
                        key={segIdx}
                        d={pathData}
                        fill={segment.color}
                        stroke="transparent"
                        strokeWidth="0.5"
                      />
                    );
                  })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white drop-shadow-2xl relative z-10">
                  {totalVotes}
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <ul className="space-y-3 w-full sm:w-auto">
            {options.map((opt, i) => (
              <li key={opt.option_id} className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="text-gray-200 flex-1">{opt.name}</span>
                <span className="text-white font-semibold tabular-nums">
                  {opt.percentage.toFixed(1)}%
                </span>
                <span className="text-gray-500 text-sm">({opt.count})</span>
              </li>
            ))}
          </ul>
        </div>

        {data.event_description && (
          <div
            className="mb-6 text-sm text-gray-200 prose prose-invert max-w-none prose-p:my-1 prose-a:text-indigo-400 prose-ul:my-2 prose-ol:my-2"
            dangerouslySetInnerHTML={{ __html: data.event_description }}
          />
        )}

        {/* Option details – accordions */}
        <div className="space-y-2">
          {options.map((opt, i) => {
            const isOpen = openOptionIds.has(opt.option_id);
            const hasDescription = !!opt.description?.trim();
            return (
              <div
                key={opt.option_id}
                className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleOption(opt.option_id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
                  aria-expanded={isOpen}
                  aria-controls={`option-desc-${opt.option_id}`}
                  id={`option-head-${opt.option_id}`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="font-medium text-white flex-1">{opt.name}</span>
                  <span className="text-gray-500 text-sm">
                    {opt.count} votes · {opt.percentage.toFixed(1)}%
                  </span>
                  {hasDescription && (
                    <svg
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
                {hasDescription && (
                  <div
                    id={`option-desc-${opt.option_id}`}
                    role="region"
                    aria-labelledby={`option-head-${opt.option_id}`}
                    className={`grid transition-[grid-template-rows] duration-200 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className=" min-h-0 overflow-hidden">
                      <div
                        className="pt-3 pb-4 px-4 pl-[1.75rem] text-gray-400 text-sm border-t border-white/10 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-a:text-indigo-400 prose-ul:my-2 prose-ol:my-2"
                        dangerouslySetInnerHTML={{ __html: opt.description }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
