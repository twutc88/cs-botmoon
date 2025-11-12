const BASE_URL = 'https://api-cm.botmoon.com';
const SECRET_KEY = 'ec8930f3-6348-4614-b8e2-72606a69fda2';

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
  search: string = ''
): Promise<UsersResponse> {
  const url = `${BASE_URL}/external/user?secretKey=${SECRET_KEY}&page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

export async function fetchUserDetail(userId: number): Promise<{ status: string; data: UserDetail }> {
  const url = `${BASE_URL}/external/user/detail?secretKey=${SECRET_KEY}&user_id=${userId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch user detail');
  }
  return response.json();
}

