import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import ArticleCard from '../components/ArticleCard';
import GeneratePdfButton from '../components/GeneratePdfButton';

export default function Bookmarks() {
  const { data, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.get('/articles/me/bookmarks').then((r) => r.data),
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Bookmarked Articles</h1>
      <p className="text-sm text-gray-500 mb-6">Articles you've saved for later reference.</p>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {data && data.length === 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-sm text-gray-500">
          No bookmarks yet. Use the bookmark icon on any article to save it here.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data?.filter(Boolean).map((a) => (
          <ArticleCard key={a._id} article={a} />
        ))}
      </div>
      <GeneratePdfButton />
    </div>
  );
}
