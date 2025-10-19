const express = require("express")
const mysql = require("mysql")
const cors = require("cors")
const path = require("path")
const fs = require("fs")
const multer = require("multer")
const bcrypt = require("bcrypt")

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname)
        cb(null, 'room-' + uniqueSuffix + ext)
    }
})

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 5 // Max 5 files
    },
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true)
        } else {
            cb(new Error('Only image files are allowed'), false)
        }
    }
})

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Password strength validation
const COMMON_WEAK_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567890', 'letmein', 'trustno1', 'dragon',
  'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
  'bailey', 'passw0rd', 'shadow', '123123', '654321',
  'superman', 'qazwsx', 'michael', 'football'
];

const validatePasswordStrength = (password) => {
    if (!password || password.length < 8) {
        return { isValid: false, message: "Password must be at least 8 characters long" };
    }

    const checks = {
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        notCommon: !COMMON_WEAK_PASSWORDS.includes(password.toLowerCase())
    };

    const missing = [];
    if (!checks.uppercase) missing.push("one uppercase letter");
    if (!checks.lowercase) missing.push("one lowercase letter");
    if (!checks.number) missing.push("one number");
    if (!checks.special) missing.push("one special character");
    if (!checks.notCommon) missing.push("avoid common passwords");

    if (missing.length > 0) {
        return { 
            isValid: false, 
            message: `Password is too weak. Must include: ${missing.join(", ")}` 
        };
    }

    return { isValid: true, message: "" };
};

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "osner_db"
})

// Handle database connection errors
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');
});

// Handle connection errors
db.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Database connection lost, attempting to reconnect...');
        db.connect();
    } else {
        throw err;
    }
});

// Simple authentication middleware (checks for user data in request)
// In production, this should verify JWT tokens or sessions
const requireAuth = (req, res, next) => {
    // For now, we'll add a basic check
    // In a real app, you'd verify a JWT token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: "Authentication required" });
    }
    
    // In production, verify the token here
    // For now, we'll just pass through
    next();
};

const requireAdmin = (req, res, next) => {
    // For now, we'll add a basic check
    // In a real app, you'd verify the user's role from the JWT token
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: "Authentication required" });
    }
    
    // In production, verify the token and check role here
    // For now, we'll just pass through
    next();
};

app.post("/osner_db", async (req, res) => {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Missing required fields: username, email, and password are required." });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.message });
    }

    try {
        // Hash the password before storing
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = "INSERT INTO user_account (username, email, password) VALUES (?)";
        const values = [username, email, hashedPassword];

        db.query(sql, [values], (err, data) => {
            if (err) {
                return res.status(500).json({ error: err.code || err.message || "Database error" });
            }
            return res.status(201).json({ insertId: data.insertId, affectedRows: data.affectedRows });
        })
    } catch (error) {
        return res.status(500).json({ error: "Failed to hash password" });
    }
})

// Unified login route: checks both admin and user accounts
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields: email and password are required." });
    }

    // First, check admin_account table
    const adminSql = "SELECT admin_username as username, admin_email as email, admin_password as password FROM admin_account WHERE admin_email = ? LIMIT 1";
    db.query(adminSql, [email], async (err, adminResults) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }

        // If admin found, compare password
        if (adminResults && adminResults.length > 0) {
            const admin = adminResults[0];
            try {
                const passwordMatch = await bcrypt.compare(password, admin.password);
                if (passwordMatch) {
                    return res.status(200).json({ 
                        user: {
                            username: admin.username,
                            email: admin.email
                        },
                        role: 'admin'
                    });
                }
            } catch (compareError) {
                return res.status(500).json({ error: "Password comparison failed" });
            }
        }

        // If not admin or password didn't match, check user_account table
        const userSql = "SELECT id, username, email, password, role FROM user_account WHERE email = ? LIMIT 1";
        db.query(userSql, [email], async (err, userResults) => {
            if (err) {
                return res.status(500).json({ error: err.code || err.message || "Database error" });
            }

            // If user found, compare password
            if (userResults && userResults.length > 0) {
                const user = userResults[0];
                try {
                    const passwordMatch = await bcrypt.compare(password, user.password);
                    if (passwordMatch) {
                        return res.status(200).json({ 
                            user: {
                                id: user.id,
                                username: user.username,
                                email: user.email
                            },
                            role: user.role || 'guest'
                        });
                    }
                } catch (compareError) {
                    return res.status(500).json({ error: "Password comparison failed" });
                }
            }

            // If neither admin nor user found, or password didn't match, return error
            return res.status(401).json({ error: "Invalid email or password" });
        });
    });
});

// Keep old endpoints for backward compatibility (deprecated)
app.post("/login", async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields: email and password are required." });
    }

    const sql = "SELECT id, username, email, password FROM user_account WHERE email = ? LIMIT 1";
    db.query(sql, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        if (!results || results.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = results[0];
        try {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                // Don't send password back to client
                const { password: _, ...userWithoutPassword } = user;
                return res.status(200).json({ user: userWithoutPassword, role: 'guest' });
            } else {
                return res.status(401).json({ error: "Invalid email or password" });
            }
        } catch (compareError) {
            return res.status(500).json({ error: "Password comparison failed" });
        }
    })
})

// Admin login route: verify admin credentials (deprecated - use /api/auth/login instead)
app.post("/admin/login", async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields: email and password are required." });
    }

    const sql = "SELECT admin_username, admin_email, admin_password FROM admin_account WHERE admin_email = ? LIMIT 1";
    db.query(sql, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        if (!results || results.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const admin = results[0];
        try {
            const passwordMatch = await bcrypt.compare(password, admin.admin_password);
            if (passwordMatch) {
                return res.status(200).json({ 
                    admin: {
                        admin_username: admin.admin_username,
                        admin_email: admin.admin_email
                    }, 
                    role: 'admin' 
                });
            } else {
                return res.status(401).json({ error: "Invalid email or password" });
            }
        } catch (compareError) {
            return res.status(500).json({ error: "Password comparison failed" });
        }
    })
})

