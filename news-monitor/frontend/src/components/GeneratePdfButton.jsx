import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { FileDown } from 'lucide-react';
import api from '../api/client';
import { clearSelection } from '../redux/slices/filtersSlice';

export default function GeneratePdfButton() {
  const selectedIds = useSelector((s) => s.filters.selectedArticleIds);
  const dispatch = useDispatch();
  const [downloadUrl, setDownloadUrl] = useState(null);

  const mutation = useMutation({
    mutationFn: () => api.post('/reports/generate', { articleIds: selectedIds }),
    onSuccess: ({ data }) => {
      setDownloadUrl(data.downloadUrl);
      dispatch(clearSelection());
    },
  });

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-white shadow-xl rounded-xl border border-gray-200 p-4 flex items-center gap-3 z-20">
      <span className="text-sm text-gray-700">{selectedIds.length} article(s) selected</span>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
      >
        <FileDown size={16} />
        {mutation.isPending ? 'Generating…' : 'Generate PDF'}
      </button>
      {downloadUrl && (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-brand-700 underline"
        >
          Download
        </a>
      )}
    </div>
  );
}
