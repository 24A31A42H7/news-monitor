import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download } from 'lucide-react';
import api from '../api/client';

export default function Reports() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => api.get('/reports/me').then((r) => r.data),
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">My PDF Reports</h1>
      <p className="text-sm text-gray-500 mb-6">History of previously generated reports.</p>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {data && data.length === 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-sm text-gray-500">
          No reports generated yet. Select articles from the Dashboard or Search page and click
          "Generate PDF".
        </div>
      )}

      <div className="space-y-3">
        {data?.map((r) => (
          <div key={r._id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                <FileText className="text-brand-600" size={18} />
              </div>
              <div>
                <p className="font-medium text-sm">{r.title}</p>
                <p className="text-xs text-gray-500">
                  {r.articleCount} article(s) • {new Date(r.generatedAt).toLocaleString()} • {(r.fileSize / 1024).toFixed(0)} KB
                </p>
              </div>
            </div>
            <a href={r.filePath} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700">
              <Download size={16} /> Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
