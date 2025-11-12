// Use Next.js API routes as proxy to avoid CORS issues
const API_BASE = '/api';

export interface User {
  id: number;
  nickname: string;
  email: string;
  mobile_code: string;
  mobile_no: string;
  package: string;
  created_time: string;
  user_status: {
    add_payment: boolean;
    bot_is_running: boolean;
    has_robot: boolean;
    email_verified: boolean;
    mobile_verified: boolean;
  };
}

export interface UserDetail extends User {
  rank: string;
  status: string;
  last_login_time: string;
}

export interface UsersResponse {
  status: string;
  pagination: {
    count: number;
    total_count: number;
    current_page: number;
    max_page: number;
  };
  data: User[];
}

export async function fetchUsers(
  page: number = 1,
  pageSize: number = 20,
  search: string = '',
  filters?: {
    leadStage?: string;
    botStatus?: string;
    payment?: string;
    package?: string;
  }
): Promise<UsersResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
    search: search,
  });
  
  if (filters) {
    if (filters.leadStage && filters.leadStage !== 'all') {
      params.append('lead_stage', filters.leadStage);
    }
    if (filters.botStatus && filters.botStatus !== 'all') {
      params.append('bot_status', filters.botStatus);
    }
    if (filters.payment && filters.payment !== 'all') {
      params.append('payment', filters.payment);
    }
    if (filters.package && filters.package !== 'all') {
      params.append('package', filters.package);
    }
  }
  
  const url = `${API_BASE}/users?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

export async function fetchUserDetail(userId: number): Promise<{ status: string; data: UserDetail }> {
  const url = `${API_BASE}/users/${userId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch user detail');
  }
  return response.json();
}