// Admin endpoint to create new user accounts (guests and staff)
app.post("/api/admin/users", requireAdmin, async (req, res) => {
    const { username, email, password, role } = req.body || {};

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Missing required fields: username, email, and password are required." });
    }

    // Validate role if provided (defaults to 'guest')
    const userRole = role || 'guest';
    if (!['guest', 'staff', 'admin'].includes(userRole)) {
        return res.status(400).json({ error: "Invalid role. Must be 'guest', 'staff', or 'admin'." });
    }

    // In production, extract the requesting user's role from JWT token
    // For now, we'll check the Authorization header format
    // Format: "Bearer email" where email can be looked up to get role
    const authHeader = req.headers.authorization;
    if (authHeader && (userRole === 'admin' || userRole === 'staff')) {
        // Extract email from auth header (in production, this would be from JWT)
        const requestingUserEmail = authHeader.replace('Bearer ', '');
        
        try {
            // Check if the requesting user is staff
            const checkRoleSql = "SELECT role FROM user_account WHERE email = ? LIMIT 1";
            const roleCheckResult = await new Promise((resolve, reject) => {
                db.query(checkRoleSql, [requestingUserEmail], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            // If requesting user is staff, prevent them from creating admin or staff accounts
            if (roleCheckResult && roleCheckResult.length > 0 && roleCheckResult[0].role === 'staff') {
                if (userRole === 'admin') {
                    return res.status(403).json({ error: "Staff members cannot create admin accounts" });
                }
                if (userRole === 'staff') {
                    return res.status(403).json({ error: "Staff members cannot create staff accounts" });
                }
            }
        } catch (error) {
            return res.status(500).json({ error: "Failed to verify user permissions" });
        }
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.message });
    }

    try {
        // Hash the password before storing
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // If role is admin, insert into admin_account table
        if (userRole === 'admin') {
            const sql = "INSERT INTO admin_account (admin_username, admin_email, admin_password) VALUES (?, ?, ?)";
            const values = [username, email, hashedPassword];

            db.query(sql, values, (err, data) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: "Email already exists" });
                    }
                    return res.status(500).json({ error: err.code || err.message || "Database error" });
                }
                return res.status(201).json({ 
                    username, 
                    email, 
                    role: userRole,
                    message: "Admin account created successfully" 
                });
            });
        } else {
            // For guest and staff, insert into user_account table
            const sql = "INSERT INTO user_account (username, email, password, role) VALUES (?, ?, ?, ?)";
            const values = [username, email, hashedPassword, userRole];

            db.query(sql, values, (err, data) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: "Email already exists" });
                    }
                    return res.status(500).json({ error: err.code || err.message || "Database error" });
                }
                return res.status(201).json({ 
                    id: data.insertId, 
                    username, 
                    email, 
                    role: userRole,
                    message: "User account created successfully" 
                });
            });
        }
    } catch (error) {
        return res.status(500).json({ error: "Failed to hash password" });
    }
});

