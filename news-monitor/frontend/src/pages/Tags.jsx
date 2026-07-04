import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import api from '../api/client';

export default function Tags() {
  const [newTag, setNewTag] = useState('');
  const queryClient = useQueryClient();

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags').then((r) => r.data),
  });
  const { data: trending } = useQuery({
    queryKey: ['tags-trending'],
    queryFn: () => api.get('/tags/trending').then((r) => r.data),
  });

  const createTag = useMutation({
    mutationFn: (name) => api.post('/tags', { name }),
    onSuccess: () => {
      setNewTag('');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const removeTag = useMutation({
    mutationFn: (id) => api.delete(`/tags/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Tags & Categories</h1>
      <p className="text-sm text-gray-500 mb-6">Create custom tags to personalize your news feed and searches.</p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex gap-2">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && newTag.trim() && createTag.mutate(newTag)}
            placeholder="e.g. Hydrogen Steel"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm"
          />
          <button
            onClick={() => newTag.trim() && createTag.mutate(newTag)}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Plus size={16} /> Add Tag
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">All Tags</h2>
          <div className="flex flex-wrap gap-2">
            {tags?.map((t) => (
              <span key={t._id} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-xs">
                {t.name}
                <button onClick={() => removeTag.mutate(t._id)} className="text-gray-400 hover:text-red-600">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Trending Tags</h2>
          <div className="space-y-2">
            {trending?.map((t) => (
              <div key={t._id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs">
                <span>{t.name}</span>
                <span className="text-gray-400">{t.searchCount} searches</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
