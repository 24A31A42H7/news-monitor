import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bookmark, ExternalLink } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { toggleArticleSelection } from '../redux/slices/filtersSlice';

export default function ArticleCard({ article }) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const selectedIds = useSelector((s) => s.filters.selectedArticleIds);
  const isSelected = selectedIds.includes(article._id);

  const bookmarkMutation = useMutation({
    mutationFn: () => api.post(`/articles/${article._id}/bookmark`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  return (
    <div className={`bg-white rounded-xl border ${isSelected ? 'border-brand-500 ring-2 ring-brand-100' : 'border-gray-200'} overflow-hidden hover:shadow-md transition flex flex-col`}>
      {article.thumbnail || article.imageUrl ? (
        <img src={article.thumbnail || article.imageUrl} alt="" className="w-full h-36 object-cover" onError={(e) => (e.target.style.display = 'none')} />
      ) : null}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <span className="font-medium text-gray-700">{article.publisher}</span>
          <span>•</span>
          <span>{article.language?.toUpperCase()}</span>
          <span>•</span>
          <span>{new Date(article.publishedDate).toLocaleDateString()}</span>
        </div>
        <h3 className="font-semibold text-sm leading-snug mb-2 line-clamp-2">{article.title}</h3>
        <p className="text-xs text-gray-600 line-clamp-3 mb-3 flex-1">{article.description}</p>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
          <label className="flex items-center gap-1.5 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => dispatch(toggleArticleSelection(article._id))}
              className="rounded"
            />
            Select for PDF
          </label>
          <div className="flex items-center gap-2">
            <button onClick={() => bookmarkMutation.mutate()} className="text-gray-400 hover:text-brand-600">
              <Bookmark size={16} />
            </button>
            <a href={article.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-brand-600">
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