// Admin endpoint to get all user accounts
app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
        // Extract email from auth header to determine requesting user's role
        const authHeader = req.headers.authorization;
        const requestingUserEmail = authHeader ? authHeader.replace('Bearer ', '') : null;
        
        if (!requestingUserEmail) {
            return res.status(401).json({ error: "Authentication required" });
        }

        // Determine if the requesting user is an admin or staff
        let requestingUserRole = null;
        
        // Check if requesting user is admin
        const checkAdminSql = "SELECT admin_email FROM admin_account WHERE admin_email = ? LIMIT 1";
        const adminCheck = await new Promise((resolve, reject) => {
            db.query(checkAdminSql, [requestingUserEmail], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        if (adminCheck && adminCheck.length > 0) {
            requestingUserRole = 'admin';
        } else {
            // Check if requesting user is staff
            const checkStaffSql = "SELECT role FROM user_account WHERE email = ? LIMIT 1";
            const staffCheck = await new Promise((resolve, reject) => {
                db.query(checkStaffSql, [requestingUserEmail], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            if (staffCheck && staffCheck.length > 0) {
                requestingUserRole = staffCheck[0].role;
            }
        }

        if (!requestingUserRole) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Query user_account table
        const userSql = "SELECT id, username, email, IFNULL(role, 'guest') as role, created_at FROM user_account ORDER BY created_at DESC";
        const userResults = await new Promise((resolve, reject) => {
            db.query(userSql, [], (err, results) => {
                if (err) {
                    // Fallback for tables without created_at or role columns
                    if (err.code === 'ER_BAD_FIELD_ERROR') {
                        const fallbackSql = "SELECT id, username, email FROM user_account ORDER BY id DESC";
                        db.query(fallbackSql, [], (fallbackErr, fallbackResults) => {
                            if (fallbackErr) reject(fallbackErr);
                            else {
                                const withDefaults = (fallbackResults || []).map(user => ({
                                    ...user,
                                    role: 'guest',
                                    created_at: null
                                }));
                                resolve(withDefaults);
                            }
                        });
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(results || []);
                }
            });
        });

        // Only query admin_account table if requesting user is admin
        let adminResults = [];
        if (requestingUserRole === 'admin') {
            const adminSql = "SELECT admin_username as username, admin_email as email, 'admin' as role, NULL as created_at, admin_email as id FROM admin_account ORDER BY admin_email";
            adminResults = await new Promise((resolve, reject) => {
                db.query(adminSql, [], (err, results) => {
                    if (err) reject(err);
                    else resolve(results || []);
                });
            });
        }

        // Combine results
        const allUsers = [...userResults, ...adminResults];
        
        return res.status(200).json(allUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ error: error.message || "Database error" });
    }
});

// Admin endpoint to delete user account
app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        // Extract email from auth header to verify requesting user's role
        const authHeader = req.headers.authorization;
        const requestingUserEmail = authHeader ? authHeader.replace('Bearer ', '') : null;
        
        if (!requestingUserEmail) {
            return res.status(401).json({ error: "Authentication required" });
        }

        // Check if requesting user is admin
        const checkAdminSql = "SELECT admin_email FROM admin_account WHERE admin_email = ? LIMIT 1";
        const adminCheck = await new Promise((resolve, reject) => {
            db.query(checkAdminSql, [requestingUserEmail], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        const isRequestingUserAdmin = adminCheck && adminCheck.length > 0;

        // Determine if id is numeric (user_account) or email (admin_account)
        const isNumericId = !isNaN(id);

        if (isNumericId) {
            // Try to delete from user_account table
            const sql = "DELETE FROM user_account WHERE id = ?";
            const result = await new Promise((resolve, reject) => {
                db.query(sql, [id], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            return res.status(200).json({ success: true, message: "User deleted successfully" });
        } else {
            // ID is an email, so it's an admin account
            // Only admins can delete admin accounts
            if (!isRequestingUserAdmin) {
                return res.status(403).json({ error: "Only administrators can delete admin accounts" });
            }

            const sql = "DELETE FROM admin_account WHERE admin_email = ?";
            const result = await new Promise((resolve, reject) => {
                db.query(sql, [id], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Admin account not found" });
            }
            return res.status(200).json({ success: true, message: "Admin account deleted successfully" });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ error: error.message || "Database error" });
    }
});

// Save booking data
app.post("/api/bookings", (req, res) => {
    console.log('Received booking request:', req.body);
    
    const {
        bookingId,
        roomId,
        roomName,
        guestName,
        guestContact,
        checkIn,
        checkOut,
        guests,
        totalPrice,
        status
    } = req.body || {};

    const missing = [];
    const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    if (isEmpty(bookingId)) missing.push('bookingId');
    if (isEmpty(roomId)) missing.push('roomId');
    if (isEmpty(roomName)) missing.push('roomName');
    if (isEmpty(guestName)) missing.push('guestName');
    if (isEmpty(guestContact)) missing.push('guestContact');
    if (isEmpty(checkIn)) missing.push('checkIn');
    if (isEmpty(checkOut)) missing.push('checkOut');
    if (isEmpty(guests)) missing.push('guests');
    if (isEmpty(status)) missing.push('status');
    const priceNumber = Number(totalPrice);
    if (Number.isNaN(priceNumber)) missing.push('totalPrice');
    
    console.log('Missing fields:', missing);
    
    if (missing.length > 0) {
        return res.status(400).json({ error: `Missing or invalid fields: ${missing.join(', ')}` });
    }

    // Align with updated schema: column is `room_id` (FK), and dates are DATE/TIMESTAMP
    const normalizedCheckIn = String(checkIn).slice(0, 10); // YYYY-MM-DD
    const normalizedCheckOut = String(checkOut).slice(0, 10); // YYYY-MM-DD
    const numericRoomId = Number(roomId);
    const numericGuests = Number(guests);

    // For guest bookings (no login), set user_id to NULL since there's no authenticated user
    // Let MySQL default fill bookingDate
    const sql = `INSERT INTO bookings (bookingId, user_id, room_id, roomName, guestName, guestContact, checkIn, checkOut, guests, totalPrice, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [bookingId, null, numericRoomId, roomName, guestName, guestContact, normalizedCheckIn, normalizedCheckOut, numericGuests, priceNumber, status];

    console.log('Executing booking query:', sql, values);
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Database error during booking:', err);
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        
        console.log('Booking inserted successfully:', result);
        
        // After booking, also mark the room as booked
        const updateSql = "UPDATE rooms SET status = ? WHERE id = ?";
        db.query(updateSql, ['booked', roomId], (uErr) => {
            if (uErr) {
                console.warn('Failed to update room status after booking:', uErr);
            } else {
                console.log('Room status updated to booked for room:', roomId);
            }
            // Return the saved booking
            return res.status(201).json({
                bookingId,
                roomId: numericRoomId,
                roomName,
                guestName,
                guestContact,
                checkIn: normalizedCheckIn,
                checkOut: normalizedCheckOut,
                guests: numericGuests,
                totalPrice: priceNumber,
                status
            });
        });
    });
});

app.listen(8081, () => {
    console.log("Server is running on port 8081")
})

// Get all bookings for admin panel
app.get("/api/bookings", (req, res) => {
    const status = req.query.status;
    let sql = "SELECT b.*, r.room_number FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id";
    let params = [];
    
    if (status && status !== 'all') {
        sql += " WHERE b.status = ?";
        params.push(status);
    }
    
    sql += " ORDER BY b.bookingDate DESC";
    
    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        return res.status(200).json(results);
    });
});

// Update booking status (approve/decline)
app.patch("/api/bookings/:bookingId", (req, res) => {
    const { bookingId } = req.params;
    const { status } = req.body;
    if (!bookingId || !status) {
        return res.status(400).json({ error: "Missing bookingId or status." });
    }
    
    // First get the room_id for this booking
    const getRoomSql = "SELECT room_id FROM bookings WHERE bookingId = ?";
    db.query(getRoomSql, [bookingId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: "Booking not found" });
        }
        
        const roomId = rows[0].room_id;
        
        // Update booking status
        const updateBookingSql = "UPDATE bookings SET status = ? WHERE bookingId = ?";
        db.query(updateBookingSql, [status, bookingId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.code || err.message || "Database error" });
            }
            
            // If booking is approved/confirmed, mark room as booked
            if (status === 'confirmed' || status === 'approved') {
                const updateRoomSql = "UPDATE rooms SET status = 'booked' WHERE id = ?";
                db.query(updateRoomSql, [roomId], (roomErr) => {
                    if (roomErr) {
                        console.warn('Failed to update room status after booking approval:', roomErr);
                    }
                    return res.status(200).json({ success: true });
                });
            } else if (status === 'declined' || status === 'cancelled') {
                // If booking is declined/cancelled, mark room as available
                const updateRoomSql = "UPDATE rooms SET status = 'available' WHERE id = ?";
                db.query(updateRoomSql, [roomId], (roomErr) => {
                    if (roomErr) {
                        console.warn('Failed to update room status after booking decline/cancel:', roomErr);
                    }
                    return res.status(200).json({ success: true });
                });
            } else {
                return res.status(200).json({ success: true });
            }
        });
    });
});

// Get all amenities
app.get("/api/amenities", (req, res) => {
    const sql = "SELECT * FROM amenities ORDER BY name";
    db.query(sql, [], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        return res.status(200).json(results);
    });
});

// Add new amenity
app.post("/api/amenities", (req, res) => {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: "Amenity name is required" });
    }
    
    const sql = "INSERT INTO amenities (name) VALUES (?)";
    db.query(sql, [name.trim()], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: "Amenity already exists" });
            }
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        return res.status(201).json({ 
            id: result.insertId, 
            name: name.trim(),
            message: "Amenity created successfully" 
        });
    });
});

// Delete amenity
app.delete("/api/amenities/:id", (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ error: "Amenity ID is required" });
    }
    
    // Check if any rooms are using this amenity
    const checkSql = "SELECT COUNT(*) as count FROM room_amenities WHERE amenity_id = ?";
    db.query(checkSql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        
        if (results[0].count > 0) {
            return res.status(400).json({ 
                error: "Cannot delete amenity. There are rooms using this amenity." 
            });
        }
        
        // Delete the amenity
        const deleteSql = "DELETE FROM amenities WHERE id = ?";
        db.query(deleteSql, [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.code || err.message || "Database error" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Amenity not found" });
            }
            return res.status(200).json({ message: "Amenity deleted successfully" });
        });
    });
});

// Rooms: list all rooms with amenities and images
app.get("/api/rooms", (req, res) => {
    const sql = `
        SELECT 
            r.*,
            rt.type_name,
            GROUP_CONCAT(DISTINCT a.name) as amenity_names,
            GROUP_CONCAT(DISTINCT ri.image_url) as room_images
        FROM rooms r
        LEFT JOIN room_type rt ON r.room_type_id = rt.id
        LEFT JOIN room_amenities ra ON r.id = ra.room_id
        LEFT JOIN amenities a ON ra.amenity_id = a.id
        LEFT JOIN room_images ri ON r.id = ri.room_id
        GROUP BY r.id
        ORDER BY r.id DESC
    `;
    
    db.query(sql, [], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        
        // Process results to format amenities and images
        const rooms = (results || []).map((row) => {
            const id = row.id;
            const room_number = row.room_number;
            const room_type_id = row.room_type_id;
            const type_name = row.type_name;
            const description = row.description;
            const rating = Number(row.rating) || 0;
            const status = row.status || "available";
            const beds = Number(row.beds) || 0;
            const bathrooms = Number(row.bathrooms) || 0;
            const price = Number(row.price) || 0;
            const original_price = row.original_price;
            const guests = Number(row.guests) || 0;
            const size = row.size || "";
            const category = row.category;
            const reviews = Number(row.reviews) || 0;
            const image = row.image;
            const created_at = row.created_at;
            const updated_at = row.updated_at;

            // Parse amenities from comma-separated string
            const amenities = row.amenity_names ? row.amenity_names.split(',') : [];
            
            // Parse images from comma-separated string
            const images = row.room_images ? row.room_images.split(',') : [];
            // If no room_images but has main image, use that
            if (images.length === 0 && image) {
                images.push(image);
            }
            
            // Convert relative paths to full URLs
            const fullImageUrls = images.map(img => {
                if (img && img.startsWith('/uploads/')) {
                    return `http://localhost:8081${img}`;
                }
                return img;
            });
            
            // Debug: log image data
            console.log(`Room ${id} images:`, fullImageUrls.length, fullImageUrls.slice(0, 1));

            return {
                id,
                room_number,
                room_type_id,
                type_name,
                category,
                image,
                price,
                original_price,
                status,
                rating,
                guests,
                size,
                description,
                beds,
                bathrooms,
                reviews,
                amenities,
                images: fullImageUrls,
                created_at,
                updated_at
            };
        });
        
        return res.status(200).json(rooms);
    });
});

