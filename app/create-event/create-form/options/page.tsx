"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
});

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

export default function CreateEventOptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event_id") ?? "";

  const [event, setEvent] = useState<Event | null>(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  const [options, setOptions] = useState<EventOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [myEventsLoading, setMyEventsLoading] = useState(false);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const auth =
    typeof window !== "undefined" ? window.sessionStorage.getItem("Authorization") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(auth ? { Authorization: auth } : {}),
  };

  // Fetch event when event_id is set
  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      setEventError(null);
      return;
    }
    setEventLoading(true);
    setEventError(null);
    fetch(`${baseUrl || "http://localhost:3000"}/api/events/${eventId}`, { headers: auth ? { Authorization: auth } : {} })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load event: ${res.status}`);
        return res.json();
      })
      .then((data: Event) => setEvent(data ?? null))
      .catch((err) => setEventError(err?.message ?? "Failed to load event"))
      .finally(() => setEventLoading(false));
  }, [eventId, auth]);

  // Fetch options for this event
  useEffect(() => {
    if (!eventId) {
      setOptions([]);
      return;
    }
    setOptionsLoading(true);
    setOptionsError(null);
    fetch(
      `${baseUrl || "http://localhost:3000"}/api/event-options/by-event?event_id=${encodeURIComponent(eventId)}`
    )
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load options: ${res.status}`);
        return res.json();
      })
      .then((data: EventOption[]) => setOptions(Array.isArray(data) ? data : []))
      .catch((err) => {
        setOptionsError(err?.message ?? "Failed to load options");
        setOptions([]);
      })
      .finally(() => setOptionsLoading(false));
  }, [eventId, baseUrl]);

  // Fetch user's events when no event_id (to show "select event" list)
  useEffect(() => {
    if (eventId) return;
    const userId =
      typeof window !== "undefined" ? window.sessionStorage.getItem("UserId") : null;
    if (!userId) {
      setMyEventsLoading(false);
      return;
    }
    setMyEventsLoading(true);
    fetch(
      `${baseUrl}/api/events/by-created-by?created_by=${encodeURIComponent(userId)}`
    )
      .then((res) => res.ok ? res.json() : [])
      .then((data: Event[]) => setMyEvents(Array.isArray(data) ? data : []))
      .catch(() => setMyEvents([]))
      .finally(() => setMyEventsLoading(false));
  }, [eventId, baseUrl]);

  const reloadOptions = () => {
    if (!eventId) return;
    fetch(
      `${baseUrl || "http://localhost:3000"}/api/event-options/by-event?event_id=${encodeURIComponent(eventId)}`
    )
      .then((res) => res.ok ? res.json() : [])
      .then((data: EventOption[]) => setOptions(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    const name = formName.trim();
    if (!name) {
      setSubmitError("Option name is required.");
      return;
    }
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      if (editingId) {
        const res = await fetch(
          `${baseUrl || "http://localhost:3000"}/api/event-options/${editingId}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({ name, description: formDescription.trim() || undefined }),
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message ?? `Update failed: ${res.status}`);
        }
        setEditingId(null);
      } else {
        const res = await fetch(
          `${baseUrl || "http://localhost:3000"}/api/event-options`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              event_id: eventId,
              name,
              description: formDescription.trim() || undefined,
            }),
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message ?? `Create failed: ${res.status}`);
        }
      }
      setFormName("");
      setFormDescription("");
      reloadOptions();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const startEdit = (opt: EventOption) => {
    setEditingId(opt.id);
    setFormName(opt.name);
    setFormDescription(opt.description ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormName("");
    setFormDescription("");
  };

  const handleDelete = async (id: string) => {
    if (!eventId || !confirm("Delete this option?")) return;
    try {
      const res = await fetch(
        `${baseUrl || "http://localhost:3000"}/api/event-options/${id}`,
        { method: "DELETE", headers: auth ? { Authorization: auth } : {} }
      );
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      reloadOptions();
    } catch {
      setSubmitError("Failed to delete option.");
    }
  };

  if (!eventId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/create-event"
            className="text-sm text-blue-300 hover:text-blue-200"
          >
            ← Back to Create Event
          </Link>
          <h1 className="text-3xl font-bold mt-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Event options
          </h1>
          <p className="text-sm text-gray-300 mt-1 mb-6">
            Select an event to manage its options (poll choices).
          </p>
          {myEventsLoading ? (
            <p className="text-gray-400">Loading your events…</p>
          ) : myEvents.length === 0 ? (
            <p className="text-gray-400">
              You have no events yet.{" "}
              <Link href="/create-event/create-form" className="text-blue-300 hover:underline">
                Create one
              </Link>{" "}
              first.
            </p>
          ) : (
            <ul className="space-y-2">
              {myEvents.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/create-event/create-form/options?event_id=${encodeURIComponent(e.id)}`}
                    className="block rounded-lg bg-slate-800/50 border border-white/10 px-4 py-3 text-white hover:bg-slate-700/50 hover:border-blue-400/30"
                  >
                    <span className="font-medium">{e.title}</span>
                    {e.category_name && (
                      <span className="ml-2 text-xs text-gray-400">{e.category_name}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (eventLoading || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/create-event/create-form/options"
            className="text-sm text-blue-300 hover:text-blue-200"
          >
            ← Back to options
          </Link>
          <div className="mt-6 text-gray-400">
            {eventError || "Loading event…"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/create-event/create-form/options"
            className="text-sm text-blue-300 hover:text-blue-200"
          >
            ← Back to options
          </Link>
          <h1 className="text-3xl font-bold mt-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {event.title}
          </h1>
          <p className="text-sm text-gray-300 mt-1">Manage poll options for this event.</p>
        </div>

        <section className="rounded-2xl bg-slate-900/50 border border-white/10 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-200 mb-2">Event description</h2>
          <div
            className="ql-editor prose prose-invert max-w-none text-gray-200 text-sm rounded-lg bg-slate-800/50 p-4 border border-white/5 min-h-[60px]"
            dangerouslySetInnerHTML={{
              __html: event.description || "<p class='text-gray-500'>No description.</p>",
            }}
          />
        </section>

        <section className="rounded-2xl bg-slate-900/50 border border-white/10 p-6">
          <h2 className="text-sm font-medium text-gray-200 mb-4">Options (poll choices)</h2>

          <form onSubmit={handleSubmit} className="space-y-3 mb-6">
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Option name"
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div>
              <label className="text-xs text-gray-400 block mb-1">Description (optional, HTML)</label>
              <RichTextEditor
                value={formDescription}
                onChange={setFormDescription}
                placeholder="Optional description for this option…"
              />
            </div>
            {submitError && <p className="text-sm text-red-400">{submitError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitLoading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-400 to-purple-400 font-medium text-white hover:from-blue-500 hover:to-purple-500 disabled:opacity-60"
              >
                {submitLoading ? "Saving…" : editingId ? "Update option" : "Add option"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-lg border border-white/20 text-gray-200 hover:bg-white/10"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {optionsLoading ? (
            <p className="text-gray-400">Loading options…</p>
          ) : optionsError ? (
            <p className="text-sm text-red-400">{optionsError}</p>
          ) : options.length === 0 ? (
            <p className="text-gray-500 text-sm">No options yet. Add one above.</p>
          ) : (
            <ul className="space-y-2">
              {options.map((opt) => (
                <li
                  key={opt.id}
                  className="flex items-start justify-between gap-3 rounded-lg bg-slate-800/50 border border-white/10 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{opt.name}</p>
                    {opt.description && (
                      <div
                        className="ql-editor text-sm text-gray-400 mt-0.5 prose prose-invert max-w-none [&_p]:my-0.5"
                        dangerouslySetInnerHTML={{ __html: opt.description }}
                      />
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(opt)}
                      className="text-sm text-blue-300 hover:text-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(opt.id)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-6">
          <Link
            href="/create-event"
            className="text-sm text-blue-300 hover:text-blue-200"
          >
            ← Back to Create Event
          </Link>
        </div>
      </div>
    </div>
  );
}
