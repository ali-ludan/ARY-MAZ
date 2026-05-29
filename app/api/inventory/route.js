import fs from 'fs';
import path from 'path';
import { createClient } from '../../../lib/supabase/server';

function parseCSVRow(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuotes = !inQuotes; continue; }
    if (c === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += c;
  }
  result.push(current.trim());
  return result;
}

function serializeCSVRow(cols) {
  return cols.map(cell => {
    const str = String(cell === null || cell === undefined ? '' : cell);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(',');
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Authenticate user via Supabase session cookie
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Retrieve user role from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'user';
    const csvPath = path.join(process.cwd(), 'data', 'inventory.csv');
    
    if (!fs.existsSync(csvPath)) {
      return new Response('Inventory file not found', { status: 404 });
    }

    const csvText = fs.readFileSync(csvPath, 'utf8');

    if (role === 'admin') {
      // Admin gets full data unmodified
      return new Response(csvText, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    } else {
      // User (Agent) gets filtered/sanitized data:
      // 1. Only 'Available' and 'Hold' status units
      // 2. Sensitive 'pre_launch_price' (cols[9]) is zeroed out
      const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
      const filteredLines = [];
      
      if (lines.length > 0) {
        filteredLines.push(lines[0]); // Keep header row
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = parseCSVRow(line);
        if (cols.length < 9) continue;
        
        const status = cols[3]?.trim();
        // Filter: Keep only Available or Hold units
        if (status !== 'Available' && status !== 'Hold') {
          continue;
        }

        // Sanitize: Zero out pre_launch_price (index 9) to prevent disclosure of developer margins
        if (cols.length > 9) {
          cols[9] = '0';
        }

        filteredLines.push(serializeCSVRow(cols));
      }

      const filteredCSV = filteredLines.join('\n');
      return new Response(filteredCSV, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    }
  } catch (error) {
    console.error('[API Inventory]', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
