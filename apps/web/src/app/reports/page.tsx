'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge, TaskStateBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchSortBar, PaginationBar } from '@/components/ui/DataControls';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchTasksUnified } from '@/lib/craft-client';
import { formatTimestamp, truncateAddress } from '@/lib/utils';
import { TaskRecord } from '@craft/shared';
import { FileText, ArrowRight, ShieldCheck, SearchCheck } from 'lucide-react';

export default function ReportsArchivePage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    fetchTasksUnified().then((res) => {
      setTasks(res.tasks.filter((t) => Boolean(t.report)));
    });
  }, []);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => {
        const q = searchQuery.toLowerCase();
        return (
          !q ||
          t.title.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (t.report?.executiveSummary || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const tA = new Date(a.createdAt).getTime();
        const tB = new Date(b.createdAt).getTime();
        return sortBy === 'oldest' ? tA - tB : tB - tA;
      });
  }, [tasks, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
            Verified Analytical Reports
          </h1>
          <p className="text-sm text-charcoal-400 mt-1">
            Structured AI deliverables sealed with deterministic SHA-256 calculation evidence.
          </p>
        </div>
        <Link href="/mission">
          <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Generate New Report
          </Button>
        </Link>
      </div>

      <SearchSortBar
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setPage(1);
        }}
        searchPlaceholder="Search reports by title, executive summary, or Task ID..."
        sortBy={sortBy}
        sortOptions={[
          { label: 'Newest Reports', value: 'newest' },
          { label: 'Oldest Reports', value: 'oldest' },
        ]}
        onSortChange={setSortBy}
      />

      {paginated.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Reports Found"
          description="Run a CRAFT Live Mission or create an analytical task to generate verifiable structured reports."
        />
      ) : (
        <div className="space-y-4">
          {paginated.map((t) => (
            <Card key={t.id} hoverEffect className="bg-charcoal-900 border-subtle p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <TaskStateBadge state={t.status} />
                  <Badge variant={t.isDemo ? 'outline' : 'success'} size="sm">
                    {t.isDemo ? 'Sample Seed' : 'Live Generated'}
                  </Badge>
                  <span className="text-xs font-mono text-charcoal-400">
                    {t.id} • {formatTimestamp(t.report?.generatedAt || t.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {t.outputProofHash && (
                    <Link href={`/trust?q=${encodeURIComponent(t.outputProofHash)}`}>
                      <Button variant="outline" size="sm" leftIcon={<SearchCheck className="w-3.5 h-3.5" />}>
                        Verify Proof
                      </Button>
                    </Link>
                  )}
                  <Link href={`/tasks/${t.id}/review`}>
                    <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Open Report
                    </Button>
                  </Link>
                </div>
              </div>

              <h3 className="text-base font-semibold text-ivory-100">{t.title}</h3>
              <p className="text-xs text-charcoal-300 leading-relaxed line-clamp-2">
                {t.report?.executiveSummary}
              </p>

              <div className="pt-2 border-t border-subtle flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-charcoal-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Proof Hash: {truncateAddress(t.outputProofHash || '', 10)}
                </span>
                <span>Dataset: {t.datasetFileName} ({t.datasetRowCount} rows)</span>
              </div>
            </Card>
          ))}
          <PaginationBar page={page} totalPages={totalPages} totalItems={filtered.length} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
