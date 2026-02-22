"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import RichTextEditor from "./RichTextEditor";

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  children: unknown[];
};

export default function CreateEventFormPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // Hardcoded values
  const eventType = "poll";
  const isPublic = true;
  const [isWhiteLabel, setIsWhiteLabel] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const url = `${baseUrl || "http://localhost:3000"}/api/categories`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load categories");
        return res.json();
      })
      .then((data: Category[]) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const createdBy =
      typeof window !== "undefined" ? window.sessionStorage.getItem("UserId") : null;
    if (!createdBy) {
      setSubmitError("You must be signed in to create an event.");
      return;
    }

    if (!categoryId) {
      setSubmitError("Please select a category.");
      return;
    }

    if (!startDate || !endDate) {
      setSubmitError("Please set both start and end date/time.");
      return;
    }

    try {
      setSubmitError(null);
      setSubmitLoading(true);

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const url = `${baseUrl || "http://localhost:3000"}/api/events`;
      const auth =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem("Authorization")
          : null;

      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        event_type: eventType,
        is_public: isPublic,
        is_white_label: isWhiteLabel,
        category_id: categoryId,
        created_by: createdBy,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(auth ? { Authorization: auth } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message ?? `Create failed: ${res.status}`);
      }

      const data = await res.json().catch(() => ({}));
      const createdId = data?.id ?? data?.event_id;
      if (createdId) {
        router.push(`/create-event/create-form/options?event_id=${encodeURIComponent(createdId)}`);
      } else {
        router.push("/create-event");
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/create-event"
            className="text-sm text-blue-300 hover:text-blue-200"
          >
            ← Back to Create Event
          </Link>
          <h1 className="text-3xl font-bold mt-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Create a new event
          </h1>
          <p className="text-sm text-gray-300 mt-1">
            Fill in the details below. Use the rich text editor for formatting.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl bg-slate-900/50 border border-white/10 p-6"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="My Event Title"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200" htmlFor="description">
              Description
            </label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe your event. Use the toolbar for bold, lists, links, etc."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200" htmlFor="category_id">
              Category
            </label>
            <select
              id="category_id"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={categoriesLoading}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {categoriesLoading && (
              <p className="text-xs text-gray-500">Loading categories…</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200" htmlFor="start_date">
                Start date & time
              </label>
              <input
                id="start_date"
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200" htmlFor="end_date">
                End date & time
              </label>
              <input
                id="end_date"
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isWhiteLabel}
                onChange={(e) => setIsWhiteLabel(e.target.checked)}
                className="rounded border-white/20 bg-slate-800 text-blue-400 focus:ring-blue-400"
              />
              <span className="text-sm text-gray-200">White label</span>
            </label>
          </div> */}

          {submitError && (
            <p className="text-sm text-red-400">{submitError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitLoading}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-400 to-purple-400 font-semibold text-white hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitLoading ? "Creating…" : "Create event"}
            </button>
            <Link
              href="/create-event"
              className="px-4 py-3 rounded-lg border border-white/20 text-gray-200 hover:bg-white/10 transition-all text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
