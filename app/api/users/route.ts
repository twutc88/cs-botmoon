import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://api-cm.botmoon.com';
const SECRET_KEY = 'ec8930f3-6348-4614-b8e2-72606a69fda2';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page') || '1';
  const pageSize = searchParams.get('page_size') || '100';
  const search = searchParams.get('search') || '';

  try {
    const url = `${BASE_URL}/external/user?secretKey=${SECRET_KEY}&page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CS-Dashboard/1.0',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching users:', error.message || error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

