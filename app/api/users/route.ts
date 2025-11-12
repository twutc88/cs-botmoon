import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://api-cm.botmoon.com';
const SECRET_KEY = 'ec8930f3-6348-4614-b8e2-72606a69fda2';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page') || '1';
  const pageSize = searchParams.get('page_size') || '100';
  const search = searchParams.get('search') || '';

  try {
    const url = `${BASE_URL}/external/user?secretKey=${SECRET_KEY}&page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

