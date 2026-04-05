"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PER_PAGE_OPTIONS = [25, 50, 100] as const;

type PaginationProps = {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

/** Computes the list of page tokens to render, inserting null for ellipsis gaps. */
function getPageTokens(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const tokens: (number | null)[] = [];
  const add = (n: number) => tokens.push(n);
  const gap = () => tokens.push(null);

  add(1);
  if (current > 3) gap();
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    add(p);
  }
  if (current < total - 2) gap();
  add(total);

  return tokens;
}

function GoToPage({ totalPages, onPageChange }: { totalPages: number; onPageChange: (p: number) => void }) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      onPageChange(n);
    }
    setDraft("");
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-xs text-white/25">go to</span>
      <input
        type="number"
        min={1}
        max={totalPages}
        value={draft}
        placeholder={String(totalPages)}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        onBlur={commit}
        className="w-12 text-xs text-center text-white/50 bg-white/[0.04] border border-white/[0.07] rounded-lg px-1 py-1 outline-none focus:border-white/20 focus:text-white/70 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </div>
  );
}

export function Pagination({ page, perPage, total, onPageChange, onPerPageChange }: PaginationProps) {
  if (total === 0) return null;

  const totalPages = Math.ceil(total / perPage);
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const tokens = getPageTokens(page, totalPages);

  return (
    <div className="flex items-center justify-between gap-4 mt-6 px-1">
      {/* Items range */}
      <span className="text-xs text-white/30 tabular-nums shrink-0">
        {from}–{to} of {total}
      </span>

      {/* Page buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/65 hover:bg-white/[0.05] disabled:opacity-25 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {tokens.map((token, i) =>
            token === null ? (
              <span key={`gap-${i}`} className="w-7 text-center text-xs text-white/20">
                …
              </span>
            ) : (
              <button
                key={token}
                onClick={() => onPageChange(token)}
                className={`w-7 h-7 rounded-lg text-xs transition-colors ${
                  token === page
                    ? "bg-white/[0.09] text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "text-white/35 hover:text-white/65 hover:bg-white/[0.05]"
                }`}
              >
                {token}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/65 hover:bg-white/[0.05] disabled:opacity-25 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Right controls: go-to input + per-page selector */}
      <div className="flex items-center gap-4 shrink-0">
        {totalPages > 1 && (
          <GoToPage totalPages={totalPages} onPageChange={onPageChange} />
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/25">per page</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="text-xs text-white/50 bg-white/[0.04] border border-white/[0.07] rounded-lg px-2 py-1 cursor-pointer hover:bg-white/[0.07] hover:text-white/70 transition-colors outline-none appearance-none pr-6 bg-[right_0.4rem_center] bg-no-repeat"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            }}
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n} className="bg-[#0a1020] text-white/70">
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
