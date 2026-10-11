import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_FILE = join(process.cwd(), 'dashboard-data.json');

export function getDashboardData() {
  if (!existsSync(DATA_FILE)) {
    return {
      lastUpdate: new Date().toISOString(),
      totalLeads: 0,
      emails: { email1: 0, email2: 0, email3: 0, total: 0 },
      whatsapp: { today: 0, total: 0 },
      responses: 0,
      pending: 0,
      daily: [],
      topNeighborhoods: [],
      recentLeads: [],
      funnel: { leads: 0, email1: 0, email2: 0, email3: 0, responded: 0 },
    };
  }
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return null;
  }
}
