'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { fetchDeveloperPortalData } from '@/lib/craft-client';
import { KeyRound, ArrowRight, BarChart3, ShieldCheck } from 'lucide-react';

export default function EnterpriseApiManagementPage() {
  const [keysCount, setKeysCount] = React.useState(0);
  const [usage, setUsage] = React.useState<any[]>([]);

  useEffect(() => {
    fetchDeveloperPortalData().then((res) => {
      setKeysCount(res.keys.filter((k) => !k.revoked).length);
      setUsage(res.usage);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
            Enterprise API Management
          </h1>
          <p className="text-sm text-charcoal-400 mt-1">
            Central governance over REST API keys, rate telemetry, and webhook security boundaries.
          </p>
        </div>
        <Link href="/developers">
          <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Manage Keys in Developer Hub
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <Card className="bg-charcoal-900 border-subtle p-5">
          <span className="text-charcoal-400 block">ACTIVE API KEYS</span>
          <span className="text-2xl font-bold text-ivory-50 mt-1 block">{keysCount}</span>
        </Card>
        <Card className="bg-charcoal-900 border-subtle p-5">
          <span className="text-charcoal-400 block">KEY STORAGE SECURITY</span>
          <span className="text-emerald-400 font-bold mt-1 block">SHA-256 One-Way Hash</span>
        </Card>
        <Card className="bg-charcoal-900 border-subtle p-5">
          <span className="text-charcoal-400 block">WEBHOOK GUARD</span>
          <span className="text-forest-300 font-bold mt-1 block">SSRF Protected</span>
        </Card>
      </div>

      <Card className="bg-charcoal-900 border-subtle overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-subtle flex items-center gap-2 text-sm font-semibold text-ivory-100">
          <BarChart3 className="w-4 h-4 text-forest-400" />
          Live Endpoint Traffic Breakdown
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-xs font-mono">
            <thead className="bg-charcoal-950 border-b border-subtle text-charcoal-400 text-[11px]">
              <tr>
                <th className="py-3 px-4">ENDPOINT</th>
                <th className="py-3 px-4">CALLS</th>
                <th className="py-3 px-4">AVG LATENCY</th>
                <th className="py-3 px-4 text-right">ERRORS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {usage.map((u) => (
                <tr key={u.endpoint}>
                  <td className="py-3 px-4 text-forest-300">{u.endpoint}</td>
                  <td className="py-3 px-4 text-ivory-100 font-bold">{u.callsTotal}</td>
                  <td className="py-3 px-4 text-ivory-200">{u.avgLatencyMs}ms</td>
                  <td className="py-3 px-4 text-right text-charcoal-300">{u.errorRatePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