// Get single room with amenities and images
app.get("/api/rooms/:id", (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT 
            r.*,
            rt.type_name,
            GROUP_CONCAT(DISTINCT a.name) as amenity_names,
            GROUP_CONCAT(DISTINCT ri.image_url) as room_images
        FROM rooms r
        LEFT JOIN room_type rt ON r.room_type_id = rt.id
        LEFT JOIN room_amenities ra ON r.id = ra.room_id
        LEFT JOIN amenities a ON ra.amenity_id = a.id
        LEFT JOIN room_images ri ON r.id = ri.room_id
        WHERE r.id = ?
        GROUP BY r.id
    `;
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        
        if (!results || results.length === 0) {
            return res.status(404).json({ error: "Room not found" });
        }
        
        const row = results[0];
        
        // Parse amenities and images
        const amenities = row.amenity_names ? row.amenity_names.split(',') : [];
        const images = row.room_images ? row.room_images.split(',') : [];
        if (images.length === 0 && row.image) {
            images.push(row.image);
        }
        
        // Convert relative paths to full URLs
        const fullImageUrls = images.map(img => {
            if (img && img.startsWith('/uploads/')) {
                return `http://localhost:8081${img}`;
            }
            return img;
        });
        
        const room = {
            id: row.id,
            room_number: row.room_number,
            room_type_id: row.room_type_id,
            type_name: row.type_name,
            category: row.category,
            image: row.image,
            price: Number(row.price) || 0,
            original_price: row.original_price,
            status: row.status || "available",
            rating: Number(row.rating) || 0,
            guests: Number(row.guests) || 0,
            size: row.size || "",
            description: row.description,
            beds: Number(row.beds) || 0,
            bathrooms: Number(row.bathrooms) || 0,
            reviews: Number(row.reviews) || 0,
            amenities,
            images: fullImageUrls,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
        
        return res.status(200).json(room);
    });
});

