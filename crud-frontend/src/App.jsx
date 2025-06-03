import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api/users';

function App() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Show notification dengan cleanup otomatis
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  }, []);

  // Fetch users - menggunakan useCallback untuk mencegah re-creation
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setUsers(response.data);
      console.log('fetchUsers: Data yang diambil:', response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Create or Update user
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi form data
    if (!formData.name.trim() || !formData.email.trim()) {
      showNotification('Name and email are required', 'error');
      return;
    }

    setLoading(true);
    console.log('handleSubmit: FormData yang akan dikirim:', formData);

    try {
      let response;
      if (editingId) {
        // Update
        response = await axios.put(`${API_URL}/${editingId}`, formData);
        showNotification('User updated successfully!');
        setEditingId(null);
      } else {
        // Create
        response = await axios.post(API_URL, formData);
        showNotification('User created successfully!');
      }
      
      console.log('handleSubmit: Respons dari backend:', response.data);
      
      // Update users state dengan data terbaru dari backend
      setUsers(response.data);
      
      // Reset form dan search
      setFormData({ name: '', email: '', phone: '', position: '' });
      setSearchTerm('');
      
    } catch (error) {
      console.error('Error saving user:', error);
      // Handle different error types
      if (error.response?.status === 400) {
        showNotification('Invalid data provided', 'error');
      } else if (error.response?.status === 409) {
        showNotification('Email already exists', 'error');
      } else {
        showNotification('Failed to save user', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      setLoading(true);
      console.log('handleDelete: Menghapus user dengan ID:', id);
      
      try {
        const response = await axios.delete(`${API_URL}/${id}`);
        showNotification('User deleted successfully!');
        
        console.log('handleDelete: Respons dari backend:', response.data);
        
        // Update users state dengan data terbaru
        setUsers(response.data);
        setSearchTerm('');
        
        // Jika user yang sedang diedit dihapus, reset form
        if (editingId === id) {
          handleCancel();
        }
        
      } catch (error) {
        console.error('Error deleting user:', error);
        if (error.response?.status === 404) {
          showNotification('User not found', 'error');
        } else {
          showNotification('Failed to delete user', 'error');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Edit user
  const handleEdit = (user) => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      position: user.position || ''
    });
    setEditingId(user.id);
    
    // Smooth scroll ke form section
    const formSection = document.getElementById('form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Cancel edit
  const handleCancel = () => {
    setFormData({ name: '', email: '', phone: '', position: '' });
    setEditingId(null);
  };

  // Filter users based on search term dengan safe checking - menggunakan useMemo
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (!user) return false;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        (user.name && user.name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.position && user.position.toLowerCase().includes(searchLower)) ||
        (user.phone && user.phone.toLowerCase().includes(searchLower))
      );
    });
  }, [users, searchTerm]);

  // Effect untuk logging perubahan users dan searchTerm
  useEffect(() => {
    console.log('useEffect: State users berubah, filteredUsers:', filteredUsers.length, 'SearchTerm:', searchTerm);
  }, [filteredUsers.length, searchTerm]); // Menggunakan filteredUsers.length

  // Effect untuk fetch data awal
  useEffect(() => {
    fetchUsers();
    console.log('useEffect: Component mounted, fetching users');
  }, [fetchUsers]); // Menambahkan fetchUsers sebagai dependency

  return (
    <div className="App">
      {/* Notification */}
      {notification.show && (
        <div className={`notification ${notification.type} slide-in`}>
          <div className="notification-content">
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification({ show: false, message: '', type: '' })}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">
            <span className="gradient-text">User Management</span>
            <span className="subtitle">Modern CRUD Application</span>
          </h1>
        </div>
      </header>

      <div className="container">
        {/* Form Section */}
        <section id="form-section" className="form-section card">
          <div className="form-header">
            <h2>{editingId ? '✏️ Edit User' : '➕ Add New User'}</h2>
            <p>Fill in the information below</p>
          </div>

          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="position">Position</label>
                <input
                  id="position"
                  type="text"
                  placeholder="Enter position/role"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-buttons">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Processing...' : editingId ? '🔄 Update User' : '➕ Add User'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="btn btn-secondary" disabled={loading}>
                  ❌ Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Users List Section */}
        <section className="users-section card">
          <div className="users-header">
            <div className="users-title">
              <h2>👥 Users Directory</h2>
              <span className="users-count">{filteredUsers.length} users</span>
            </div>

            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                disabled={loading}
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <h3>No users found</h3>
              <p>{searchTerm ? 'Try different search terms' : 'Add your first user to get started!'}</p>
            </div>
          ) : (
            <div className="users-grid">
              {filteredUsers.map((user, index) => (
                <div key={user.id} className="user-card" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="user-avatar">
                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="user-info">
                    <h3 className="user-name">{user.name || 'No Name'}</h3>
                    <p className="user-email">📧 {user.email || 'No Email'}</p>
                    {user.phone && <p className="user-phone">📱 {user.phone}</p>}
                    {user.position && <p className="user-position">💼 {user.position}</p>}
                    {user.created_at && (
                      <p className="user-date">📅 {new Date(user.created_at).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="user-actions">
                    <button
                      onClick={() => handleEdit(user)}
                      className="btn btn-edit"
                      title="Edit user"
                      disabled={loading}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      className="btn btn-delete"
                      title="Delete user"
                      disabled={loading}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>React + Express + MySQL</p>
      </footer>
    </div>
  );
}

export default App;