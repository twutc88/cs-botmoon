'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
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
  
  // Filter states
  const [leadStageFilter, setLeadStageFilter] = useState('all');
  const [botStatusFilter, setBotStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [packageFilter, setPackageFilter] = useState('all');

  useEffect(() => {
    const auth = localStorage.getItem('cs_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated, search]);

  useEffect(() => {
    if (isAuthenticated && allUsers.length > 0) {
      loadLatestActions();
    }
  }, [allUsers, isAuthenticated]);

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
      const response = await fetchUsers(1, 1000, search);
      setAllUsers(response.data);
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
      allUsers.slice(0, 100).map(async (user) => {
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
    if (!user.user_status.has_robot) return { icon: 'mdi:close-circle', label: 'No bot', color: 'text-gray-500' };
    if (user.user_status.bot_is_running) return { icon: 'mdi:play-circle', label: 'Active', color: 'text-green-500' };
    return { icon: 'mdi:pause-circle', label: 'Paused', color: 'text-yellow-500' };
  };

  const getLeadStageIcon = (stage: string) => {
    switch (stage) {
      case 'new':
        return { icon: 'mdi:circle', color: 'text-green-500' };
      case 'demo-7d':
        return { icon: 'mdi:circle', color: 'text-yellow-500' };
      case 'demo-1d':
        return { icon: 'mdi:circle', color: 'text-purple-500' };
      case 'active':
        return { icon: 'mdi:circle', color: 'text-blue-500' };
      case 'inactive':
        return { icon: 'mdi:circle', color: 'text-gray-400' };
      case 'payment-failed':
        return { icon: 'mdi:circle', color: 'text-black' };
      default:
        return { icon: 'mdi:circle', color: 'text-gray-500' };
    }
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

  // Filter users based on selected filters
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const leadStage = calculateLeadStage(
        user.created_time,
        user.user_status.add_payment,
        user.user_status.bot_is_running
      );
      const botStatus = getBotStatus(user);

      // Lead Stage filter
      if (leadStageFilter !== 'all' && leadStage.stage !== leadStageFilter) {
        return false;
      }

      // Bot Status filter
      if (botStatusFilter !== 'all') {
        if (botStatusFilter === 'active' && !user.user_status.bot_is_running) return false;
        if (botStatusFilter === 'paused' && (user.user_status.bot_is_running || !user.user_status.has_robot)) return false;
        if (botStatusFilter === 'no-bot' && user.user_status.has_robot) return false;
      }

      // Payment filter
      if (paymentFilter !== 'all') {
        if (paymentFilter === 'paid' && !user.user_status.add_payment) return false;
        if (paymentFilter === 'unpaid' && user.user_status.add_payment) return false;
      }

      // Package filter
      if (packageFilter !== 'all') {
        if (packageFilter === 'basic' && user.package !== 'Basic') return false;
        if (packageFilter === 'elite' && user.package !== 'Elite') return false;
        if (packageFilter === 'premium' && user.package !== 'Premium') return false;
        if (packageFilter === 'none' && user.package) return false;
      }

      return true;
    });
  }, [allUsers, leadStageFilter, botStatusFilter, paymentFilter, packageFilter]);

  // Pagination
  const pageSize = 20;
  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, page]);

  useEffect(() => {
    setTotalPages(Math.ceil(filteredUsers.length / pageSize));
  }, [filteredUsers]);

  const clearFilters = () => {
    setLeadStageFilter('all');
    setBotStatusFilter('all');
    setPaymentFilter('all');
    setPackageFilter('all');
    setPage(1);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <div className="mb-6 flex items-center justify-center">
            <Icon icon="mdi:shield-lock" className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">CS Dashboard Login</h1>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="กรุณากรอกรหัสผ่าน"
                className="w-full"
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              <Icon icon="mdi:login" className="mr-2 h-5 w-5" />
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
          <div className="flex items-center gap-3">
            <Icon icon="mdi:account-group" className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">CS Customer Report</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <Icon icon="mdi:logout" className="mr-2 h-5 w-5" />
            ออกจากระบบ
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* Search and Filters */}
        <div className="mb-4 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="ค้นหาลูกค้า..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div>
              <Label className="mb-2 block text-sm font-medium">Lead Stage</Label>
              <Select value={leadStageFilter} onValueChange={setLeadStageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="new">🟢 New</SelectItem>
                  <SelectItem value="demo-7d">🟡 Demo 7D</SelectItem>
                  <SelectItem value="demo-1d">🟣 Demo 1D</SelectItem>
                  <SelectItem value="active">🔵 Active</SelectItem>
                  <SelectItem value="inactive">⚪️ Inactive</SelectItem>
                  <SelectItem value="payment-failed">⚫️ Payment Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">Bot Status</Label>
              <Select value={botStatusFilter} onValueChange={setBotStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="no-bot">No Bot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">Payment</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="paid">เชื่อมบัตรแล้ว</SelectItem>
                  <SelectItem value="unpaid">ยังไม่เชื่อมบัตร</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">Package</Label>
              <Select value={packageFilter} onValueChange={setPackageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="none">ไม่มี Package</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                <Icon icon="mdi:filter-remove" className="mr-2 h-5 w-5" />
                ล้าง Filter
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Icon icon="mdi:information" className="h-4 w-4" />
            <span>
              แสดง {paginatedUsers.length} จาก {filteredUsers.length} คน (ทั้งหมด {allUsers.length} คน)
            </span>
          </div>
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
                    <Icon icon="mdi:loading" className="inline-block h-6 w-6 animate-spin mr-2" />
                    กำลังโหลดข้อมูล...
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <Icon icon="mdi:database-off" className="inline-block h-6 w-6 mr-2" />
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => {
                  const leadStage = calculateLeadStage(
                    user.created_time,
                    user.user_status.add_payment,
                    user.user_status.bot_is_running
                  );
                  const botStatus = getBotStatus(user);
                  const leadStageIcon = getLeadStageIcon(leadStage.stage);

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
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Icon icon={leadStageIcon.icon} className={`h-3 w-3 ${leadStageIcon.color}`} />
                          {leadStage.label}
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
                        <div className="flex items-center gap-2">
                          <Icon icon={botStatus.icon} className={`h-5 w-5 ${botStatus.color}`} />
                          <span className="text-sm">{botStatus.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.user_status.add_payment ? (
                          <Icon icon="mdi:check-circle" className="h-5 w-5 text-green-500" />
                        ) : (
                          <Icon icon="mdi:close-circle" className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
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
              <Icon icon="mdi:chevron-left" className="h-5 w-5 mr-1" />
              ก่อนหน้า
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              ถัดไป
              <Icon icon="mdi:chevron-right" className="h-5 w-5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="mdi:account-details" className="h-6 w-6 text-blue-600" />
              รายละเอียดลูกค้า
            </DialogTitle>
            <DialogDescription>ID: #{selectedUser?.id}</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">ชื่อ</Label>
                  <p className="text-gray-900">{selectedUser.nickname || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <p className="text-gray-900">{selectedUser.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">เบอร์โทร</Label>
                  <p className="text-gray-900">
                    {selectedUser.mobile_code && selectedUser.mobile_no
                      ? `${selectedUser.mobile_code} ${selectedUser.mobile_no}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Package</Label>
                  <p className="text-gray-900">{selectedUser.package || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Rank</Label>
                  <p className="text-gray-900">{selectedUser.rank || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">วันที่สมัคร</Label>
                  <p className="text-gray-900">{formatDate(selectedUser.created_time)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="mb-4 font-semibold text-gray-900 flex items-center gap-2">
                  <Icon icon="mdi:note-edit" className="h-5 w-5 text-blue-600" />
                  บันทึก Action
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-gray-700">
                      ประเภท Action
                    </Label>
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
                    <Label className="mb-2 block text-sm font-medium text-gray-700">Note</Label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="กรอกหมายเหตุ..."
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleSaveAction} className="w-full">
                    <Icon icon="mdi:content-save" className="mr-2 h-5 w-5" />
                    บันทึก
                  </Button>
                </div>
              </div>

              {actionHistory.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="mb-4 font-semibold text-gray-900 flex items-center gap-2">
                    <Icon icon="mdi:history" className="h-5 w-5 text-blue-600" />
                    ประวัติ Action
                  </h3>
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
