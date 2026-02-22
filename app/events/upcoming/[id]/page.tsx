"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Event = {
  id: string;
  title: string;
  description: string;
  event_type: string;
  is_public: boolean;
  is_white_label: boolean;
  category_id: string | null;
  category_name?: string;
  start_date: string;
  end_date: string;
  created_at: string;
  status?: string;
};

type EventOption = {
  id: string;
  event_id: string;
  name: string;
  description: string;
};

export default function EventDetailPage() {
  const params = useParams();
  const eventId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const getRemainingMs = (e: Event | null, currentTimeMs: number) => {
    if (!e) return 0;
    const end = new Date(e.end_date).getTime();
    return Math.max(end - currentTimeMs, 0);
  };

  useEffect(() => {
    if (!eventId) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const url = `${baseUrl}/api/events/${eventId}`;

    setLoading(true);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load event: ${res.status}`);
        return res.json();
      })
      .then((data: Event) => setEvent(data ?? null))
      .catch((err) => setError(err?.message ?? "Failed to load event"))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const url = `${baseUrl || "http://localhost:3000"}/api/event-options/by-event?event_id=${eventId}`;

    setOptionsLoading(true);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load event options: ${res.status}`);
        return res.json();
      })
      .then((data: EventOption[]) => setEventOptions(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Failed to load event options:", err);
        setEventOptions([]);
      })
      .finally(() => setOptionsLoading(false));
  }, [eventId]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const countdown = useMemo(() => {
    if (!event) return "";
    const diffMs = getRemainingMs(event, nowMs);
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `Ends in ${String(days).padStart(2, "0")}:${String(hours).padStart(
      2,
      "0",
    )}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [event, nowMs]);

  // Simple static pie chart like list page
  const pieChart = [
    { color: "#3b82f6", percent: 40 },
    { color: "#eab308", percent: 30 },
    { color: "#84cc16", percent: 20 },
    { color: "#ef4444", percent: 10 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-gray-300">
        Loading event...
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-red-400">
        {error ?? "Event not found"}
      </div>
    );
  }

  let currentAngle = -90;
  const radius = 40;
  const centerX = 50;
  const centerY = 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mb-4 text-sm text-blue-300 hover:text-blue-200"
          >
            ← Back to Events
          </button>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {event.title}
          </h1>
          {event.category_name && (
            <p className="text-xs uppercase tracking-[0.15em] text-gray-300">
              {event.category_name}
            </p>
          )}
        </div>

        <div className="group bg-gradient-to-br from-purple-800/60 to-indigo-800/60 backdrop-blur-sm rounded-3xl p-8 border border-white/15 hover:border-white/30 transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300 rounded-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4 p-2 bg-purple-900/30 rounded-xl border border-purple-500/25 w-fit">
                <svg
                  className="w-4 h-4 text-purple-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-purple-100 font-mono text-sm">{countdown}</p>
              </div>

              <div className="text-xs text-gray-300 mb-4 space-y-1">
                <p>
                  Starts:{" "}
                  {new Date(event.start_date).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <p>
                  Ends:{" "}
                  {new Date(event.end_date).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              <div className="prose prose-invert max-w-none text-gray-100">
                <div
                  // description is stored as HTML
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>
            </div>

            <div className="flex-shrink-0 relative self-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
              <svg
                width="160"
                height="160"
                viewBox="0 0 100 100"
                className="drop-shadow-2xl relative z-10"
              >
                {pieChart.map((segment, segIdx) => {
                  const angle = (segment.percent / 100) * 360;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + angle;

                  const startAngleRad = (startAngle * Math.PI) / 180;
                  const endAngleRad = (endAngle * Math.PI) / 180;

                  const x1 = centerX + radius * Math.cos(startAngleRad);
                  const y1 = centerY + radius * Math.sin(startAngleRad);
                  const x2 = centerX + radius * Math.cos(endAngleRad);
                  const y2 = centerY + radius * Math.sin(endAngleRad);

                  const largeArcFlag = angle > 180 ? 1 : 0;

                  const pathData = [
                    `M ${centerX} ${centerY}`,
                    `L ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    "Z",
                  ].join(" ");

                  currentAngle = endAngle;

                  return (
                    <path
                      key={segIdx}
                      d={pathData}
                      fill={segment.color}
                      stroke="#1e293b"
                      strokeWidth="0.5"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {eventOptions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Event Options
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {eventOptions.map((option) => (
                <div
                  key={option.id}
                  className="group bg-gradient-to-br from-purple-800/40 to-indigo-800/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden transform hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 rounded-2xl" />
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold mb-2 group-hover:text-blue-300 transition-colors">
                      {option.name}
                    </h3>
                    {option.description && (
                      <div
                        className="ql-editor text-sm text-gray-300 prose prose-invert max-w-none line-clamp-1 [&_p]:my-0 [&_p]:inline [&_ul]:inline [&_li]:inline"
                        dangerouslySetInnerHTML={{ __html: option.description }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {optionsLoading && (
          <div className="mt-8 text-center text-gray-400">Loading event options...</div>
        )}
      </div>
    </div>
  );
}

