'use client';

import { useState } from 'react';

interface PredictionInfoProps {
  title: string;
  prediction: string;
  explanation: string;
}

export default function PredictionInfo({ title, prediction, explanation }: PredictionInfoProps) {
  const [open, setOpen] = useState(false);

  if (!prediction) return null;

  return (
    <div className="relative">
      <div className="flex items-start gap-2">
        <p className="text-sm text-gray-700 flex-1">{prediction}</p>
        {explanation && (
          <button
            onClick={() => setOpen(!open)}
            className="flex-shrink-0 w-6 h-6 rounded-full bg-[#004D98] text-white text-xs font-bold flex items-center justify-center hover:bg-[#003a75] transition-colors"
            aria-label="More info"
            title="See AI analysis"
          >
            i
          </button>
        )}
      </div>

      {open && explanation && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-[#1A1A2E] text-lg">{title}</h3>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                &times;
              </button>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-[#004D98]">{prediction}</p>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
            <p className="text-xs text-gray-400 mt-4 italic">
              Powered by AI analysis. Predictions are based on current statistics and may not reflect actual results.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
