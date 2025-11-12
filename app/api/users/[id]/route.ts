import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://api-cm.botmoon.com';
const SECRET_KEY = 'ec8930f3-6348-4614-b8e2-72606a69fda2';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const url = `${BASE_URL}/external/user/detail?secretKey=${SECRET_KEY}&user_id=${id}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CS-Dashboard/1.0',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching user detail:', error.message || error);
    return NextResponse.json(
      { error: 'Failed to fetch user detail', details: error.message },
      { status: 500 }
    );
  }
}