// Rooms: create a new room with amenities and images using Multer
app.post("/api/rooms", upload.array('images', 5), (req, res) => {
    const body = req.body || {};
    const uploadedFiles = req.files || [];
    
    console.log('Received room creation request:', {
        room_number: body.room_number,
        room_type_id: body.room_type_id,
        uploadedFilesCount: uploadedFiles.length,
        amenitiesCount: body.amenities?.length || 0,
        allFields: Object.keys(body)
    });

    const room_number = body.room_number ?? null;
    const room_type_id = body.room_type_id ?? null;
    const description = body.description ?? "";
    const rating = Number(body.rating ?? 0);
    const status = body.status ?? "available";
    const beds = Number(body.beds ?? 1);
    const bathrooms = Number(body.bathrooms ?? 1);
    const reviews = Number(body.reviews ?? 0);
    const size = body.size ?? "";
    const category = body.category ?? "Standard";
    const price = Number(body.price ?? 0);
    const original_price = body.original_price ?? null;
    const guests = Number(body.guests ?? 1);
    
    // Get image URLs from uploaded files
    const imageUrls = uploadedFiles.map(file => `/uploads/${file.filename}`);
    const image = imageUrls[0] ?? null;
    
    // Parse amenities from form data
    const amenities = body.amenities ? 
        (Array.isArray(body.amenities) ? body.amenities : [body.amenities]) : 
        [];

    if (!room_type_id) {
        return res.status(400).json({ error: "Missing required field: room_type_id" });
    }

    // Start transaction
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to start transaction" });
        }

        // Get room type name for the name field
        const getRoomTypeSql = "SELECT type_name FROM room_type WHERE id = ?";
        db.query(getRoomTypeSql, [room_type_id], (err, typeResults) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ error: err.code || err.message || "Database error" });
                });
            }

            const roomTypeName = typeResults && typeResults.length > 0 ? typeResults[0].type_name : 'Room';
            
            // Insert room
            const roomSql = `INSERT INTO rooms (
                name, room_number, room_type_id, category, image, price, original_price,
                status, rating, guests, size, description,
                beds, bathrooms, reviews, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

            const roomValues = [
                roomTypeName, room_number, room_type_id, category, image, price, original_price,
                status, rating, guests, size, description,
                beds, bathrooms, reviews
            ];

            db.query(roomSql, roomValues, (err, result) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ error: err.code || err.message || "Database error" });
                });
            }

            const roomId = result.insertId;

            // Insert amenities
            if (amenities.length > 0) {
                const amenityPromises = amenities.map(amenityName => {
                    return new Promise((resolve, reject) => {
                        // First, get or create amenity
                        const getAmenitySql = "SELECT id FROM amenities WHERE name = ?";
                        db.query(getAmenitySql, [amenityName], (err, results) => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            let amenityId;
                            if (results.length > 0) {
                                amenityId = results[0].id;
                                resolve(amenityId);
                            } else {
                                // Create new amenity
                                const createAmenitySql = "INSERT INTO amenities (name) VALUES (?)";
                                db.query(createAmenitySql, [amenityName], (err, result) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    resolve(result.insertId);
                                });
                            }
                        });
                    });
                });

                Promise.all(amenityPromises).then(amenityIds => {
                    // Insert room-amenity relationships
                    const roomAmenityPromises = amenityIds.map(amenityId => {
                        return new Promise((resolve, reject) => {
                            const roomAmenitySql = "INSERT INTO room_amenities (room_id, amenity_id) VALUES (?, ?)";
                            db.query(roomAmenitySql, [roomId, amenityId], (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    });

                    Promise.all(roomAmenityPromises).then(() => {
                        // Insert room images
                        if (imageUrls.length > 0) {
                            const imagePromises = imageUrls.map((imageUrl) => {
                                return new Promise((resolve, reject) => {
                                    const imageSql = "INSERT INTO room_images (room_id, image_url) VALUES (?, ?)";
                                    db.query(imageSql, [roomId, imageUrl], (err) => {
                                        if (err) {
                                            reject(err);
                                        } else {
                                            resolve();
                                        }
                                    });
                                });
                            });

                            Promise.all(imagePromises).then(() => {
                                db.commit((err) => {
                                    if (err) {
                                        return db.rollback(() => {
                                            res.status(500).json({ error: "Failed to commit transaction" });
                                        });
                                    }
                                    res.status(201).json({ id: roomId });
                                });
                            }).catch(err => {
                                db.rollback(() => {
                                    res.status(500).json({ error: err.message });
                                });
                            });
                        } else {
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ error: "Failed to commit transaction" });
                                    });
                                }
                                res.status(201).json({ id: roomId });
                            });
                        }
                    }).catch(err => {
                        db.rollback(() => {
                            res.status(500).json({ error: err.message });
                        });
                    });
                }).catch(err => {
                    db.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                });
            } else {
                // No amenities, just insert images
                if (imageUrls.length > 0) {
                    const imagePromises = imageUrls.map((imageUrl) => {
                        return new Promise((resolve, reject) => {
                            const imageSql = "INSERT INTO room_images (room_id, image_url) VALUES (?, ?)";
                            db.query(imageSql, [roomId, imageUrl], (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    });

                    Promise.all(imagePromises).then(() => {
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: "Failed to commit transaction" });
                                });
                            }
                            res.status(201).json({ id: roomId });
                        });
                    }).catch(err => {
                        db.rollback(() => {
                            res.status(500).json({ error: err.message });
                        });
                    });
                } else {
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: "Failed to commit transaction" });
                            });
                        }
                        res.status(201).json({ id: roomId });
                    });
                }
            }
        });
        });
    });
});

// Update room (metadata and amenities)
app.patch("/api/rooms/:id", (req, res) => {
    const { id } = req.params;
    const body = req.body || {};

    if (!id) return res.status(400).json({ error: "Room ID is required" });

    // Validate status if provided
    const validStatuses = ['available', 'booked', 'maintenance', 'unavailable'];
    
    if (body.status && !validStatuses.includes(body.status.toLowerCase())) {
        return res.status(400).json({ 
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
    }
    
    // Normalize status to lowercase
    if (body.status) {
        body.status = body.status.toLowerCase();
    }

    const allowed = [
        'room_number','room_type_id','category','description','rating','status','beds','bathrooms','price','original_price','guests','size'
    ];
    const fields = [];
    const values = [];

    allowed.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
            fields.push(`${key} = ?`);
            // Cast numerics appropriately
            if (["rating","beds","bathrooms","price","guests"].includes(key)) {
                values.push(Number(body[key] ?? 0));
            } else {
                values.push(body[key] ?? null);
            }
        }
    });

    if (fields.length === 0 && !body.amenities) {
        return res.status(400).json({ error: "No updatable fields provided" });
    }

    // Start transaction to handle both room updates and amenity updates
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to start transaction" });
        }

        // Update basic room fields if any
        const updateRoomFields = () => {
            return new Promise((resolve, reject) => {
                if (fields.length === 0) {
                    resolve();
                    return;
                }
                
                const sql = `UPDATE rooms SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
                const updateValues = [...values, Number(id)];
                
                db.query(sql, updateValues, (err, result) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (result.affectedRows === 0) {
                        reject(new Error("Room not found"));
                        return;
                    }
                    resolve();
                });
            });
        };

        // Update amenities if provided
        const updateAmenities = () => {
            return new Promise((resolve, reject) => {
                if (!body.amenities || !Array.isArray(body.amenities)) {
                    resolve();
                    return;
                }

                const amenities = body.amenities;

                // First, delete existing room-amenity relationships
                const deleteRoomAmenitiesSql = "DELETE FROM room_amenities WHERE room_id = ?";
                db.query(deleteRoomAmenitiesSql, [id], (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // If no amenities to add, we're done
                    if (amenities.length === 0) {
                        resolve();
                        return;
                    }

                    // Get or create amenity IDs
                    const amenityPromises = amenities.map(amenityName => {
                        return new Promise((resolveAmenity, rejectAmenity) => {
                            const getAmenitySql = "SELECT id FROM amenities WHERE name = ?";
                            db.query(getAmenitySql, [amenityName], (err, results) => {
                                if (err) {
                                    rejectAmenity(err);
                                    return;
                                }

                                if (results.length > 0) {
                                    resolveAmenity(results[0].id);
                                } else {
                                    // Create new amenity
                                    const createAmenitySql = "INSERT INTO amenities (name) VALUES (?)";
                                    db.query(createAmenitySql, [amenityName], (err, result) => {
                                        if (err) {
                                            rejectAmenity(err);
                                            return;
                                        }
                                        resolveAmenity(result.insertId);
                                    });
                                }
                            });
                        });
                    });

                    Promise.all(amenityPromises).then(amenityIds => {
                        // Insert new room-amenity relationships
                        const roomAmenityPromises = amenityIds.map(amenityId => {
                            return new Promise((resolveRA, rejectRA) => {
                                const roomAmenitySql = "INSERT INTO room_amenities (room_id, amenity_id) VALUES (?, ?)";
                                db.query(roomAmenitySql, [id, amenityId], (err) => {
                                    if (err) {
                                        rejectRA(err);
                                    } else {
                                        resolveRA();
                                    }
                                });
                            });
                        });

                        Promise.all(roomAmenityPromises).then(() => {
                            resolve();
                        }).catch(err => {
                            reject(err);
                        });
                    }).catch(err => {
                        reject(err);
                    });
                });
            });
        };

        // Execute updates
        Promise.all([updateRoomFields(), updateAmenities()])
            .then(() => {
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: "Failed to commit transaction" });
                        });
                    }
                    res.status(200).json({ success: true });
                });
            })
            .catch(err => {
                db.rollback(() => {
                    if (err.message === "Room not found") {
                        res.status(404).json({ error: "Room not found" });
                    } else {
                        res.status(500).json({ error: err.code || err.message || "Database error" });
                    }
                });
            });
    });
});

