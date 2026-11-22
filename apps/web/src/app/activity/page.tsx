'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { truncateAddress } from '@/lib/utils';
import { OFFICIAL_AGENT_ID_CONTRACT } from '@/lib/constants';
import {
  Activity,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Layers,
  Sparkles,
} from 'lucide-react';

interface BlockchainEvent {
  id: string;
  eventName: 'TaskApproved' | 'ProofSubmitted' | 'TaskStarted' | 'TaskAccepted' | 'TaskCreated' | 'RevisionRequested';
  taskId: string;
  txHash: string;
  blockNumber: number;
  wallet: string;
  timestamp: string;
  status: 'Confirmed' | 'Finalized';
}

const SAMPLE_EVENTS: BlockchainEvent[] = [
  {
    id: 'evt-001',
    eventName: 'TaskApproved',
    taskId: 'task-craft-001',
    txHash: '0x9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
    blockNumber: 38491024,
    wallet: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
    timestamp: '2024-03-05T10:15:00Z',
    status: 'Finalized',
  },
  {
    id: 'evt-002',
    eventName: 'ProofSubmitted',
    taskId: 'task-craft-001',
    txHash: '0x8899aabbccddeeff00112233445566778899aabbccddeeff0011223344556677',
    blockNumber: 38490980,
    wallet: '0x1A29c54C4c1fF7a79e60241b3127C5d7e57c6643',
    timestamp: '2024-03-05T09:34:40Z',
    status: 'Finalized',
  },
  {
    id: 'evt-003',
    eventName: 'ProofSubmitted',
    taskId: 'task-craft-002',
    txHash: '0xaa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    blockNumber: 38492110,
    wallet: '0x3D4fC44E3a2c2b09a93D5737199182C0E858D65F',
    timestamp: '2024-03-06T11:16:45Z',
    status: 'Confirmed',
  },
  {
    id: 'evt-004',
    eventName: 'TaskStarted',
    taskId: 'task-craft-003',
    txHash: '0x554433221100aabbccddeeff00112233445566778899aabbccddeeff00112233',
    blockNumber: 38493400,
    wallet: '0x7e84F14704B184c7E75691F6211833eB937f1e67',
    timestamp: '2024-03-06T14:06:15Z',
    status: 'Confirmed',
  },
  {
    id: 'evt-005',
    eventName: 'TaskCreated',
    taskId: 'task-craft-004',
    txHash: '0x77889900aabbccddeeff112233445566778899aabbccddeeff00112233445566',
    blockNumber: 38494105,
    wallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    timestamp: '2024-03-06T15:20:00Z',
    status: 'Confirmed',
  },
];

export default function ActivityPage() {
  const getEventBadge = (name: BlockchainEvent['eventName']) => {
    switch (name) {
      case 'TaskApproved':
        return <Badge variant="success" size="sm">TaskApproved</Badge>;
      case 'ProofSubmitted':
        return <Badge variant="bnb" size="sm">ProofSubmitted</Badge>;
      case 'TaskStarted':
        return <Badge variant="default" size="sm">TaskStarted</Badge>;
      case 'TaskAccepted':
        return <Badge variant="default" size="sm">TaskAccepted</Badge>;
      case 'TaskCreated':
        return <Badge variant="outline" size="sm">TaskCreated</Badge>;
      default:
        return <Badge size="sm">{name}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
              On-Chain State Ledger
            </h1>
            <Badge variant="bnb" size="sm">
              BNB Chain (56)
            </Badge>
          </div>
          <p className="text-sm text-charcoal-400 mt-1">
            Verifiable chronological log of state transitions committed to the TaskRegistry smart contract.
          </p>
        </div>

        <a
          href={`https://bscscan.com/address/${OFFICIAL_AGENT_ID_CONTRACT}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
            Inspect Agent ID on BscScan
          </Button>
        </a>
      </div>

      {/* Contract Anchor Metadata Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-charcoal-900 border-subtle p-4 font-mono text-xs">
          <span className="text-charcoal-500 uppercase block text-[10px]">Smart Contract</span>
          <span className="text-ivory-100 font-bold block mt-1">TaskRegistry.sol</span>
          <span className="text-forest-400 text-[11px] block mt-0.5">OpenZeppelin Standard</span>
        </Card>
        <Card className="bg-charcoal-900 border-subtle p-4 font-mono text-xs">
          <span className="text-charcoal-500 uppercase block text-[10px]">Binance Agent ID Gate</span>
          <span className="text-ivory-100 font-bold block mt-1">BEP-721 Interface</span>
          <span className="text-forest-400 text-[11px] block mt-0.5">0x60b9...022f</span>
        </Card>
        <Card className="bg-charcoal-900 border-subtle p-4 font-mono text-xs">
          <span className="text-charcoal-500 uppercase block text-[10px]">Consensus Protocol</span>
          <span className="text-ivory-100 font-bold block mt-1">Proof-of-Staked-Authority (PoSA)</span>
          <span className="text-emerald-400 text-[11px] block mt-0.5">3-second block finality</span>
        </Card>
      </div>

      {/* Events Table */}
      <Card className="bg-charcoal-900 border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-charcoal-950/80 border-b border-subtle text-charcoal-400 text-[11px]">
              <tr>
                <th className="py-3 px-4">EVENT</th>
                <th className="py-3 px-4">TASK ID</th>
                <th className="py-3 px-4">SIGNER / WALLET</th>
                <th className="py-3 px-4">BLOCK</th>
                <th className="py-3 px-4">TX HASH</th>
                <th className="py-3 px-4 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {SAMPLE_EVENTS.map((evt) => (
                <tr key={evt.id} className="hover:bg-charcoal-850/50 transition-colors">
                  <td className="py-3.5 px-4">
                    {getEventBadge(evt.eventName)}
                  </td>
                  <td className="py-3.5 px-4 text-ivory-200">
                    {evt.taskId}
                  </td>
                  <td className="py-3.5 px-4 text-charcoal-300">
                    {truncateAddress(evt.wallet, 4)}
                  </td>
                  <td className="py-3.5 px-4 text-charcoal-400">
                    #{evt.blockNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <a
                      href={`https://bscscan.com/tx/${evt.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-forest-400 hover:text-forest-300 flex items-center gap-1"
                    >
                      {truncateAddress(evt.txHash, 6)} <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="text-emerald-400 flex items-center justify-end gap-1 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" />
                      {evt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
