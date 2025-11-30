import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, User, Mail, Shield, Search } from 'lucide-react';
import SignUpValidation from '../context/SignUpValidation';
import { useAuth } from '../context/AuthContext';
import { useAlertDialog } from '../context/AlertDialogContext';
import { useToast } from '../context/ToastContext';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import Pagination from '../components/Pagination';

const UserManagementPage = () => {
  const { getAuthHeader, role: currentUserRole } = useAuth();
  const { showConfirm } = useAlertDialog();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'guest',
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'guest', 'staff', 'admin'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const roleOptions = [
    { value: 'guest', label: 'Guest', color: 'bg-blue-100 text-blue-800' },
    { value: 'staff', label: 'Staff', color: 'bg-purple-100 text-purple-800' },
    { value: 'admin', label: 'Admin', color: 'bg-green-100 text-green-800' },
  ];

  const getRoleColor = (role) => {
    const roleOption = roleOptions.find((r) => r.value === role);
    return roleOption ? roleOption.color : 'bg-gray-100 text-gray-800';
  };

  // Filter role options based on current user's role
  const availableRoleOptions =
    currentUserRole === 'staff'
      ? roleOptions.filter((option) => option.value === 'guest')
      : roleOptions;

  // Filter available roles for dropdown based on current user's role
  const availableFilterOptions =
    currentUserRole === 'staff'
      ? [{ value: 'all', label: 'All' }, { value: 'guest', label: 'Guest' }]
      : [
          { value: 'all', label: 'All' },
          ...roleOptions.map((option) => ({ value: option.value, label: option.label })),
        ];

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8081/api/admin/users?page=${currentPage}&limit=${itemsPerPage}`, {
        headers: getAuthHeader(),
      });

      let filteredUsers = res.data.data || res.data || [];
      if (currentUserRole === 'staff') {
        filteredUsers = filteredUsers.filter((user) => user.role !== 'admin');
      }
      setUsers(filteredUsers);
      setTotalItems(res.data.totalItems || filteredUsers.length);
      setTotalPages(res.data.totalPages || 1);
    } catch (e) {
      console.error('Failed to load users', e);
      showError(e?.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      if (currentUserRole === 'staff' && (newUser.role === 'admin' || newUser.role === 'staff')) {
        showError('Staff members can only create guest accounts');
        return;
      }

      const errors = SignUpValidation(newUser);
      setValidationErrors(errors);

      if (newUser.password !== newUser.confirmPassword) {
        setValidationErrors((prev) => ({
          ...prev,
          confirmPassword: 'Passwords do not match',
        }));
        return;
      }

      const hasNoErrors =
        errors.username === '' && errors.email === '' && errors.password === '';

      if (!hasNoErrors) {
        return;
      }

      const response = await axios.post(
        'http://localhost:8081/api/admin/users',
        {
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
        },
        { headers: getAuthHeader() }
      );

      await loadUsers();
      showSuccess(
        `${newUser.role === 'staff' ? 'Staff' : newUser.role === 'admin' ? 'Admin' : 'Guest'} account created successfully!`
      );

      setNewUser({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'guest',
      });
      setValidationErrors({});
      setShowAddModal(false);
    } catch (e) {
      console.error('Add user error:', e);
      showError(e?.response?.data?.error || 'Failed to create user account');
    }
  };

  const handleDeleteUser = async (userId, username, userRole) => {
    if (currentUserRole === 'staff' && userRole === 'admin') {
      showError('Staff members cannot delete admin accounts');
      return;
    }

    const confirmed = await showConfirm(
      `Are you sure you want to delete the account for ${username}?`,
      'Delete User'
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8081/api/admin/users/${userId}`, {
        headers: getAuthHeader(),
      });
      setUsers(users.filter((user) => user.id !== userId));
      showSuccess('User account deleted successfully!');
    } catch (error) {
      console.error('Delete user error:', error);
      showError(error?.response?.data?.error || 'Failed to delete user account');
    }
  };

  const handleInputChange = (e) => {
    setNewUser((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  // Filter users based on search query and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Separate filtered users into guest and staff/admin groups
  const guestUsers = filteredUsers.filter((user) => user.role === 'guest');
  const staffAdminUsers = filteredUsers.filter((user) => user.role === 'staff' || user.role === 'admin');

  useEffect(() => {
    loadUsers();
  }, [currentPage, itemsPerPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 mb-6 border border-slate-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage guest and staff accounts</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by username or email"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Search users"
              />
            </div>
            <select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              className="w-full sm:w-40 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filter by role"
            >
              {availableFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Add new user"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 mb-6 text-gray-500 dark:text-gray-400 text-center">
          <div className="animate-pulse">Loading users...</div>
        </div>
      )}

      {/* Guest Accounts Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Guest Accounts</h2>
        {guestUsers.length === 0 && !loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No guest accounts</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || roleFilter !== 'all'
                ? 'No guest accounts match your search or filter.'
                : 'Create a new guest account to get started.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
            {/* Table Layout (sm and above) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Created At
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {guestUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-900 dark:text-white">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username, user.role)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                          title="Delete user"
                          aria-label={`Delete ${user.username}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Card Layout (below sm) */}
            <div className="sm:hidden grid gap-4 p-4">
              {guestUsers.map((user) => (
                <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.username}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Created: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username, user.role)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-2 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                      title="Delete user"
                      aria-label={`Delete ${user.username}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {guestUsers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>

      {/* Staff and Admin Accounts Section */}
      {currentUserRole !== 'staff' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Staff & Admin Accounts</h2>
          {staffAdminUsers.length === 0 && !loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 text-center">
              <User className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No staff or admin accounts</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery || roleFilter !== 'all'
                  ? 'No staff or admin accounts match your search or filter.'
                  : 'Create a new staff or admin account to get started.'}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
              {/* Table Layout (sm and above) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Created At
                      </th>
                      <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {staffAdminUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm text-gray-900 dark:text-white">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role || 'guest')}`}>
                            <Shield className="w-3 h-3" />
                            {user.role || 'guest'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username, user.role)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                            title="Delete user"
                            aria-label={`Delete ${user.username}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Card Layout (below sm) */}
              <div className="sm:hidden grid gap-4 p-4">
                {staffAdminUsers.map((user) => (
                  <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.username}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleColor(user.role || 'guest')}`}>
                          <Shield className="w-3 h-3" />
                          {user.role || 'guest'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Created: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username, user.role)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-2 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                        title="Delete user"
                        aria-label={`Delete ${user.username}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Add New User Account</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new guest or staff account</p>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {/* Role Selection */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Type
                </label>
                <select
                  id="role"
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableRoleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={newUser.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                  required
                />
                {validationErrors.username && (
                  <span className="text-red-500 dark:text-red-400 text-xs mt-1 block">{validationErrors.username}</span>
                )}
              </div>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                  required
                />
                {validationErrors.email && (
                  <span className="text-red-500 dark:text-red-400 text-xs mt-1 block">{validationErrors.email}</span>
                )}
              </div>
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                />
                <PasswordStrengthMeter password={newUser.password} />
                {validationErrors.password && (
                  <span className="text-red-500 dark:text-red-400 text-xs mt-1 block">{validationErrors.password}</span>
                )}
              </div>
              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={newUser.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm password"
                  required
                />
                {validationErrors.confirmPassword && (
                  <span className="text-red-500 dark:text-red-400 text-xs mt-1 block">{validationErrors.confirmPassword}</span>
                )}
              </div>
            </div>
            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewUser({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: 'guest',
                  });
                  setValidationErrors({});
                }}
                className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Create user account"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