// Room Types API endpoints
// Get all room types
app.get("/api/room-types", (req, res) => {
    const sql = "SELECT * FROM room_type ORDER BY type_name";
    db.query(sql, [], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        return res.status(200).json(results || []);
    });
});

// Add new room type
app.post("/api/room-types", (req, res) => {
    const { type_name } = req.body;
    
    if (!type_name || !type_name.trim()) {
        return res.status(400).json({ error: "Room type name is required" });
    }
    
    const sql = "INSERT INTO room_type (type_name) VALUES (?)";
    db.query(sql, [type_name.trim()], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: "Room type already exists" });
            }
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        return res.status(201).json({ 
            id: result.insertId, 
            type_name: type_name.trim(),
            message: "Room type created successfully" 
        });
    });
});

// Delete room type
app.delete("/api/room-types/:id", (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ error: "Room type ID is required" });
    }
    
    // Check if any rooms are using this room type
    const checkSql = "SELECT COUNT(*) as count FROM rooms WHERE room_type_id = ?";
    db.query(checkSql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        
        if (results[0].count > 0) {
            return res.status(400).json({ 
                error: "Cannot delete room type. There are rooms using this type." 
            });
        }
        
        // Delete the room type
        const deleteSql = "DELETE FROM room_type WHERE id = ?";
        db.query(deleteSql, [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.code || err.message || "Database error" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Room type not found" });
            }
            return res.status(200).json({ message: "Room type deleted successfully" });
        });
    });
});

// Room Categories API endpoints
// Get all room categories
app.get("/api/room-categories", (req, res) => {
    const sql = "SELECT * FROM room_category ORDER BY category_name";
    db.query(sql, [], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        return res.status(200).json(results || []);
    });
});

// Add new room category
app.post("/api/room-categories", (req, res) => {
    const { category_name } = req.body;
    
    if (!category_name || !category_name.trim()) {
        return res.status(400).json({ error: "Room category name is required" });
    }
    
    const sql = "INSERT INTO room_category (category_name) VALUES (?)";
    db.query(sql, [category_name.trim()], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: "Room category already exists" });
            }
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        return res.status(201).json({ 
            id: result.insertId, 
            category_name: category_name.trim(),
            message: "Room category created successfully" 
        });
    });
});

