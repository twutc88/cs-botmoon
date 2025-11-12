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
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { fetchUsers, fetchUserDetail, type User, type UserDetail } from '@/lib/api';
import { saveAction, getActionsByUserId, getLatestAction, type CustomerAction } from '@/lib/supabase';
import { calculateLeadStage } from '@/lib/lead-stage';
import { toast } from 'sonner';

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
  const [totalCount, setTotalCount] = useState(0);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [clientPage, setClientPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, search, page]);

  useEffect(() => {
    if (allUsers.length > 0) {
      loadLatestActions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUsers.length]);

  useEffect(() => {
    // Reset client page when filters change
    setClientPage(1);
  }, [leadStageFilter, botStatusFilter, paymentFilter, packageFilter]);

  const handleLogin = () => {
    if (password === PASSWORD) {
      localStorage.setItem('cs_auth', 'true');
      setIsAuthenticated(true);
      toast.success('เข้าสู่ระบบสำเร็จ');
    } else {
      toast.error('รหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('cs_auth');
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Load more data per page for better filtering (100 items)
      const response = await fetchUsers(page, 100, search);
      setAllUsers(response.data);
      setTotalPages(response.pagination.max_page);
      setTotalCount(response.pagination.total_count);
      setClientPage(1); // Reset client page when loading new data
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLatestActions = async () => {
    if (allUsers.length === 0) return;
    
    const actions: Record<number, string> = {};
    // Load actions for visible users only to avoid too many requests
    const visibleUsers = allUsers.slice(0, 20);
    await Promise.all(
      visibleUsers.map(async (user) => {
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
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  const handleSaveAction = async () => {
    if (!selectedUser || !actionType) {
      toast.error('กรุณาเลือกประเภท Action');
      return;
    }

    try {
      await saveAction(selectedUser.id, actionType, note);
      toast.success('บันทึกสำเร็จ');
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

      // Don't reload users to avoid unnecessary API calls
    } catch (error) {
      console.error('Error saving action:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
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

  // Filter users based on selected filters (client-side)
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const leadStage = calculateLeadStage(
        user.created_time,
        user.user_status.add_payment,
        user.user_status.bot_is_running
      );

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

  // Paginate filtered users (client-side)
  const paginatedUsers = useMemo(() => {
    const startIndex = (clientPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, clientPage]);

  const totalFilteredPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const hasActiveFilters = leadStageFilter !== 'all' || botStatusFilter !== 'all' || paymentFilter !== 'all' || packageFilter !== 'all';

  const clearFilters = () => {
    setLeadStageFilter('all');
    setBotStatusFilter('all');
    setPaymentFilter('all');
    setPackageFilter('all');
    setClientPage(1);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-center">
            <Icon icon="mdi:shield-lock" className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
          </div>
          <h1 className="mb-6 text-center text-xl sm:text-2xl font-bold text-gray-900">CS Dashboard Login</h1>
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
              <Icon icon="mdi:login" className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              เข้าสู่ระบบ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:account-group" className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">CS Customer Report</h1>
          </div>
          <Button variant="ghost" onClick={handleLogout} size="sm">
            <Icon icon="mdi:logout" className="mr-2 h-4 w-4" />
            ออกจากระบบ
          </Button>
        </div>
      </header>

      <main className="container px-4 py-6">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาลูกค้า..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <Icon icon="mdi:filter-remove" className="mr-2 h-4 w-4" />
                ล้าง
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Lead Stage</Label>
              <Select value={leadStageFilter} onValueChange={setLeadStageFilter}>
                <SelectTrigger>
                  <SelectValue />
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
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Bot Status</Label>
              <Select value={botStatusFilter} onValueChange={setBotStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="active">▶️ Active</SelectItem>
                  <SelectItem value="paused">⏸️ Paused</SelectItem>
                  <SelectItem value="no-bot">❌ No Bot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Payment</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="paid">✅ เชื่อมบัตรแล้ว</SelectItem>
                  <SelectItem value="unpaid">❌ ยังไม่เชื่อมบัตร</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Package</Label>
              <Select value={packageFilter} onValueChange={setPackageFilter}>
                <SelectTrigger className="w-full">
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
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Icon icon="mdi:database" className="mr-2 h-4 w-4" />
          แสดง {paginatedUsers.length} รายการ (กรองได้ {filteredUsers.length} จาก {totalCount.toLocaleString()} คน)
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Lead Stage</TableHead>
                <TableHead>Status Action</TableHead>
                <TableHead>Bot Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Joined Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Icon icon="mdi:database-off" className="mb-2 h-8 w-8" />
                      <p>ไม่พบข้อมูล</p>
                    </div>
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
                      className="cursor-pointer"
                      onClick={() => handleUserClick(user)}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">#{user.id}</div>
                          <div className="text-sm text-muted-foreground">{formatUserName(user)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatContact(user)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Icon icon={leadStageIcon.icon} className={`h-3 w-3 ${leadStageIcon.color}`} />
                          {leadStage.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {latestActions[user.id] ? (
                          <Badge variant="secondary">{latestActions[user.id]}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon icon={botStatus.icon} className={`h-4 w-4 ${botStatus.color}`} />
                          <span className="text-sm">{botStatus.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {user.user_status.add_payment ? (
                          <Icon icon="mdi:check-circle" className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <Icon icon="mdi:close-circle" className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell>{user.package || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(user.created_time)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => {
                  if (clientPage > 1) {
                    setClientPage((p) => p - 1);
                  } else if (page > 1) {
                    setPage((p) => p - 1);
                    setClientPage(1);
                  }
                }}
                className={(clientPage === 1 && page === 1) || loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            <PaginationItem>
              <PaginationLink isActive>
                {hasActiveFilters ? (
                  <>{clientPage} / {totalFilteredPages}</>
                ) : (
                  <>{clientPage} / {totalFilteredPages}</>
                )}
              </PaginationLink>
            </PaginationItem>

            {!hasActiveFilters && (
              <PaginationItem>
                <PaginationLink>
                  <span className="text-xs text-gray-500">API: {page}/{totalPages}</span>
                </PaginationLink>
              </PaginationItem>
            )}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => {
                  if (clientPage < totalFilteredPages) {
                    setClientPage((p) => p + 1);
                  } else if (page < totalPages) {
                    setPage((p) => p + 1);
                    setClientPage(1);
                  }
                }}
                className={(clientPage === totalFilteredPages && page === totalPages) || loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] mx-4 p-0">
          <ScrollArea className="max-h-[85vh]">
            <div className="p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Icon icon="mdi:account-details" className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              รายละเอียดลูกค้า
            </DialogTitle>
            <DialogDescription className="text-sm">ID: #{selectedUser?.id}</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-700">ชื่อ</Label>
                  <p className="text-sm sm:text-base text-gray-900 break-words">{selectedUser.nickname || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-700">Email</Label>
                  <p className="text-sm sm:text-base text-gray-900 break-all">{selectedUser.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-700">เบอร์โทร</Label>
                  <p className="text-sm sm:text-base text-gray-900">
                    {selectedUser.mobile_code && selectedUser.mobile_no
                      ? `${selectedUser.mobile_code} ${selectedUser.mobile_no}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-700">Package</Label>
                  <p className="text-sm sm:text-base text-gray-900">{selectedUser.package || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-700">Rank</Label>
                  <p className="text-sm sm:text-base text-gray-900">{selectedUser.rank || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-700">วันที่สมัคร</Label>
                  <p className="text-sm sm:text-base text-gray-900">{formatDate(selectedUser.created_time)}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-3 sm:mb-4 text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Icon icon="mdi:note-edit" className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  บันทึก Action
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-gray-700">
                      ประเภท Action
                    </Label>
                    <Select value={actionType} onValueChange={setActionType}>
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="เลือกประเภท Action" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.map((type) => (
                          <SelectItem key={type} value={type} className="text-xs sm:text-sm">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-gray-700">Note</Label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="กรอกหมายเหตุ..."
                      rows={4}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <Button onClick={handleSaveAction} className="w-full text-xs sm:text-sm">
                    <Icon icon="mdi:content-save" className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    บันทึก
                  </Button>
                </div>
              </div>

              {actionHistory.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="mb-3 sm:mb-4 text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Icon icon="mdi:history" className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    ประวัติ Action
                  </h3>
                  <div className="space-y-2">
                    {actionHistory.map((action) => (
                      <div
                        key={action.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 sm:p-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0">
                          <Badge variant="secondary" className="text-xs w-fit">{action.action_type}</Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(action.created_at)}
                          </span>
                        </div>
                        {action.note && (
                          <p className="mt-2 text-xs sm:text-sm text-gray-700 break-words">{action.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
