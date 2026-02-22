'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { countryCodeToFlag } from "@/utils/flag"
import Link from 'next/link';

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  children: unknown[];
};

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

const CATEGORY_STYLES: Record<string, { url: string; gradient: string }> = {
  Elections: { url: '/vote.png', gradient: 'from-blue-500 to-cyan-500' },
  Referendums: { url: '/vireing.png', gradient: 'from-purple-500 to-pink-500' },
  'Global Issues': { url: '/global.png', gradient: 'from-green-500 to-emerald-500' },
  Economy: { url: '/gold.png', gradient: 'from-yellow-500 to-orange-500' },
  'Geo-Conflicts': { url: '/global.png', gradient: 'from-red-500 to-rose-500' },
  Countries: { url: '/countries.png', gradient: 'from-indigo-500 to-blue-500' },
  Electronics: { url: '/global.png', gradient: 'from-slate-500 to-slate-600' },
  Politics: { url: '/vote.png', gradient: 'from-violet-500 to-purple-500' },
};

const DEFAULT_CATEGORY_STYLE = { url: '/global.png', gradient: 'from-slate-500 to-slate-600' };

export default function TestPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [heroEvents, setHeroEvents] = useState<Event[]>([]);
  const [heroLoading, setHeroLoading] = useState(true);
  const [heroError, setHeroError] = useState<string | null>(null);

  const [completedEvents, setCompletedEvents] = useState<Event[]>([]);
  const [completedLoading, setCompletedLoading] = useState(true);
  const [completedError, setCompletedError] = useState<string | null>(null);


  useEffect(() => {
    // Only NEXT_PUBLIC_* vars are available in the browser.
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    console.log("NEXT_PUBLIC_API_BASE_URL:", apiBase || "(not set – add to .env.local)");
  }, []);

  const [timeLeft, setTimeLeft] = useState({
    uk: { days: 5, hours: 12, minutes: 45, seconds: 30 },
    crypto: { days: 8, hours: 23, minutes: 10, seconds: 15 },
    brazil: { days: 12, hours: 5, minutes: 7, seconds: 42 },
  });

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    const url = `${baseUrl }/api/events/by-status?status=upcoming`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load events: ${res.status}`);
        return res.json();
      })
      .then((data: Event[]) => setEvents(Array.isArray(data) ? data : []))
      .catch((err) => setEventsError(err?.message ?? 'Failed to load events'))
      .finally(() => setEventsLoading(false));
  }, []);

  // Hero / trending events
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    const url = `${baseUrl}/api/events/hero`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load hero events: ${res.status}`);
        return res.json();
      })
      .then((data: Event[]) => setHeroEvents(Array.isArray(data) ? data : []))
      .catch((err) => setHeroError(err?.message ?? 'Failed to load hero events'))
      .finally(() => setHeroLoading(false));
  }, []);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    const url = `${baseUrl }/api/events/by-status?status=completed`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load completed events: ${res.status}`);
        return res.json();
      })
      .then((data: Event[]) => setCompletedEvents(Array.isArray(data) ? data : []))
      .catch((err) => setCompletedError(err?.message ?? 'Failed to load completed events'))
      .finally(() => setCompletedLoading(false));
  }, []);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    const url = `http://localhost:3000/api/categories/`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load categories: ${res.status}`);
        return res.json();
      })
      .then((data: Category[]) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => setCategoriesError(err?.message ?? 'Failed to load categories'))
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => ({
        uk: {
          days: prev.uk.days,
          hours: prev.uk.hours,
          minutes: prev.uk.minutes,
          seconds: prev.uk.seconds > 0 ? prev.uk.seconds - 1 : 59,
        },
        crypto: {
          days: prev.crypto.days,
          hours: prev.crypto.hours,
          minutes: prev.crypto.minutes,
          seconds: prev.crypto.seconds > 0 ? prev.crypto.seconds - 1 : 59,
        },
        brazil: {
          days: prev.brazil.days,
          hours: prev.brazil.hours,
          minutes: prev.brazil.minutes,
          seconds: prev.brazil.seconds > 0 ? prev.brazil.seconds - 1 : 59,
        },
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (t: { days: number; hours: number; minutes: number; seconds: number }) => {
    return `In ${String(t.days).padStart(2, '0')}:${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}:${String(t.seconds).padStart(2, '0')}`;
  };

  const getHeroStatusBadge = (event: Event) => {
    const now = Date.now();
    const start = new Date(event.start_date).getTime();
    const end = new Date(event.end_date).getTime();

    if (event.status === 'active' && now >= start && now <= end) {
      return { label: 'LIVE', color: 'bg-red-500', pulse: true };
    }

    if (now < start) {
      return { label: 'Upcoming', color: 'bg-yellow-500', pulse: false };
    }

    return { label: 'Finished', color: 'bg-gray-500', pulse: false };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative px-6 py-20 overflow-hidden">
        {/* Starry background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        {/* Orange-red glow from behind Earth */}
        <div 
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl -z-0"
          style={{
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.4) 0%, rgba(239, 68, 68, 0.3) 50%, transparent 100%)'
          }}
        ></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left Column: Text, Search, and Trending */}
            <div className="relative z-20 flex flex-col gap-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                  Global Opinions in One Place.<br />
                  <span className="text-white">Honest. Transparent. Worldwide.</span>
                </h1>
                <p className="text-md text-gray-300 mb-8">
                  Vote on global events and explore how countries respond — instantly and visually.
                </p>
                {/* <div className="flex items-center bg-blue-900/30 backdrop-blur-sm rounded-xl p-3 max-w-md border border-blue-400/20 shadow-xl shadow-blue-500/10 relative overflow-hidden group hover:border-blue-400/40 transition-all">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent"></div>
                  <svg className="w-5 h-5 mr-3 text-blue-300 group-hover:text-blue-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search global events, elections, topics..."
                    className="flex-1 bg-transparent outline-none text-gray-200 placeholder-gray-400 text-sm focus:placeholder-gray-500 transition-colors"
                  />
                  <button className="ml-2 p-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all transform hover:scale-110 shadow-lg shadow-purple-500/30">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div> */}
              </div>
              
              {/* Trending Worldwide Section */}
              <div className="relative z-20">
                <h2 className="text-2xl font-bold mb-6">
                  <span className="text-3xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Trending</span> <span className="text-xl">Worldwide</span>
                </h2>
                <div className="flex gap-4">
                  {(heroLoading && heroEvents.length === 0) || heroError
                    ? (
                      <div className="text-sm text-gray-300">
                        No trending events right now.
                      </div>
                    )
                    : heroEvents.slice(0, 3).map((event, idx) => {
                        const badge = getHeroStatusBadge(event);
                        return (
                         
                          <div key={event.id ?? idx} className="group flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
                             <Link href={`/events/${event.id}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="px-3 py-1 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-[11px] font-semibold max-w-[160px] truncate">
                                {event.category_name ?? 'Global Event'}
                              </div>

                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge.color} ${badge.pulse ? 'animate-pulse' : ''} shadow-lg`}>
                                {badge.label}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold group-hover:text-blue-300 transition-colors line-clamp-2">
                              {event.title}
                            </h3>
                            </Link>
                          </div>
                       
                        );
                      })}
                </div>
               
              </div>
              <div className="mt-6 flex justify-start">
                <Link
                  href="/events"
                  className="px-8 py-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg transition-all font-semibold hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-purple-500/50 transform hover:scale-105"
                >
                 All Active Events 
                </Link>
            
              </div>
            </div>
            
            {/* Right Column: Earth Visualization */}
            <div className="relative w-full h-[600px] flex items-center justify-center">
              {/* Orbital lines/data flow */}
              <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                {/* Blue orbital line */}
                <path
                  d="M 200 100 Q 400 200 600 300 T 800 500"
                  fill="none"
                  stroke="rgba(59, 130, 246, 0.6)"
                  strokeWidth="2"
                  className="animate-pulse"
                />
                {/* Red orbital line */}
                <path
                  d="M 150 150 Q 350 250 550 350 T 750 550"
                  fill="none"
                  stroke="rgba(239, 68, 68, 0.6)"
                  strokeWidth="2"
                  className="animate-pulse"
                  style={{ animationDelay: '0.5s' }}
                />
                {/* Data nodes */}
                {[
                  { x: 200, y: 100 },
                  { x: 400, y: 200 },
                  { x: 600, y: 300 },
                  { x: 800, y: 500 },
                  { x: 150, y: 150 },
                  { x: 350, y: 250 },
                  { x: 550, y: 350 },
                  { x: 750, y: 550 },
                ].map((node, idx) => (
                  <circle
                    key={idx}
                    cx={node.x}
                    cy={node.y}
                    r="4"
                    fill="rgba(255, 255, 255, 0.8)"
                    className="animate-pulse"
                    style={{ animationDelay: `${idx * 0.2}s` }}
                  />
                ))}
              </svg>
              
              {/* Earth Image */}
              <div className="relative z-10">
                <div className="relative w-[700px] h-[600px]">
                  <Image
                    src="/Gemini_Generated_Image_393hjh393hjh393h-removebg-preview.png"
                    alt="Earth Globe"
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                  {/* Blue glow around Earth */}
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl -z-10"></div>
                </div>
              </div>
              
              {/* Additional glowing effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

    

      {/* Explore Categories Section */}
      <section className="px-6 py-16 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Explore Categories
            </h2>
            <p className="text-gray-300 text-lg">Discover voting events across different topics and regions</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
            {categoriesLoading ? (
              <div className="col-span-full text-center py-12 text-gray-400">Loading categories...</div>
            ) : categoriesError ? (
              <div className="col-span-full text-center py-12 text-red-400">{categoriesError}</div>
            ) : (
              categories
                .filter((c) => c.parent_id == null)
                .map((category) => {
                  const style = CATEGORY_STYLES[category.name] ?? DEFAULT_CATEGORY_STYLE;
                  return (
                    <Link href={`/by-category/${category.id}`}>
                    <div
                      key={category.id}
                      className="group flex flex-col items-center gap-4 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20"
                    >
                      <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${style.gradient} p-1 group-hover:scale-110 transition-transform duration-300`}>
                        <div className="w-full h-full rounded-full bg-slate-900/50 flex items-center justify-center">
                          <Image src={style.url} alt={category.name} width={60} height={60} className="object-contain" />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-center">{category.name}</span>
                    </div>
                    </Link>
                  );
                })
            )}
          </div>
        </div>
      </section>



      <section className="px-6 py-16 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Upcoming Events
            </h2>
            <p className="text-gray-300 text-lg">Vote on these upcoming global events and make your voice heard</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventsLoading ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                Loading events...
              </div>
            ) : eventsError ? (
              <div className="col-span-full text-center py-12 text-red-400">
                {eventsError}
              </div>
            ) : events.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                No upcoming events found.
              </div>
            ) : (
              events.map((event, idx) => {
                // Simple static pie chart segments (you can later map real data)
                const pieChart = [
                  { color: '#3b82f6', percent: 40 }, // Blue
                  { color: '#eab308', percent: 30 }, // Yellow
                  { color: '#84cc16', percent: 20 }, // Green
                  { color: '#ef4444', percent: 10 }, // Red
                ];

                let currentAngle = -90; // Start from top
                const radius = 40;
                const centerX = 50;
                const centerY = 50;

                // Rotate countdown presets just to keep the live timer
                const timePreset =
                  idx % 3 === 0 ? timeLeft.uk : idx % 3 === 1 ? timeLeft.crypto : timeLeft.brazil;

                return (
                  <div
                    key={event.id ?? idx}
                    className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 relative overflow-hidden transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300 rounded-2xl"></div>

                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold mb-2 group-hover:text-blue-300 transition-colors">
                            {event.title}
                          </h3>
                        </div>
                        {event.category_name && (
                          <p className="text-xs text-gray-300 mb-1 uppercase tracking-wide">
                            {event.category_name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mb-4 p-2 bg-purple-900/20 rounded-lg border border-purple-500/20">
                          <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-purple-300 font-mono text-sm">
                            {formatTime(timePreset)}
                          </p>
                        </div>
                        <Link href={`/events/upcoming/${event.id}`}>
                        <button className="w-full py-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg transition-all font-semibold hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-purple-500/50 transform hover:scale-105">
                          View Event
                        </button>
                        </Link>
                      </div>
                      <div className="flex-shrink-0 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                        <svg
                          width="100"
                          height="100"
                          viewBox="0 0 100 100"
                          className="drop-shadow-2xl relative z-10 group-hover:scale-110 transition-transform duration-300"
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
                              'Z',
                            ].join(' ');

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
                );
              })
            )}
          </div>
        </div>
      </section>







      <section className="px-6 py-16 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Past Events Archive
            </h2>
            <p className="text-gray-300 text-lg">Explore completed voting events and their results</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {completedLoading ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                Loading completed events...
              </div>
            ) : completedError ? (
              <div className="col-span-full text-center py-12 text-red-400">
                {completedError}
              </div>
            ) : completedEvents.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                No completed events found.
              </div>
            ) : (
              completedEvents.map((event, idx) => {
                // Pie chart with blue, red, and white segments
                const radius = 40;
                const centerX = 50;
                const centerY = 50;

                const bluePercent = 50;
                const redPercent = 35;
                const whitePercent = 15;

                let currentAngle = -90;

                const createPath = (percent: number, color: string) => {
                  const angle = (percent / 100) * 360;
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
                    'Z',
                  ].join(' ');

                  currentAngle = endAngle;

                  return { pathData, color };
                };

                const segments = [
                  createPath(bluePercent, '#1e40af'), // Blue
                  createPath(redPercent, '#dc2626'), // Red
                  createPath(whitePercent, '#ffffff'), // White
                ];

                const subtitle =
                  event.description ||
                  `${new Date(event.start_date).toLocaleDateString()} - ${new Date(
                    event.end_date,
                  ).toLocaleDateString()}`;

                return (
                  <div
                    key={event.id ?? idx}
                    className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400 font-semibold uppercase">
                            Completed
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-blue-300 transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-gray-300">{subtitle}</p>
                        <Link href={`/results/${event.id}`} className="mt-4 text-sm text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        <button className="mt-4 text-sm text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                          View Results
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        </Link>
                      </div>
                      <div className="flex-shrink-0 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
                        <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-2xl relative z-10">
                          {segments.map((segment, segIdx) => (
                            <path
                              key={segIdx}
                              d={segment.pathData}
                              fill={segment.color}
                              stroke="#1e293b"
                              strokeWidth="0.5"
                            />
                          ))}
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      

      {/* Secure Private Voting Section */}
      <section className="px-6 py-16 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Secure Private Voting for Organizations
            </h2>
            <p className="text-gray-300 text-lg">Enterprise-grade voting solutions for your organization</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[ 
              { 
                title: 'Private Elections', 
                subtitle: 'Invite Members',
                image: "/vote.png"
              },
              { 
                title: 'Customizable Ballots', 
                subtitle: 'Flexible Voting Options',
                image: "/countries.png"
              },
              { 
                title: 'Secure & Verified', 
                subtitle: 'Identity Protection',
                image: "/verified.png"
              },
            ].map((feature, idx) => (
              <div key={idx} className="group bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 relative overflow-hidden transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300 rounded-2xl"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-300 transition-colors">{feature.title}</h3>
                  <p className="text-gray-300">{feature.subtitle}</p>
                </div>
                <div className="absolute bottom-0 right-0 z-0 opacity-60 group-hover:opacity-80 transition-opacity">
                  <Image 
                    src={feature.image} 
                    alt={feature.title} 
                    width={120} 
                    height={120}
                    className="object-contain transform group-hover:scale-110 transition-transform"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="text-center flex justify-center">
            <button className="px-8 py-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg transition-all font-semibold hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-purple-500/50 transform hover:scale-105">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
    

      {/* How It Works Section */}
      <section className="px-6 py-16 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-gray-300 text-lg">Get started in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Verify Your Identity', subtitle: 'KYC Process', icon: '/verified.png', step: '01' },
              { title: 'Vote on Global Events', subtitle: 'Cast Your Ballot', icon: '/vote.png', step: '02' },
              { title: 'Explore Country Insights', subtitle: 'See Results', icon: '/countries.png', step: '03' },
            ].map((step, idx) => (
              <div key={idx} className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300 rounded-2xl"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                    {step.step}
                  </div>
                  <div className="w-32 h-32 flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                    <Image src={step.icon} alt={step.title} width={120} height={120} className="relative z-10 object-contain group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-300 transition-colors">{step.title}</h3>
                  <p className="text-gray-300">{step.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Past Events Archive Section */}


      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/20">
        <div className="max-w-7xl mx-auto">
          {/* Top Section: Navigation Links */}
          <div className="flex justify-center mb-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
              <a href="/main/about" className="hover:text-white transition">About</a>
              <span className="text-gray-500">|</span>
              <a href="/main/how-it-works" className="hover:text-white transition">How It Works</a>
              <span className="text-gray-500">|</span>
              <a href="/main/blogs" className="hover:text-white transition">Blog</a>
              <span className="text-gray-500">|</span>
              <a href="/main/support" className="hover:text-white transition">Support</a>
              <span className="text-gray-500">|</span>
              <a href="/main/terms" className="hover:text-white transition">Terms</a>
              <span className="text-gray-500">|</span>
              <a href="/main/privacy" className="hover:text-white transition">Privacy</a>
              <span className="text-gray-500">|</span>
              <a href="/main/api" className="hover:text-white transition">API</a>
            </div>
          </div>
          
          {/* Bottom Section: Copyright and Social Icons */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-sm text-gray-400">© {new Date().getFullYear()} GlobalVote</span>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                <span className="text-sm font-bold">f</span>
              </a>
              <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
