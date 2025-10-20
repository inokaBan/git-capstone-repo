import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, User, Mail, Shield } from 'lucide-react';
import SignUpValidation from '../context/SignUpValidation';
import { useAuth } from '../context/AuthContext';
import { useAlertDialog } from '../context/AlertDialogContext';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

const UserManagementPage = () => {
  const { getAuthHeader, role: currentUserRole } = useAuth();
  const { showConfirm, showSuccess, showError } = useAlertDialog();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'guest'
  });
  const [validationErrors, setValidationErrors] = useState({});

  const roleOptions = [
    { value: 'guest', label: 'Guest', color: 'bg-blue-100 text-blue-800' },
    { value: 'staff', label: 'Staff', color: 'bg-purple-100 text-purple-800' },
    { value: 'admin', label: 'Admin', color: 'bg-green-100 text-green-800' }
  ];

  const getRoleColor = (role) => {
    const roleOption = roleOptions.find(r => r.value === role);
    return roleOption ? roleOption.color : 'bg-gray-100 text-gray-800';
  };

  // Filter role options based on current user's role
  // Staff users can only create guest accounts
  const availableRoleOptions = currentUserRole === 'staff' 
    ? roleOptions.filter(option => option.value === 'guest')
    : roleOptions;

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('http://localhost:8081/api/admin/users', {
        headers: getAuthHeader()
      });
      
      // Backend already filters admin accounts for staff users,
      // but we add frontend filtering as an additional security layer
      let filteredUsers = res.data || [];
      
      // If current user is staff, filter out any admin accounts
      if (currentUserRole === 'staff') {
        filteredUsers = filteredUsers.filter(user => user.role !== 'admin');
      }
      
      setUsers(filteredUsers);
    } catch (e) {
      console.error('Failed to load users', e);
      setError(e?.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      setError('');
      
      // Prevent staff from creating admin or staff accounts
      if (currentUserRole === 'staff' && (newUser.role === 'admin' || newUser.role === 'staff')) {
        setError('Staff members can only create guest accounts');
        return;
      }
      
      // Validate form
      const errors = SignUpValidation(newUser);
      setValidationErrors(errors);

      // Check if passwords match
      if (newUser.password !== newUser.confirmPassword) {
        setValidationErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
        return;
      }

      // Check if there are any validation errors
      const hasNoErrors = 
        errors.username === "" &&
        errors.email === "" &&
        errors.password === "";

      if (!hasNoErrors) {
        return;
      }

      const response = await axios.post('http://localhost:8081/api/admin/users', {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role
      }, {
        headers: getAuthHeader()
      });

      await loadUsers();
      showSuccess(`${newUser.role === 'staff' ? 'Staff' : 'Guest'} account created successfully!`);
      
      // Reset form
      setNewUser({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'guest'
      });
      setValidationErrors({});
      setShowAddModal(false);
    } catch (e) {
      console.error('Add user error:', e);
      setError(e?.response?.data?.error || 'Failed to create user account');
    }
  };

  const handleDeleteUser = async (userId, username, userRole) => {
    // Prevent staff from deleting admin accounts
    if (currentUserRole === 'staff' && userRole === 'admin') {
      showError('Staff members cannot delete admin accounts');
      return;
    }

    const confirmed = await showConfirm(`Are you sure you want to delete the account for ${username}?`, 'Delete User');
    
    if (!confirmed) {
      return;
    }

    try {
      setError('');
      // Use the userId which will be either numeric id or email
      await axios.delete(`http://localhost:8081/api/admin/users/${userId}`, {
        headers: getAuthHeader()
      });
      setUsers(users.filter(user => {
        // For admin accounts, id is the email; for user accounts, it's numeric
        return user.id !== userId;
      }));
      showSuccess('User account deleted successfully!');
    } catch (error) {
      console.error('Delete user error:', error);
      showError(error?.response?.data?.error || 'Failed to delete user account');
    }
  };

  const handleInputChange = (e) => {
    setNewUser(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 sm:p-6 mb-6 border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage guest and staff accounts</p>
          </div>
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

      {/* Error and Loading States */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg flex items-center justify-between flex-col sm:flex-row gap-4">
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={loadUsers}
            className="text-sm text-red-700 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Retry loading users"
          >
            Retry
          </button>
        </div>
      )}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 text-gray-500 text-center">
          <div className="animate-pulse">Loading users...</div>
        </div>
      )}

      {/* Users Display: Table for sm and above, Cards for xs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Table Layout (sm and above) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created At</th>
                <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr 
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{user.username}</h3>
                        <p className="text-xs text-gray-500">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role || 'guest')}`}>
                      <Shield className="w-3 h-3" />
                      {user.role || 'guest'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className="text-sm text-gray-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username, user.role)}
                      className="text-red-600 hover:text-red-800 p-1 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
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
          {users.map((user) => (
            <div 
              key={user.id}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-100"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{user.username}</h3>
                  <p className="text-xs text-gray-500">ID: {user.id}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleColor(user.role || 'guest')}`}>
                    <Shield className="w-3 h-3" />
                    {user.role || 'guest'}
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Created: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => handleDeleteUser(user.id, user.username, user.role)}
                  className="text-red-600 hover:text-red-800 p-2 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                  title="Delete user"
                  aria-label={`Delete ${user.username}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new user account.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add User
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Add New User Account</h2>
              <p className="text-sm text-gray-500 mt-1">Create a new guest or staff account</p>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4">
              {/* Role Selection */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                <select
                  id="role"
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableRoleOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={newUser.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                  required
                />
                {validationErrors.username && (
                  <span className="text-red-500 text-xs mt-1 block">{validationErrors.username}</span>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                  required
                />
                {validationErrors.email && (
                  <span className="text-red-500 text-xs mt-1 block">{validationErrors.email}</span>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                />
                <PasswordStrengthMeter password={newUser.password} />
                {validationErrors.password && (
                  <span className="text-red-500 text-xs mt-1 block">{validationErrors.password}</span>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={newUser.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm password"
                  required
                />
                {validationErrors.confirmPassword && (
                  <span className="text-red-500 text-xs mt-1 block">{validationErrors.confirmPassword}</span>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewUser({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: 'guest'
                  });
                  setValidationErrors({});
                }}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
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
