import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import { Trash2, UserPlus, ShieldAlert, KeyRound, Loader2, Edit3 } from 'lucide-react';
import { Modal } from './ui/modal';
import { DataTable, Column } from './ui/data-table';
import ConfirmDialog from './ConfirmDialog';

interface User {
  id: string;
  username: string;
  role: string;
  needsPasswordChange: boolean;
}

interface UsersTabProps {
  showToast: (message: string, isError?: boolean) => void;
}

export default function UsersTab({ showToast }: UsersTabProps) {
  const { user: currentUser } = useAuth();

  // Table & pagination state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Deletion confirm modal control
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  useEffect(() => {
    loadUsers(currentPage);
  }, [currentPage]);

  const loadUsers = async (page: number) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/users?page=${page}&limit=${pageSize}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalCount(data.total);
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Không thể tải danh sách người dùng', true);
      }
    } catch (err) {
      showToast('Lỗi kết nối máy chủ', true);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRole('USER');
    setNeedsPasswordChange(true);
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword('');
    setRole(user.role);
    setNeedsPasswordChange(user.needsPasswordChange);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('Vui lòng điền tên đăng nhập', true);
      return;
    }
    if (!editingUser && !password.trim()) {
      showToast('Vui lòng điền mật khẩu khởi tạo', true);
      return;
    }

    try {
      setSubmitting(true);
      const isEdit = !!editingUser;
      const endpoint = isEdit ? `/api/users/${editingUser.id}` : '/api/users';
      const method = isEdit ? 'PUT' : 'POST';

      const payload: any = {
        username: username.trim(),
        role,
        needsPasswordChange
      };
      if (password) {
        payload.password = password;
      }

      const res = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? 'Cập nhật tài khoản thành công' : 'Tạo tài khoản thành công');
        setModalOpen(false);
        loadUsers(currentPage);
      } else {
        showToast(data.error || 'Thao tác thất bại', true);
      }
    } catch (err) {
      showToast('Lỗi kết nối máy chủ', true);
    } finally {
      setSubmitting(false);
    }
  };

  const triggerDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) {
      showToast('Bạn không thể tự xóa tài khoản của chính mình', true);
      return;
    }
    setDeletingUser(user);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    const { id } = deletingUser;

    try {
      const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast('Xóa người dùng thành công');
        const newTotalCount = totalCount - 1;
        const totalPages = Math.ceil(newTotalCount / pageSize);
        if (currentPage > totalPages && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          loadUsers(currentPage);
        }
      } else {
        showToast(data.error || 'Xóa người dùng thất bại', true);
      }
    } catch (err) {
      showToast('Lỗi kết nối máy chủ', true);
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingUser(null);
    }
  };

  const isCurrentUserAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  const columns = React.useMemo<Column<User>[]>(() => [
    {
      id: 'username',
      header: 'Tên đăng nhập',
      accessor: (u) => (
        <div className="font-semibold text-slate-200 flex items-center gap-2">
          {u.username}
          {u.id === currentUser?.id && (
            <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded font-mono font-semibold">
              BẠN
            </span>
          )}
        </div>
      ),
      className: 'px-6 py-4 text-xs font-semibold text-slate-400 tracking-wider uppercase font-mono',
      cellClassName: 'px-6 py-4 font-sans',
    },
    {
      id: 'role',
      header: 'Vai trò',
      accessor: (u) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${u.role === 'ADMIN'
          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          }`}>
          {u.role}
        </span>
      ),
      className: 'px-6 py-4 text-xs font-semibold text-slate-400 tracking-wider uppercase font-mono',
      cellClassName: 'px-6 py-4',
    },
    {
      id: 'needsPasswordChange',
      header: 'Trạng thái đổi MK',
      accessor: (u) => (
        u.needsPasswordChange ? (
          <span className="text-amber-400 flex items-center gap-1 font-mono text-xs">
            <KeyRound className="w-3.5 h-3.5" />
            Yêu cầu đổi
          </span>
        ) : (
          <span className="text-emerald-400 font-mono text-xs">Đã đổi</span>
        )
      ),
      className: 'px-6 py-4 text-xs font-semibold text-slate-400 tracking-wider uppercase font-mono',
      cellClassName: 'px-6 py-4',
    },
    {
      id: 'actions',
      header: 'Hành động',
      accessor: (u) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEditModal(u)}
            className="text-slate-400 hover:text-primary p-2 hover:bg-primary/10 rounded-lg transition-all duration-150 cursor-pointer"
            title="Sửa thông tin"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => triggerDeleteUser(u)}
            disabled={u.id === currentUser?.id}
            className="text-slate-400 hover:text-rose-400 p-2 hover:bg-rose-500/10 rounded-lg transition-all duration-150 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer"
            title="Xóa người dùng"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'px-6 py-4 text-xs font-semibold text-slate-400 tracking-wider uppercase font-mono text-right',
      cellClassName: 'px-6 py-4 text-right',
    }
  ], [currentUser]);

  if (!isCurrentUserAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4 max-w-md glass-panel p-8 border border-white/5 rounded-3xl">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto animate-bounce" />
          <h2 className="text-2xl font-bold text-slate-200">Truy Cập Bị Từ Chối</h2>
          <p className="text-sm text-slate-400">
            Khu vực này chỉ dành riêng cho Quản trị viên (Admin). Bạn không có quyền truy cập trang này.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fade-in pt-4">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary-to bg-clip-text text-transparent glow-text font-mono uppercase">
            Quản Lý Users
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Quản lý tài khoản nhân viên, cấu hình phân quyền và bảo mật hệ thống.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-to text-primary-foreground font-semibold px-4.5 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer shadow-md select-none w-full sm:w-auto justify-center"
        >
          <UserPlus className="w-4.5 h-4.5" />
          Thêm Tài Khoản
        </button>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users || []}
        keyExtractor={(u) => u.id}
        loading={loading}
        emptyState="Chưa có tài khoản người dùng nào."
        pagination={{
          currentPage,
          totalPages,
          totalCount,
          pageSize,
          onPageChange: setCurrentPage,
          itemLabel: 'tài khoản'
        }}
      />

      {/* Create / Edit User Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Sửa Thông Tin Tài Khoản' : 'Thêm Tài Khoản Mới'}
        description={
          editingUser
            ? `Thay đổi thông tin cho tài khoản "${editingUser.username}"`
            : 'Tạo tài khoản mới cho nhân viên hoặc quản trị viên.'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-450 tracking-wider uppercase font-mono">
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username..."
              className="w-full bg-slate-900/60 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-300 shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-455 tracking-wider uppercase font-mono">
              {editingUser ? 'Mật khẩu mới (Để trống nếu không muốn đổi)' : 'Mật khẩu khởi tạo'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={editingUser ? 'Bỏ qua nếu giữ nguyên...' : 'Nhập mật khẩu...'}
              className="w-full bg-slate-900/60 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-300 shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-455 tracking-wider uppercase font-mono">
              Vai trò
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-300 shadow-inner cursor-pointer"
            >
              <option value="USER" className="bg-slate-950 text-slate-200">Nhân viên (USER)</option>
              <option value="ADMIN" className="bg-slate-950 text-slate-200">Quản trị viên (ADMIN)</option>
            </select>
          </div>

          {editingUser && (
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="needsPasswordChange"
                checked={needsPasswordChange}
                onChange={(e) => setNeedsPasswordChange(e.target.checked)}
                className="w-4.5 h-4.5 bg-slate-900 border border-white/10 rounded focus:ring-primary/30 text-primary cursor-pointer"
              />
              <label htmlFor="needsPasswordChange" className="text-xs font-semibold text-slate-350 cursor-pointer select-none">
                Bắt buộc đổi mật khẩu ở lần đăng nhập tới
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="bg-secondary/60 hover:bg-secondary/80 border border-border font-semibold px-4.5 py-2.5 rounded-xl transition-all duration-200 text-sm text-slate-300 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-to text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 disabled:opacity-50 cursor-pointer shadow-md select-none"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                editingUser ? 'Cập nhật' : 'Tạo tài khoản'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Xóa tài khoản người dùng"
        description={deletingUser ? `Bạn có chắc chắn muốn xóa tài khoản "${deletingUser.username}"? Hành động này sẽ xóa toàn bộ dữ liệu cào liên quan của người dùng này và không thể hoàn tác.` : ''}
        confirmLabel="Xóa người dùng"
        variant="destructive"
        onConfirm={handleDeleteUser}
      />

    </div>
  );
}
