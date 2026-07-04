import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import ArticleCard from '../components/ArticleCard';
import GeneratePdfButton from '../components/GeneratePdfButton';

const DEFAULT_CATEGORIES = [
  'Steel', 'Coal', 'Iron Ore', 'RINL', 'Vizag Steel',
  'Manufacturing', 'Mining', 'Government Policies', 'Exports', 'Imports',
];

export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState('');

  const { data, isLoading, error } = useQuery({
    
    queryKey: ['dashboard', activeCategory],
    queryFn: async () => {
  const response = await api.get(
    '/articles/dashboard',
    {
      params: activeCategory
        ? { category: activeCategory }
        : {}
    }
  );
  console.log("news data");
  console.log(response.data);

  return response.data;
},
    
  }
  
);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Today's Industry News</h1>
          <p className="text-sm text-gray-500">Aggregated across all configured news providers</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCategory('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${!activeCategory ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200'}`}
        >
          All
        </button>
        {DEFAULT_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${activeCategory === c ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading today's news…</p>}
      {error && <p className="text-sm text-red-600">Failed to load dashboard: {error.message}</p>}

      {data?.articles?.length === 0 && (
  <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-sm text-gray-500">
    No articles yet for today. The scheduled fetch runs daily at 6:00 AM, or an admin can
    trigger a manual fetch from API configuration.
  </div>
)}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {data?.articles?.map((a) => (
    <ArticleCard key={a._id} article={a} />
  ))}
</div>

      <GeneratePdfButton />
    </div>
  );
}
