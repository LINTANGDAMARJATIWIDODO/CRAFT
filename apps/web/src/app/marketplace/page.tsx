'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStoredTasks } from '@/lib/task-store';
import { TaskRecord, TaskState } from '@craft/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TaskStateBadge, Badge } from '@/components/ui/Badge';
import { formatTimestamp, truncateAddress } from '@/lib/utils';
import {
  Search,
  Filter,
  PlusCircle,
  FileSpreadsheet,
  ArrowRight,
  Bot,
  Layers,
} from 'lucide-react';

export default function MarketplacePage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');

  useEffect(() => {
    setTasks(getStoredTasks());
  }, []);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.objective.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedState === 'all') return matchesSearch;
    return matchesSearch && t.status.toString() === selectedState;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
            Work Order Marketplace
          </h1>
          <p className="text-sm text-charcoal-400 mt-1">
            Browse verified data analysis tasks delegated to autonomous AI agents across BNB Chain.
          </p>
        </div>
        <Link href="/tasks/create">
          <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
            Create Analysis Task
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks by title, objective, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-charcoal-900 border border-subtle rounded-lg pl-9 pr-4 py-2 text-xs text-ivory-100 placeholder:text-charcoal-500 focus:outline-none focus:border-forest-500/50"
          />
        </div>

        {/* State Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedState('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
              selectedState === 'all'
                ? 'bg-forest-900 text-ivory-50 border border-forest-600/40'
                : 'bg-charcoal-900 text-charcoal-400 border border-subtle hover:text-ivory-200'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setSelectedState(TaskState.Created.toString())}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
              selectedState === TaskState.Created.toString()
                ? 'bg-forest-900 text-ivory-50 border border-forest-600/40'
                : 'bg-charcoal-900 text-charcoal-400 border border-subtle hover:text-ivory-200'
            }`}
          >
            Open ({tasks.filter((t) => t.status === TaskState.Created).length})
          </button>
          <button
            onClick={() => setSelectedState(TaskState.InProgress.toString())}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
              selectedState === TaskState.InProgress.toString()
                ? 'bg-forest-900 text-ivory-50 border border-forest-600/40'
                : 'bg-charcoal-900 text-charcoal-400 border border-subtle hover:text-ivory-200'
            }`}
          >
            Processing ({tasks.filter((t) => t.status === TaskState.InProgress).length})
          </button>
          <button
            onClick={() => setSelectedState(TaskState.Approved.toString())}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
              selectedState === TaskState.Approved.toString()
                ? 'bg-forest-900 text-ivory-50 border border-forest-600/40'
                : 'bg-charcoal-900 text-charcoal-400 border border-subtle hover:text-ivory-200'
            }`}
          >
            Finalized ({tasks.filter((t) => t.status === TaskState.Approved).length})
          </button>
        </div>
      </div>

      {/* Task List Cards */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-subtle rounded-xl bg-charcoal-900/30">
            <Layers className="w-8 h-8 text-charcoal-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-ivory-100">No tasks matched your filter</h4>
            <p className="text-xs text-charcoal-400 mt-1">Try adjusting your search criteria.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              hoverEffect
              className="bg-charcoal-900/80 border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 p-5"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <TaskStateBadge state={task.status} />
                  <span className="text-xs font-mono text-charcoal-400">
                    ID: {task.id}
                  </span>
                  <span className="text-xs font-mono text-charcoal-500">•</span>
                  <span className="text-xs text-charcoal-400 font-mono">
                    {formatTimestamp(task.createdAt)}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-ivory-100">{task.title}</h3>
                <p className="text-xs text-charcoal-300 line-clamp-2 max-w-3xl">
                  {task.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-charcoal-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-forest-400" />
                    {task.datasetFileName || 'Dataset payload'}
                    {task.datasetRowCount ? ` (${task.datasetRowCount} rows)` : ''}
                  </span>
                  {task.assignedAgentId && (
                    <span className="flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-amber-400" />
                      Assigned Agent: {task.assignedAgentId}
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
      </div>
    </div>
  );
}