// Delete room category
app.delete("/api/room-categories/:id", (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ error: "Room category ID is required" });
    }
    
    // Check if any rooms are using this room category
    const checkSql = "SELECT COUNT(*) as count FROM rooms WHERE category = (SELECT category_name FROM room_category WHERE id = ?)";
    db.query(checkSql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        
        if (results[0].count > 0) {
            return res.status(400).json({ 
                error: "Cannot delete room category. There are rooms using this category." 
            });
        }
        
        // Delete the room category
        const deleteSql = "DELETE FROM room_category WHERE id = ?";
        db.query(deleteSql, [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.code || err.message || "Database error" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Room category not found" });
            }
            return res.status(200).json({ message: "Room category deleted successfully" });
        });
    });
});

// Migration endpoint to update all room statuses to the correct format
app.patch("/api/rooms/migrate-status", (req, res) => {
    const statusUpdates = [
        { from: 'Available', to: 'available' },
        { from: 'Occupied', to: 'booked' },
        { from: 'Maintenance', to: 'maintenance' },
        { from: 'Cleaning', to: 'unavailable' }
    ];
    
    let completed = 0;
    let total = statusUpdates.length;
    
    statusUpdates.forEach(({ from, to }) => {
        const sql = "UPDATE rooms SET status = ? WHERE status = ?";
        db.query(sql, [to, from], (err, result) => {
            if (err) {
                console.error(`Failed to update status from ${from} to ${to}:`, err);
            } else {
                console.log(`Updated ${result.affectedRows} rooms from ${from} to ${to}`);
            }
            
            completed++;
            if (completed === total) {
                return res.status(200).json({ 
                    success: true, 
                    message: "Room status migration completed" 
                });
            }
        });
    });
});

// Migration endpoint to hash all existing plaintext passwords
// This should be called once after deploying the password hashing changes
app.post("/api/migrate-passwords", async (req, res) => {
    try {
        // Get all user accounts
        const getUsersSql = "SELECT id, password FROM user_account";
        db.query(getUsersSql, [], async (err, users) => {
            if (err) {
                return res.status(500).json({ error: "Failed to fetch user accounts" });
            }

            // Get all admin accounts
            const getAdminsSql = "SELECT admin_email, admin_password FROM admin_account";
            db.query(getAdminsSql, [], async (err, admins) => {
                if (err) {
                    return res.status(500).json({ error: "Failed to fetch admin accounts" });
                }

                let usersUpdated = 0;
                let adminsUpdated = 0;
                let errors = [];

                // Hash user passwords
                for (const user of users || []) {
                    try {
                        // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
                        if (user.password && !user.password.startsWith('$2')) {
                            const hashedPassword = await bcrypt.hash(user.password, 10);
                            const updateSql = "UPDATE user_account SET password = ? WHERE id = ?";
                            await new Promise((resolve, reject) => {
                                db.query(updateSql, [hashedPassword, user.id], (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            });
                            usersUpdated++;
                        }
                    } catch (error) {
                        errors.push(`Failed to hash password for user ID ${user.id}: ${error.message}`);
                    }
                }

                // Hash admin passwords
                for (const admin of admins || []) {
                    try {
                        // Check if password is already hashed
                        if (admin.admin_password && !admin.admin_password.startsWith('$2')) {
                            const hashedPassword = await bcrypt.hash(admin.admin_password, 10);
                            const updateSql = "UPDATE admin_account SET admin_password = ? WHERE admin_email = ?";
                            await new Promise((resolve, reject) => {
                                db.query(updateSql, [hashedPassword, admin.admin_email], (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            });
                            adminsUpdated++;
                        }
                    } catch (error) {
                        errors.push(`Failed to hash password for admin ${admin.admin_email}: ${error.message}`);
                    }
                }

                return res.status(200).json({
                    success: true,
                    message: "Password migration completed",
                    usersUpdated,
                    adminsUpdated,
                    errors: errors.length > 0 ? errors : undefined
                });
            });
        });
    } catch (error) {
        return res.status(500).json({ error: "Migration failed: " + error.message });
    }
});

// Delete room and its associated data
app.delete("/api/rooms/:id", (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ error: "Room ID is required" });
    }
    
    // Start transaction
    db.beginTransaction(async (err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to start transaction" });
        }
        
        try {
            // First, get the room images to delete files
            const getImagesSql = "SELECT image_url FROM room_images WHERE room_id = ?";
            db.query(getImagesSql, [id], (err, imageResults) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                }
                
                // Delete image files from uploads directory
                const imageFiles = imageResults || [];
                imageFiles.forEach(img => {
                    if (img.image_url && img.image_url.startsWith('/uploads/')) {
                        const filePath = path.join(__dirname, img.image_url);
                        if (fs.existsSync(filePath)) {
                            try {
                                fs.unlinkSync(filePath);
                                console.log(`Deleted image file: ${filePath}`);
                            } catch (fileErr) {
                                console.warn(`Failed to delete image file: ${filePath}`, fileErr);
                            }
                        }
                    }
                });
                
                // Delete room images from database
                const deleteImagesSql = "DELETE FROM room_images WHERE room_id = ?";
                db.query(deleteImagesSql, [id], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: err.message });
                        });
                    }
                    
                    // Delete room amenities
                    const deleteAmenitiesSql = "DELETE FROM room_amenities WHERE room_id = ?";
                    db.query(deleteAmenitiesSql, [id], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: err.message });
                            });
                        }
                        
                        // Finally, delete the room
                        const deleteRoomSql = "DELETE FROM rooms WHERE id = ?";
                        db.query(deleteRoomSql, [id], (err, result) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: err.message });
                                });
                            }
                            
                            if (result.affectedRows === 0) {
                                return db.rollback(() => {
                                    res.status(404).json({ error: "Room not found" });
                                });
                            }
                            
                            // Commit transaction
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ error: "Failed to commit transaction" });
                                    });
                                }
                                
                                res.status(200).json({ 
                                    success: true, 
                                    message: "Room and associated data deleted successfully",
                                    deletedFiles: imageFiles.length
                                });
                            });
                        });
                    });
                });
            });
        } catch (error) {
            db.rollback(() => {
                res.status(500).json({ error: error.message });
            });
        }
    });
});

