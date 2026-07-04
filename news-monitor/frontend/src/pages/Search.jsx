import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api/client';
import ArticleCard from '../components/ArticleCard';
import GeneratePdfButton from '../components/GeneratePdfButton';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'te', label: 'Telugu' },
  { value: 'hi', label: 'Hindi' },
];
const EDITIONS = ['National', 'Andhra Pradesh', 'Telangana', 'Business Edition', 'International Edition'];

export default function Search() {
  const [form, setForm] = useState({
    query: '',
    languages: [],
    editions: [],
    fromDate: '',
    toDate: '',
  });
  const [suggestions, setSuggestions] = useState(null);
  const [results, setResults] = useState(null);

  const suggestQuery = async (q) => {
    setForm((f) => ({ ...f, query: q }));
    if (q.length < 2) return setSuggestions(null);
    const { data } = await api.get('/search/suggestions', { params: { q } });
    setSuggestions(data);
  };

  const searchMutation = useMutation({
    mutationFn: () => api.post('/search', form).then((r) => r.data),
    onSuccess: (data) => setResults(data),
  });

  const toggleMulti = (key, value) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Multilingual Search</h1>
      <p className="text-sm text-gray-500 mb-6">Search across English, Telugu, and Hindi sources — results only appear after you click Search.</p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
        <div className="relative">
          <input
            value={form.query}
            onChange={(e) => suggestQuery(e.target.value)}
            placeholder="Search articles, tags, keywords…"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          {suggestions && (suggestions.tags?.length || suggestions.related?.length) > 0 && (
            <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 w-full p-2 text-xs">
              {suggestions.related?.length > 0 && (
                <div className="mb-1">
                  <span className="text-gray-400">Related: </span>
                  {suggestions.related.map((r) => (
                    <button key={r} onClick={() => setForm((f) => ({ ...f, query: r }))} className="mr-2 text-brand-600 hover:underline">
                      {r}
                    </button>
                  ))}
                </div>
              )}
              {suggestions.tags?.length > 0 && (
                <div>
                  <span className="text-gray-400">Tags: </span>
                  {suggestions.tags.map((t) => (
                    <span key={t} className="mr-2 text-gray-600">#{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Language</p>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                onClick={() => toggleMulti('languages', l.value)}
                className={`px-3 py-1 rounded-full text-xs border ${form.languages.includes(l.value) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Edition</p>
          <div className="flex flex-wrap gap-2">
            {EDITIONS.map((ed) => (
              <button
                key={ed}
                onClick={() => toggleMulti('editions', ed)}
                className={`px-3 py-1 rounded-full text-xs border ${form.editions.includes(ed) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200'}`}
              >
                {ed}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">From Date</p>
            <input type="date" value={form.fromDate} onChange={(e) => setForm((f) => ({ ...f, fromDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">To Date</p>
            <input type="date" value={form.toDate} onChange={(e) => setForm((f) => ({ ...f, toDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <button
          onClick={() => searchMutation.mutate()}
          disabled={searchMutation.isPending}
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-60"
        >
          {searchMutation.isPending ? 'Searching…' : 'Search'}
        </button>
      </div>

      {results && (
        <>
          <p className="text-sm text-gray-500 mb-3">{results.total} result(s) found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.results.map((a) => (
              <ArticleCard key={a._id} article={a} />
            ))}
          </div>
        </>
      )}

      <GeneratePdfButton />
    </div>
  );
}
