'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { fetchUsers, fetchUserDetail, type User, type UserDetail } from '@/lib/api';
import { saveAction, getActionsByUserId, getLatestAction, type CustomerAction } from '@/lib/supabase';
import { calculateLeadStage } from '@/lib/lead-stage';

const PASSWORD = 'Tothemoon88#';

const ACTION_TYPES = [
  'Follow up',
  'โทรไม่รับ/ไม่ติด',
  'ปิดการขาย',
  'ปฏิเสธการขาย',
  'เบอร์มีปัญหา',
  'แก้ไขแล้ว',
  'อื่นๆ',
];

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [note, setNote] = useState('');
  const [actionHistory, setActionHistory] = useState<CustomerAction[]>([]);
  const [latestActions, setLatestActions] = useState<Record<number, string>>({});

  useEffect(() => {
    const auth = localStorage.getItem('cs_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadUsers();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [page, search]);

  useEffect(() => {
    if (isAuthenticated && users.length > 0) {
      loadLatestActions();
    }
  }, [users]);

  const handleLogin = () => {
    if (password === PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('cs_auth', 'true');
      loadUsers();
    } else {
      alert('รหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('cs_auth');
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetchUsers(page, 20, search);
      setUsers(response.data);
      setTotalPages(response.pagination.max_page);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const loadLatestActions = async () => {
    const actions: Record<number, string> = {};
    await Promise.all(
      users.map(async (user) => {
        try {
          const latest = await getLatestAction(user.id);
          if (latest) {
            actions[user.id] = latest.action_type;
          }
        } catch (error) {
          console.error(`Error loading action for user ${user.id}:`, error);
        }
      })
    );
    setLatestActions(actions);
  };

  const handleUserClick = async (user: User) => {
    try {
      const response = await fetchUserDetail(user.id);
      setSelectedUser(response.data);
      setIsModalOpen(true);
      setActionType('');
      setNote('');

      // Load action history
      const history = await getActionsByUserId(user.id);
      setActionHistory(history);
    } catch (error) {
      console.error('Error loading user detail:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  const handleSaveAction = async () => {
    if (!selectedUser || !actionType) {
      alert('กรุณาเลือกประเภท Action');
      return;
    }

    try {
      await saveAction(selectedUser.id, actionType, note);
      alert('บันทึกสำเร็จ');
      setActionType('');
      setNote('');

      // Reload action history
      const history = await getActionsByUserId(selectedUser.id);
      setActionHistory(history);

      // Update latest action
      const latest = await getLatestAction(selectedUser.id);
      if (latest) {
        setLatestActions((prev) => ({
          ...prev,
          [selectedUser.id]: latest.action_type,
        }));
      }

      // Reload users to update action status
      loadUsers();
    } catch (error) {
      console.error('Error saving action:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const getBotStatus = (user: User) => {
    if (!user.user_status.has_robot) return { emoji: '❌', label: 'No bot' };
    if (user.user_status.bot_is_running) return { emoji: '▶️', label: 'Active' };
    return { emoji: '⏸️', label: 'Paused' };
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  const formatContact = (user: User) => {
    if (user.mobile_code && user.mobile_no) {
      return `${user.mobile_code} ${user.mobile_no}`;
    }
    return user.email || '-';
  };

  const formatUserName = (user: User) => {
    if (user.nickname) return user.nickname;
    return user.email || `ID: #${user.id}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">CS Dashboard Login</h1>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">รหัสผ่าน</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="กรุณากรอกรหัสผ่าน"
                className="w-full"
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              เข้าสู่ระบบ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">CS Customer Report</h1>
          <Button variant="outline" onClick={handleLogout}>
            ออกจากระบบ
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4 flex gap-4">
          <Input
            placeholder="ค้นหาลูกค้า..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-md"
          />
        </div>

        <div className="rounded-lg border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Lead Stage</TableHead>
                <TableHead>Status Action</TableHead>
                <TableHead>Bot Status</TableHead>
                <TableHead>Add Payment</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Joined Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    กำลังโหลดข้อมูล...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const leadStage = calculateLeadStage(
                    user.created_time,
                    user.user_status.add_payment,
                    user.user_status.bot_is_running
                  );
                  const botStatus = getBotStatus(user);

                  return (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleUserClick(user)}
                    >
                      <TableCell className="font-medium">
                        ID: #{user.id}
                        <br />
                        <span className="text-sm text-gray-500">{formatUserName(user)}</span>
                      </TableCell>
                      <TableCell>{formatContact(user)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {leadStage.emoji} {leadStage.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {latestActions[user.id] ? (
                          <Badge variant="secondary">{latestActions[user.id]}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {botStatus.emoji} {botStatus.label}
                      </TableCell>
                      <TableCell>{user.user_status.add_payment ? '✅' : '❌'}</TableCell>
                      <TableCell>{user.package || '-'}</TableCell>
                      <TableCell>{formatDate(user.created_time)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            หน้า {page} จาก {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              ก่อนหน้า
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดลูกค้า</DialogTitle>
            <DialogDescription>ID: #{selectedUser?.id}</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">ชื่อ</label>
                  <p className="text-gray-900">{selectedUser.nickname || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{selectedUser.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">เบอร์โทร</label>
                  <p className="text-gray-900">
                    {selectedUser.mobile_code && selectedUser.mobile_no
                      ? `${selectedUser.mobile_code} ${selectedUser.mobile_no}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Package</label>
                  <p className="text-gray-900">{selectedUser.package || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Rank</label>
                  <p className="text-gray-900">{selectedUser.rank || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">วันที่สมัคร</label>
                  <p className="text-gray-900">{formatDate(selectedUser.created_time)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="mb-4 font-semibold text-gray-900">บันทึก Action</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      ประเภท Action
                    </label>
                    <Select value={actionType} onValueChange={setActionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกประเภท Action" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Note</label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="กรอกหมายเหตุ..."
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleSaveAction} className="w-full">
                    บันทึก
                  </Button>
                </div>
              </div>

              {actionHistory.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="mb-4 font-semibold text-gray-900">ประวัติ Action</h3>
                  <div className="space-y-2">
                    {actionHistory.map((action) => (
                      <div
                        key={action.id}
                        className="rounded-lg border bg-gray-50 p-3 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{action.action_type}</Badge>
                          <span className="text-gray-500">
                            {formatDate(action.created_at)}
                          </span>
                        </div>
                        {action.note && (
                          <p className="mt-2 text-gray-700">{action.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