// List available rooms for a given date range and guest count
// GET /api/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&guests=1
app.get("/api/availability", (req, res) => {
    const { checkIn, checkOut, guests } = req.query || {};
    if (!checkIn || !checkOut) {
        return res.status(400).json({ error: "checkIn and checkOut are required (YYYY-MM-DD)" });
    }
    const minGuests = Number(guests ?? 1);

    // Consider these statuses as occupying the room
    const occupyingStatuses = ['pending','confirmed','checked_in'];

    const sql = `
        SELECT r.*
        FROM rooms r
        WHERE (r.guests IS NULL OR r.guests >= ?)
          AND (r.status IS NULL OR r.status <> 'maintenance')
          AND r.id NOT IN (
            SELECT b.room_id
            FROM bookings b
            WHERE b.status IN (${occupyingStatuses.map(() => '?').join(',')})
              AND (DATE(?) < b.checkOut) AND (DATE(?) > b.checkIn)
          )
        ORDER BY r.price ASC, r.id DESC
    `;

    const params = [minGuests, ...occupyingStatuses, checkOut, checkIn];

    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Map image URLs similarly as in /api/rooms if needed
        const mapped = (rows || []).map(row => ({
            ...row,
            // ensure price is numeric in the client
            price: Number(row.price) || 0
        }));
        res.json(mapped);
    });
});

// Check-in booking: sets booking.status=checked_in and room.status=booked
app.patch("/api/bookings/:bookingId/check-in", (req, res) => {
    const { bookingId } = req.params;
    if (!bookingId) return res.status(400).json({ error: "bookingId required" });

    const getSql = "SELECT room_id FROM bookings WHERE bookingId = ? LIMIT 1";
    db.query(getSql, [bookingId], (gErr, rows) => {
        if (gErr) return res.status(500).json({ error: gErr.message });
        if (!rows?.length) return res.status(404).json({ error: "Booking not found" });
        const roomId = rows[0].room_id;

        db.beginTransaction(err => {
            if (err) return res.status(500).json({ error: "Failed to start transaction" });
            const updBooking = "UPDATE bookings SET status = 'checked_in' WHERE bookingId = ?";
            db.query(updBooking, [bookingId], (bErr) => {
                if (bErr) return db.rollback(() => res.status(500).json({ error: bErr.message }));
                const updRoom = "UPDATE rooms SET status = 'booked' WHERE id = ?";
                db.query(updRoom, [roomId], (rErr) => {
                    if (rErr) return db.rollback(() => res.status(500).json({ error: rErr.message }));
                    db.commit(cErr => {
                        if (cErr) return db.rollback(() => res.status(500).json({ error: "Failed to commit" }));
                        return res.json({ success: true });
                    });
                });
            });
        });
    });
});

// Check-out booking: sets booking.status=completed and room.status=available
app.patch("/api/bookings/:bookingId/check-out", (req, res) => {
    const { bookingId } = req.params;
    if (!bookingId) return res.status(400).json({ error: "bookingId required" });

    const getSql = "SELECT room_id FROM bookings WHERE bookingId = ? LIMIT 1";
    db.query(getSql, [bookingId], (gErr, rows) => {
        if (gErr) return res.status(500).json({ error: gErr.message });
        if (!rows?.length) return res.status(404).json({ error: "Booking not found" });
        const roomId = rows[0].room_id;

        db.beginTransaction(err => {
            if (err) return res.status(500).json({ error: "Failed to start transaction" });
            const updBooking = "UPDATE bookings SET status = 'completed' WHERE bookingId = ?";
            db.query(updBooking, [bookingId], (bErr) => {
                if (bErr) return db.rollback(() => res.status(500).json({ error: bErr.message }));
                const updRoom = "UPDATE rooms SET status = 'available' WHERE id = ?";
                db.query(updRoom, [roomId], (rErr) => {
                    if (rErr) return db.rollback(() => res.status(500).json({ error: rErr.message }));
                    db.commit(cErr => {
                        if (cErr) return db.rollback(() => res.status(500).json({ error: "Failed to commit" }));
                        return res.json({ success: true });
                    });
                });
            });
        });
    });
});

// Delete booking (admin only)
app.delete("/api/bookings/:bookingId", (req, res) => {
    const { bookingId } = req.params;
    if (!bookingId) return res.status(400).json({ error: "bookingId required" });

    // First get the booking details to know which room to update
    const getSql = "SELECT room_id, status FROM bookings WHERE bookingId = ? LIMIT 1";
    db.query(getSql, [bookingId], (gErr, rows) => {
        if (gErr) return res.status(500).json({ error: gErr.message });
        if (!rows?.length) return res.status(404).json({ error: "Booking not found" });
        
        const roomId = rows[0].room_id;
        const bookingStatus = rows[0].status;
        
        // Start transaction
        db.beginTransaction(err => {
            if (err) return res.status(500).json({ error: "Failed to start transaction" });
            
            // Delete the booking
            const deleteSql = "DELETE FROM bookings WHERE bookingId = ?";
            db.query(deleteSql, [bookingId], (dErr, result) => {
                if (dErr) return db.rollback(() => res.status(500).json({ error: dErr.message }));
                
                // If booking was in a state that occupied the room, mark room as available
                const occupyingStatuses = ['pending', 'confirmed', 'checked_in'];
                if (occupyingStatuses.includes(bookingStatus)) {
                    const updateRoomSql = "UPDATE rooms SET status = 'available' WHERE id = ?";
                    db.query(updateRoomSql, [roomId], (rErr) => {
                        if (rErr) return db.rollback(() => res.status(500).json({ error: rErr.message }));
                        
                        db.commit(cErr => {
                            if (cErr) return db.rollback(() => res.status(500).json({ error: "Failed to commit" }));
                            return res.json({ success: true, message: "Booking deleted successfully" });
                        });
                    });
                } else {
                    // Booking didn't occupy room, just commit the deletion
                    db.commit(cErr => {
                        if (cErr) return db.rollback(() => res.status(500).json({ error: "Failed to commit" }));
                        return res.json({ success: true, message: "Booking deleted successfully" });
                    });
                }
            });
        });
    });
});
