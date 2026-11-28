import { Request, Response } from 'express';
import { MissionStreamEvent } from '@craft/shared';

class MissionSseBroker {
  private clients = new Set<Response>();
  private recentEvents: MissionStreamEvent[] = [];

  emitEvent(event: Omit<MissionStreamEvent, 'id' | 'timestamp'>): MissionStreamEvent {
    const full: MissionStreamEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    this.recentEvents.unshift(full);
    if (this.recentEvents.length > 40) {
      this.recentEvents = this.recentEvents.slice(0, 40);
    }

    const payload = `event: mission\ndata: ${JSON.stringify(full)}\n\n`;
    for (const client of Array.from(this.clients)) {
      try {
        client.write(payload);
      } catch {
        this.clients.delete(client);
      }
    }

    return full;
  }

  getRecentEvents(limit = 30): MissionStreamEvent[] {
    return this.recentEvents.slice(0, limit);
  }

  attachClient(req: Request, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    this.clients.add(res);

    // Send bootstrap snapshot so reconnects see latest events
    const replay = [...this.recentEvents].reverse().slice(-15);
    res.write(`event: snapshot\ndata: ${JSON.stringify(replay)}\n\n`);

    const keepAlive = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(keepAlive);
        this.clients.delete(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(keepAlive);
      this.clients.delete(res);
    });
  }
}

export const missionSseBroker = new MissionSseBroker();
