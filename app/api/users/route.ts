import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://api-cm.botmoon.com';
const SECRET_KEY = 'ec8930f3-6348-4614-b8e2-72606a69fda2';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page') || '1';
  const pageSize = searchParams.get('page_size') || '100';
  const search = searchParams.get('search') || '';
  const leadStage = searchParams.get('lead_stage') || '';
  const botStatus = searchParams.get('bot_status') || '';
  const payment = searchParams.get('payment') || '';
  const packageFilter = searchParams.get('package') || '';

  try {
    const params = new URLSearchParams({
      secretKey: SECRET_KEY,
      page: page,
      page_size: pageSize,
      search: search,
    });
    
    if (leadStage) params.append('lead_stage', leadStage);
    if (botStatus) params.append('bot_status', botStatus);
    if (payment) params.append('payment', payment);
    if (packageFilter) params.append('package', packageFilter);
    
    const url = `${BASE_URL}/external/user?${params.toString()}`;
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

