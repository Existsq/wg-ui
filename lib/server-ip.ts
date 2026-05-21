import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
let cached: { ip: string; ts: number } | null = null;
const TTL = 3_600_000;

export async function getServerIP(): Promise<string> {
  if (cached && Date.now() - cached.ts < TTL) return cached.ip;
  const { stdout } = await execAsync('curl -4 -s icanhazip.com');
  const ip = stdout.trim();
  cached = { ip, ts: Date.now() };
  return ip;
}
