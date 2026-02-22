"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

export default function CreateEventPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const userId =
      typeof window !== "undefined" ? window.sessionStorage.getItem("UserId") : null;

    if (!userId) {
      setLoading(false);
      setError("You must be signed in to view your events.");
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const url = `${baseUrl}/api/events/by-created-by?created_by=${encodeURIComponent(
      userId,
    )}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load your events: ${res.status}`);
        return res.json();
      })
      .then((data: Event[]) => setEvents(Array.isArray(data) ? data : []))
      .catch((err) => setError(err?.message ?? "Failed to load your events"))
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return events;

    return events.filter((e) => {
      return (
        e.title.toLowerCase().includes(term) ||
        (e.description ?? "").toLowerCase().includes(term) ||
        (e.category_name ?? "").toLowerCase().includes(term)
      );
    });
  }, [events, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Create Event
            </h1>
            <p className="text-sm text-gray-300 max-w-md">
              Start a new global poll or event, and manage the ones you&apos;ve already created.
            </p>
          </div>
          <Link href="/create-event/create-form">   
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-400 to-purple-400 font-semibold text-sm text-white hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-purple-500/40 transform hover:scale-105"
          >
            Create a new event
          </button>
          </Link>
        </div>

        <div className="mb-6 max-w-md">
          <div className="flex items-center bg-blue-900/30 backdrop-blur-sm rounded-xl p-3 border border-blue-400/20 shadow-xl shadow-blue-500/10 relative overflow-hidden group hover:border-blue-400/40 transition-all">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />
            <svg
              className="w-5 h-5 mr-3 text-blue-300 group-hover:text-blue-200 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your events by title, description, or category..."
              className="flex-1 bg-transparent outline-none text-gray-200 placeholder-gray-400 text-sm focus:placeholder-gray-500 transition-colors"
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Showing {filteredEvents.length} of {events.length} events you&apos;ve created
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading your events...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-400 text-sm">{error}</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            You haven&apos;t created any events yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="group bg-gradient-to-br from-purple-800/60 to-indigo-800/60 backdrop-blur-sm rounded-2xl p-5 border border-white/15 hover:border-white/30 transition-all duration-300 relative overflow-hidden transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/30"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300 rounded-2xl" />
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h2 className="text-lg font-semibold group-hover:text-blue-200 transition-colors line-clamp-2">
                      {event.title}
                    </h2>
                    {event.status && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 capitalize">
                        {event.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                  {event.category_name && (
                    <p className="text-[11px] bg-white rounded-full px-2 py-1 text-center font-bold text-black">
                        {event.category_name}
                      </p>
                    )}
                  </div>
                  {event.description && (
                    <div
                      className="ql-editor text-xs text-gray-300 prose prose-invert max-w-none line-clamp-1 overflow-hidden [&_p]:my-0 [&_p]:inline [&_ul]:inline [&_li]:inline"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                      style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    />
                  )}
                  <p className="mt-2 text-[11px] text-gray-400">
                    Starts:{" "}
                    {new Date(event.start_date).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <Link
                    href={`/create-event/create-form/options?event_id=${encodeURIComponent(event.id)}`}
                    className="mt-3 inline-block text-xs font-medium text-blue-300 hover:text-blue-200"
                  >
                    Manage options →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

