import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://api-cm.botmoon.com';
const SECRET_KEY = 'ec8930f3-6348-4614-b8e2-72606a69fda2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const url = `${BASE_URL}/external/user/detail?secretKey=${SECRET_KEY}&user_id=${id}`;
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
    console.error('Error fetching user detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user detail' },
      { status: 500 }
    );
  }
}

