const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // sesuaikan dengan password MySQL Anda
    database: 'crud_app'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('🚀 Connected to MySQL database');
});

// Helper function to fetch all users (to avoid code duplication)
const getAllUsers = (callback) => {
    const sql = 'SELECT * FROM users ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching all users:', err.message);
            return callback(err);
        }
        callback(null, results);
    });
};

// Routes

// GET - Read all users
app.get('/api/users', (req, res) => {
    getAllUsers((err, users) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(users);
    });
});

// GET - Read single user
app.get('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(results[0]);
    });
});

// POST - Create user
app.post('/api/users', (req, res) => {
    const { name, email, phone, position } = req.body;
    // Tambahkan created_at dengan NOW()
    const sql = 'INSERT INTO users (name, email, phone, position, created_at) VALUES (?, ?, ?, ?, NOW())';

    db.query(sql, [name, email, phone, position], (err, result) => {
        if (err) {
            console.error('Error creating user:', err.message); // Log error lebih spesifik
            return res.status(500).json({ error: err.message });
        }
        // Setelah berhasil insert, ambil semua user terbaru
        getAllUsers((err, users) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json(users); // Kirim seluruh daftar user terbaru
        });
    });
});

// PUT - Update user
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, phone, position } = req.body;
    // Tambahkan updated_at dengan NOW()
    const sql = 'UPDATE users SET name = ?, email = ?, phone = ?, position = ?, updated_at = NOW() WHERE id = ?';

    db.query(sql, [name, email, phone, position, id], (err, result) => {
        if (err) {
            console.error('Error updating user:', err.message); // Log error lebih spesifik
            return res.status(500).json({ error: err.message });
        }
        // Setelah berhasil update, ambil semua user terbaru
        getAllUsers((err, users) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(users); // Kirim seluruh daftar user terbaru
        });
    });
});

// DELETE - Delete user
app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM users WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err.message); // Log error lebih spesifik
            return res.status(500).json({ error: err.message });
        }
        // Setelah berhasil delete, ambil semua user terbaru
        getAllUsers((err, users) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(users); // Kirim seluruh daftar user terbaru
        });
    });
});

app.listen(PORT, () => {
    console.log(`🎉 Server running on port ${PORT}`);
});
