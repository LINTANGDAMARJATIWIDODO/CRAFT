'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchSortBar, PaginationBar } from '@/components/ui/DataControls';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchEnterpriseLogsAndJobs } from '@/lib/craft-client';
import { formatTimestamp, truncateAddress } from '@/lib/utils';
import { AuditLogEntry } from '@craft/shared';
import { ScrollText } from 'lucide-react';

export default function EnterpriseAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchEnterpriseLogsAndJobs().then((res) => setLogs(res.logs));
  }, []);

  const filtered = useMemo(() => {
    return logs
      .filter((l) => {
        if (categoryFilter !== 'ALL' && l.category !== categoryFilter) return false;
        const q = searchQuery.toLowerCase();
        return (
          !q ||
          l.action.toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const tA = new Date(a.timestamp).getTime();
        const tB = new Date(b.timestamp).getTime();
        return sortBy === 'oldest' ? tA - tB : tB - tA;
      });
  }, [logs, searchQuery, categoryFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-subtle">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
          Enterprise Security &amp; Audit Logs
        </h1>
        <p className="text-sm text-charcoal-400 mt-1">
          Immutable log of authentication challenges, wallet bindings, Council proof submissions, API key lifecycle, and client sign-offs.
        </p>
      </div>

      <SearchSortBar
        searchQuery={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setPage(1);
        }}
        searchPlaceholder="Filter audit logs by action, actor, or details..."
        sortBy={sortBy}
        sortOptions={[
          { label: 'Newest First', value: 'newest' },
          { label: 'Oldest First', value: 'oldest' },
        ]}
        onSortChange={setSortBy}
        rightSlot={
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'AUTH', 'WORKFLOW', 'PROOF', 'APPROVAL', 'API'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategoryFilter(cat);
                  setPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono border ${
                  categoryFilter === cat
                    ? 'bg-forest-900 text-ivory-50 border-forest-600/40'
                    : 'bg-charcoal-900 text-charcoal-400 border-subtle'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        }
      />

      {paginated.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No Audit Logs Recorded"
          description="Actions across authentication, Agent Council runs, API keys, and approvals will populate here automatically."
        />
      ) : (
        <Card className="bg-charcoal-900 border-subtle overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs font-mono">
              <thead className="bg-charcoal-950 border-b border-subtle text-charcoal-400 text-[11px]">
                <tr>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4">ACTION</th>
                  <th className="py-3 px-4">ACTOR</th>
                  <th className="py-3 px-4">DETAILS</th>
                  <th className="py-3 px-4 text-right">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {paginated.map((l) => (
                  <tr key={l.id} className="hover:bg-charcoal-850/40">
                    <td className="py-3 px-4">
                      <Badge variant={l.severity === 'warning' ? 'warning' : 'outline'} size="sm">
                        {l.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-ivory-100 font-semibold">{l.action}</td>
                    <td className="py-3 px-4 text-forest-300">{truncateAddress(l.actor, 6)}</td>
                    <td className="py-3 px-4 text-charcoal-300 font-sans max-w-md">{l.details}</td>
                    <td className="py-3 px-4 text-right text-charcoal-400">{formatTimestamp(l.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <PaginationBar page={page} totalPages={totalPages} totalItems={filtered.length} onPageChange={setPage} />
          </div>
        </Card>
      )}
    </div>
  );
}
