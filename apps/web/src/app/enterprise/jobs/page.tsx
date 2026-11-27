'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { API_BASE, fetchEnterpriseLogsAndJobs } from '@/lib/craft-client';
import { RecurringJobConfig } from '@craft/shared';
import { Clock, Play, ArrowRight, AlertCircle } from 'lucide-react';

export default function EnterpriseRecurringJobsPage() {
  const { notify } = useToast();
  const [jobs, setJobs] = useState<RecurringJobConfig[]>([]);
  const [name, setName] = useState('');
  const [cron, setCron] = useState('0 2 * * *');

  useEffect(() => {
    fetchEnterpriseLogsAndJobs().then((res) => setJobs(res.jobs));
  }, []);

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/enterprise/recurring-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, workflowId: 'wf-template-council-audit', scheduleCron: cron }),
      });
      if (res.ok) {
        const data = await res.json();
        setJobs((prev) => [data.job, ...prev]);
        setName('');
        notify({
          title: 'Schedule Saved (Coming Soon Keeper)',
          description: 'Run manually anytime inside Visual Workflow Studio.',
          variant: 'info',
        });
      }
    } catch {
      notify({ title: 'API Offline', description: 'Start API server on port 4000 to persist schedules.', variant: 'warning' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
              Enterprise Recurring Jobs
            </h1>
            <Badge variant="warning" size="sm">
              Autonomous Keeper: Coming Soon
            </Badge>
          </div>
          <p className="text-sm text-charcoal-400 mt-1">
            Configure recurring cron analytics schedules. Autonomous unattended execution is labeled Coming Soon; trigger pipelines manually anytime in Workflow Studio.
          </p>
        </div>
        <Link href="/studio">
          <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Run Now in Workflow Studio
          </Button>
        </Link>
      </div>

      <Card className="bg-charcoal-900 border-subtle p-5 space-y-4">
        <h3 className="text-sm font-semibold text-ivory-100">Configure New Recurring Job</h3>
        <form onSubmit={handleSaveJob} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            required
            placeholder="Job Name (e.g. Weekly Margin Reconciliation)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-charcoal-950 border border-subtle rounded-lg px-3 py-2 text-xs text-ivory-100"
          />
          <input
            type="text"
            required
            value={cron}
            onChange={(e) => setCron(e.target.value)}
            placeholder="Cron expression (0 2 * * *)"
            className="bg-charcoal-950 border border-subtle rounded-lg px-3 py-2 text-xs text-ivory-100 font-mono"
          />
          <Button type="submit" variant="secondary" size="md">
            Save Recurring Definition
          </Button>
        </form>
      </Card>

      <div className="space-y-3">
        {jobs.map((job) => (
          <Card key={job.id} className="bg-charcoal-900 border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-forest-400" />
                <span className="text-sm font-semibold text-ivory-100">{job.name}</span>
                <Badge variant="warning" size="sm">
                  {job.status === 'coming_soon' ? 'Coming Soon' : 'Paused'}
                </Badge>
              </div>
              <p className="text-xs font-mono text-charcoal-400">
                Cron: {job.scheduleCron} • {job.nextRunLabel}
              </p>
              <p className="text-[11px] text-charcoal-400">{job.requiresOnChainAutomationNote}</p>
            </div>
            <Link href="/studio">
              <Button variant="outline" size="sm" leftIcon={<Play className="w-3.5 h-3.5" />}>
                Run Manually
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
