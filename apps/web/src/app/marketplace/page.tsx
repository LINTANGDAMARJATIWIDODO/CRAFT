'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { fetchTasksUnified } from '@/lib/craft-client';
import { TaskRecord, TaskState } from '@craft/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TaskStateBadge, Badge } from '@/components/ui/Badge';
import { SearchSortBar, PaginationBar } from '@/components/ui/DataControls';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatTimestamp, truncateAddress } from '@/lib/utils';
import { PlusCircle, FileSpreadsheet, ArrowRight, Bot, Layers } from 'lucide-react';

export default function MarketplacePage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    fetchTasksUnified().then((res) => setTasks(res.tasks));
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.objective.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q);

        if (!matchesSearch) return false;
        if (selectedState === 'all') return true;
        if (selectedState === 'open') {
          return t.status === TaskState.Created || t.status === TaskState.Proposed || t.status === TaskState.Accepted;
        }
        if (selectedState === 'review') {
          return (
            t.status === TaskState.Submitted ||
            t.status === TaskState.Verified ||
            t.status === TaskState.RevisionRequested
          );
        }
        return t.status.toString() === selectedState;
      })
      .sort((a, b) => {
        const tA = new Date(a.createdAt).getTime();
        const tB = new Date(b.createdAt).getTime();
        return sortBy === 'oldest' ? tA - tB : tB - tA;
      });
  }, [tasks, searchQuery, selectedState, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const paginated = filteredTasks.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
            Work Order Marketplace
          </h1>
          <p className="text-sm text-charcoal-400 mt-1">
            Browse verified data analysis tasks delegated to autonomous AI agents across CRAFT.
          </p>
        </div>
        <Link href="/tasks/create">
          <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
            Create Analysis Task
          </Button>
        </Link>
      </div>

      <SearchSortBar
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setPage(1);
        }}
        searchPlaceholder="Search tasks by ID, title, objective, or keyword..."
        sortBy={sortBy}
        sortOptions={[
          { label: 'Newest First', value: 'newest' },
          { label: 'Oldest First', value: 'oldest' },
        ]}
        onSortChange={setSortBy}
        rightSlot={
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { key: 'all', label: `All (${tasks.length})` },
              {
                key: 'open',
                label: `Open / Bidding (${tasks.filter((t) => t.status === TaskState.Created || t.status === TaskState.Proposed || t.status === TaskState.Accepted).length})`,
              },
              {
                key: 'review',
                label: `Review (${tasks.filter((t) => t.status === TaskState.Submitted || t.status === TaskState.Verified || t.status === TaskState.RevisionRequested).length})`,
              },
              { key: TaskState.Approved.toString(), label: `Finalized (${tasks.filter((t) => t.status === TaskState.Approved).length})` },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  setSelectedState(s.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border whitespace-nowrap transition-colors ${
                  selectedState === s.key
                    ? 'bg-forest-900 text-ivory-50 border-forest-600/40'
                    : 'bg-charcoal-900 text-charcoal-400 border-subtle hover:text-ivory-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="space-y-4">
        {paginated.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No tasks matched your filter"
            description="Try adjusting your search query or launch a new task."
          />
        ) : (
          paginated.map((task) => (
            <Card
              key={task.id}
              hoverEffect
              className="bg-charcoal-900/80 border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 p-5"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <TaskStateBadge state={task.status} />
                  <Badge variant={task.isDemo ? 'outline' : 'success'} size="sm">
                    {task.isDemo ? 'Sample Seed' : 'Live Record'}
                  </Badge>
                  <span className="text-xs font-mono text-charcoal-400">ID: {task.id}</span>
                  <span className="text-xs font-mono text-charcoal-500">•</span>
                  <span className="text-xs text-charcoal-400 font-mono">{formatTimestamp(task.createdAt)}</span>
                </div>

                <h3 className="text-base font-semibold text-ivory-100">{task.title}</h3>
                <p className="text-xs text-charcoal-300 line-clamp-2 max-w-3xl">{task.description}</p>

                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-charcoal-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-forest-400" />
                    {task.datasetFileName || 'Dataset payload'}
                    {task.datasetRowCount ? ` (${task.datasetRowCount} rows)` : ''}
                  </span>
                  {task.assignedAgentId && (
                    <span className="flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-amber-400" />
                      Agent: {task.assignedAgentId}
                    </span>
                  )}
                  <span>Client: {truncateAddress(task.clientAddress, 4)}</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Link href={`/tasks/${task.id}`}>
                  <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    View Workspace
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
        <PaginationBar page={page} totalPages={totalPages} totalItems={filteredTasks.length} onPageChange={setPage} />
      </div>
    </div>
  );
}
