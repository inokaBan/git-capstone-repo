require('dotenv').config();

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
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "osner_db"
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
    const { username, email, password, fullname, gender, age, address, contactNumber } = req.body || {};

    if (!username || !email || !password || !fullname) {
        return res.status(400).json({ error: "Missing required fields: username, email, password, and fullname are required." });
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

        // Start transaction to insert both user_account and customer_info
        db.beginTransaction((err) => {
            if (err) {
                return res.status(500).json({ error: "Failed to start transaction" });
            }

            // Insert into user_account
            const userSql = "INSERT INTO user_account (username, email, password) VALUES (?)";
            const userValues = [username, email, hashedPassword];

            db.query(userSql, [userValues], (err, userData) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err.code || err.message || "Database error" });
                    });
                }

                const userId = userData.insertId;

                // Insert into customer_info
                const customerSql = "INSERT INTO customer_info (user_id, full_name, gender, age, address, contact_number) VALUES (?, ?, ?, ?, ?, ?)";
                const customerValues = [
                    userId,
                    fullname,
                    gender || null,
                    age ? parseInt(age) : null,
                    address || null,
                    contactNumber || null
                ];

                db.query(customerSql, customerValues, (err, customerData) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: err.code || err.message || "Failed to save customer information" });
                        });
                    }

                    // Commit transaction
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: "Failed to commit transaction" });
                            });
                        }

                        return res.status(201).json({ 
                            insertId: userId, 
                            affectedRows: userData.affectedRows,
                            message: "Registration successful" 
                        });
                    });
                });
            });
        });
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

        // If not admin or password didn't match, check user_account table with customer_info
        const userSql = `
            SELECT 
                u.id, 
                u.username, 
                u.email, 
                u.password, 
                u.role,
                c.full_name,
                c.gender,
                c.age,
                c.address,
                c.contact_number
            FROM user_account u
            LEFT JOIN customer_info c ON u.id = c.user_id
            WHERE u.email = ? 
            LIMIT 1
        `;
        
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
                                email: user.email,
                                full_name: user.full_name,
                                gender: user.gender,
                                age: user.age,
                                address: user.address,
                                contact_number: user.contact_number
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

// Helper function to deduct room inventory from warehouse stock
// This should be called when a room is booked or checked in
const deductRoomInventoryFromWarehouse = async (roomId, bookingId, reason) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Get all items in the room inventory
            const getRoomInventorySql = `
                SELECT ri.item_id, ri.current_quantity, i.name as item_name, i.unit
                FROM room_inventory ri
                JOIN inventory_items i ON ri.item_id = i.id
                WHERE ri.room_id = ? AND ri.current_quantity > 0
            `;
            
            db.query(getRoomInventorySql, [roomId], async (err, roomItems) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (!roomItems || roomItems.length === 0) {
                    // No items in room inventory, nothing to deduct
                    resolve({ itemsDeducted: 0, message: 'No items in room inventory' });
                    return;
                }
                
                // Get room name for logging
                const getRoomSql = "SELECT name, room_number FROM rooms WHERE id = ?";
                const roomResult = await new Promise((resolveRoom, rejectRoom) => {
                    db.query(getRoomSql, [roomId], (err, results) => {
                        if (err) rejectRoom(err);
                        else resolveRoom(results);
                    });
                });
                
                const roomName = roomResult && roomResult.length > 0 
                    ? `${roomResult[0].name} (${roomResult[0].room_number})` 
                    : `Room ${roomId}`;
                
                let itemsDeducted = 0;
                let errors = [];
                
                // Deduct each item from warehouse
                for (const item of roomItems) {
                    try {
                        // Check warehouse stock
                        const checkWarehouseSql = "SELECT quantity FROM warehouse_inventory WHERE item_id = ?";
                        const warehouseResult = await new Promise((resolveWh, rejectWh) => {
                            db.query(checkWarehouseSql, [item.item_id], (err, results) => {
                                if (err) rejectWh(err);
                                else resolveWh(results);
                            });
                        });
                        
                        if (!warehouseResult || warehouseResult.length === 0) {
                            errors.push(`Item ${item.item_name} not found in warehouse`);
                            continue;
                        }
                        
                        const currentWarehouseStock = warehouseResult[0].quantity;
                        
                        if (currentWarehouseStock < item.current_quantity) {
                            errors.push(`Insufficient warehouse stock for ${item.item_name}. Available: ${currentWarehouseStock}, Required: ${item.current_quantity}`);
                            continue;
                        }
                        
                        // Deduct from warehouse
                        const newWarehouseStock = currentWarehouseStock - item.current_quantity;
                        const updateWarehouseSql = "UPDATE warehouse_inventory SET quantity = ?, last_updated = NOW() WHERE item_id = ?";
                        await new Promise((resolveUpd, rejectUpd) => {
                            db.query(updateWarehouseSql, [newWarehouseStock, item.item_id], (err) => {
                                if (err) rejectUpd(err);
                                else resolveUpd();
                            });
                        });
                        
                        // Log the transaction
                        const logSql = `INSERT INTO inventory_log (item_id, change_quantity, new_stock_level, reason, related_booking_id, notes, logged_by) 
                                       VALUES (?, ?, ?, ?, ?, ?, ?)`;
                        const notes = `Deducted ${item.current_quantity} ${item.unit} for ${roomName}`;
                        await new Promise((resolveLog, rejectLog) => {
                            db.query(logSql, [item.item_id, -item.current_quantity, newWarehouseStock, reason, bookingId, notes, 1], (err) => {
                                if (err) rejectLog(err);
                                else resolveLog();
                            });
                        });
                        
                        // Check if we need to create low stock alert for warehouse
                        const getItemSql = "SELECT low_stock_threshold FROM inventory_items WHERE id = ?";
                        const itemResult = await new Promise((resolveItem, rejectItem) => {
                            db.query(getItemSql, [item.item_id], (err, results) => {
                                if (err) rejectItem(err);
                                else resolveItem(results);
                            });
                        });
                        
                        if (itemResult && itemResult.length > 0) {
                            const threshold = itemResult[0].low_stock_threshold;
                            if (newWarehouseStock <= threshold && newWarehouseStock > 0) {
                                const alertSql = `INSERT INTO inventory_alerts (alert_type, item_id, message, severity, created_at) 
                                                 VALUES ('low_stock', ?, ?, 'warning', NOW())`;
                                const alertMessage = `Warehouse stock is low (${newWarehouseStock} remaining, threshold: ${threshold})`;
                                await new Promise((resolveAlert) => {
                                    db.query(alertSql, [item.item_id, alertMessage], (err) => {
                                        if (err) console.error('Failed to create alert:', err);
                                        resolveAlert();
                                    });
                                });
                            } else if (newWarehouseStock === 0) {
                                const alertSql = `INSERT INTO inventory_alerts (alert_type, item_id, message, severity, created_at) 
                                                 VALUES ('out_of_stock', ?, 'Warehouse is out of stock', 'critical', NOW())`;
                                await new Promise((resolveAlert) => {
                                    db.query(alertSql, [item.item_id], (err) => {
                                        if (err) console.error('Failed to create alert:', err);
                                        resolveAlert();
                                    });
                                });
                            }
                        }
                        
                        itemsDeducted++;
                    } catch (itemError) {
                        errors.push(`Error processing ${item.item_name}: ${itemError.message}`);
                    }
                }
                
                if (errors.length > 0) {
                    resolve({ 
                        itemsDeducted, 
                        errors, 
                        message: `Deducted ${itemsDeducted} items with ${errors.length} errors` 
                    });
                } else {
                    resolve({ 
                        itemsDeducted, 
                        message: `Successfully deducted ${itemsDeducted} items from warehouse` 
                    });
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Save booking data (now with warehouse deduction)
app.post("/api/bookings", async (req, res) => {
    console.log('Received booking request:', req.body);
    
    const {
        bookingId,
        roomId,
        roomName,
        guestName,
        guestContact,
        guestEmail,
        guestPhone,
        guestGender,
        guestAge,
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
    // allow any of the three contact fields
    const hasAnyContact = !isEmpty(guestContact) || !isEmpty(guestEmail) || !isEmpty(guestPhone);
    if (!hasAnyContact) missing.push('guestContact or guestEmail or guestPhone');
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

    const normalizedCheckIn = String(checkIn).slice(0, 10);
    const normalizedCheckOut = String(checkOut).slice(0, 10);
    const numericRoomId = Number(roomId);
    const numericGuests = Number(guests);

    // derive guestContact for backward compatibility while saving dedicated email/phone
    const derivedGuestContact = (guestContact && guestContact.trim()) || (guestEmail && guestEmail.trim()) || (guestPhone && guestPhone.trim()) || null;

    const sql = `INSERT INTO bookings (bookingId, user_id, room_id, roomName, guestName, guestContact, guest_email, guest_phone, guest_gender, guest_age, checkIn, checkOut, guests, totalPrice, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [bookingId, null, numericRoomId, roomName, guestName, derivedGuestContact, guestEmail || null, guestPhone || null, guestGender || null, guestAge ? Number(guestAge) : null, normalizedCheckIn, normalizedCheckOut, numericGuests, priceNumber, status];

    console.log('Executing booking query:', sql, values);
    
    db.beginTransaction((err) => {
        if (err) {
            console.error('Failed to start transaction:', err);
            return res.status(500).json({ error: "Failed to start transaction" });
        }
        
        db.query(sql, values, async (err, result) => {
            if (err) {
                console.error('Database error during booking:', err);
                return db.rollback(() => {
                    res.status(500).json({ error: err.code || err.message || "Database error" });
                });
            }
            
            console.log('Booking inserted successfully:', result);
            
            // Update room status to booked
            const updateSql = "UPDATE rooms SET status = ? WHERE id = ?";
            db.query(updateSql, ['booked', roomId], async (uErr) => {
                if (uErr) {
                    console.warn('Failed to update room status after booking:', uErr);
                    return db.rollback(() => {
                        res.status(500).json({ error: "Failed to update room status" });
                    });
                }
                
                console.log('Room status updated to booked for room:', roomId);
                
                // Deduct room inventory from warehouse
                try {
                    const deductionResult = await deductRoomInventoryFromWarehouse(
                        numericRoomId, 
                        bookingId, 
                        'Room booked - inventory deducted from warehouse'
                    );
                    
                    console.log('Warehouse deduction result:', deductionResult);
                    
                    db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() => {
                                res.status(500).json({ error: "Failed to commit transaction" });
                            });
                        }
                        
                        return res.status(201).json({
                            bookingId,
                            roomId: numericRoomId,
                            roomName,
                            guestName,
                            guestContact: derivedGuestContact,
                            guestEmail: guestEmail || null,
                            guestPhone: guestPhone || null,
                            guestGender: guestGender || null,
                            guestAge: guestAge ? Number(guestAge) : null,
                            checkIn: normalizedCheckIn,
                            checkOut: normalizedCheckOut,
                            guests: numericGuests,
                            totalPrice: priceNumber,
                            status,
                            inventoryDeducted: deductionResult
                        });
                    });
                } catch (deductErr) {
                    console.error('Error deducting inventory:', deductErr);
                    return db.rollback(() => {
                        res.status(500).json({ error: `Booking created but inventory deduction failed: ${deductErr.message}` });
                    });
                }
            });
        });
    });
});

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

// Get bookings for the logged-in user
app.get("/api/user/bookings", requireAuth, (req, res) => {
    // Extract email from auth header
    const authHeader = req.headers.authorization;
    const userEmail = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    if (!userEmail) {
        return res.status(401).json({ error: "Authentication required" });
    }
    
    // Get bookings where guest_email matches the logged-in user's email
    const sql = `
        SELECT b.*, r.room_number 
        FROM bookings b 
        LEFT JOIN rooms r ON b.room_id = r.id 
        WHERE b.guest_email = ? 
        ORDER BY b.bookingDate DESC
    `;
    
    db.query(sql, [userEmail], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        return res.status(200).json(results || []);
    });
});

// Update booking status (approve/decline) - now with warehouse deduction and room assignment
app.patch("/api/bookings/:bookingId", async (req, res) => {
    const { bookingId } = req.params;
    const { status, room_id } = req.body;
    
    if (!bookingId) {
        return res.status(400).json({ error: "Missing bookingId." });
    }
    
    // Need at least status or room_id
    if (!status && !room_id) {
        return res.status(400).json({ error: "Missing status or room_id." });
    }
    
    // First get the booking details
    const getBookingSql = "SELECT room_id, status as current_status FROM bookings WHERE bookingId = ?";
    db.query(getBookingSql, [bookingId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: "Booking not found" });
        }
        
        const currentRoomId = rows[0].room_id;
        const previousStatus = rows[0].current_status;
        const newRoomId = room_id || currentRoomId;
        const newStatus = status || previousStatus;
        
        db.beginTransaction(async (transErr) => {
            if (transErr) {
                return res.status(500).json({ error: "Failed to start transaction" });
            }
            
            try {
                // Build update fields
                const updateFields = [];
                const updateValues = [];
                
                if (status) {
                    updateFields.push('status = ?');
                    updateValues.push(status);
                }
                
                if (room_id) {
                    updateFields.push('room_id = ?');
                    updateValues.push(room_id);
                }
                
                updateValues.push(bookingId);
                
                // Update booking
                const updateBookingSql = `UPDATE bookings SET ${updateFields.join(', ')} WHERE bookingId = ?`;
                await new Promise((resolve, reject) => {
                    db.query(updateBookingSql, updateValues, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
                
                // Handle room status updates
                
                // If room_id changed, mark old room as available and new room as booked
                if (room_id && currentRoomId && room_id !== currentRoomId) {
                    // Mark old room as available
                    const updateOldRoomSql = "UPDATE rooms SET status = 'available' WHERE id = ?";
                    await new Promise((resolve, reject) => {
                        db.query(updateOldRoomSql, [currentRoomId], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
                
                // If booking is approved/confirmed and has a room, mark room as booked and deduct inventory
                if ((newStatus === 'confirmed' || newStatus === 'approved') && newRoomId && 
                    (previousStatus !== 'confirmed' && previousStatus !== 'approved' && previousStatus !== 'checked_in')) {
                    
                    const updateRoomSql = "UPDATE rooms SET status = 'booked' WHERE id = ?";
                    await new Promise((resolve, reject) => {
                        db.query(updateRoomSql, [newRoomId], (roomErr) => {
                            if (roomErr) reject(roomErr);
                            else resolve();
                        });
                    });
                    
                    // Deduct room inventory from warehouse
                    const deductionResult = await deductRoomInventoryFromWarehouse(
                        newRoomId, 
                        bookingId, 
                        'Booking confirmed/approved - inventory deducted from warehouse'
                    );
                    
                    console.log('Warehouse deduction result:', deductionResult);
                    
                    db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() => {
                                res.status(500).json({ error: "Failed to commit transaction" });
                            });
                        }
                        return res.status(200).json({ 
                            success: true, 
                            inventoryDeducted: deductionResult 
                        });
                    });
                } else if (newStatus === 'declined' || newStatus === 'cancelled') {
                    // If booking is declined/cancelled, mark room as available
                    if (newRoomId) {
                        const updateRoomSql = "UPDATE rooms SET status = 'available' WHERE id = ?";
                        await new Promise((resolve, reject) => {
                            db.query(updateRoomSql, [newRoomId], (roomErr) => {
                                if (roomErr) reject(roomErr);
                                else resolve();
                            });
                        });
                    }
                    
                    db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() => {
                                res.status(500).json({ error: "Failed to commit transaction" });
                            });
                        }
                        return res.status(200).json({ success: true });
                    });
                } else if (room_id && !currentRoomId) {
                    // Room assigned for the first time (no previous room)
                    const updateRoomSql = "UPDATE rooms SET status = 'booked' WHERE id = ?";
                    await new Promise((resolve, reject) => {
                        db.query(updateRoomSql, [room_id], (roomErr) => {
                            if (roomErr) reject(roomErr);
                            else resolve();
                        });
                    });
                    
                    db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() => {
                                res.status(500).json({ error: "Failed to commit transaction" });
                            });
                        }
                        return res.status(200).json({ success: true });
                    });
                } else {
                    db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() => {
                                res.status(500).json({ error: "Failed to commit transaction" });
                            });
                        }
                        return res.status(200).json({ success: true });
                    });
                }
            } catch (error) {
                return db.rollback(() => {
                    res.status(500).json({ error: error.message });
                });
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

// Get occupied dates for a specific room
app.get("/api/rooms/:id/occupied-dates", (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ error: "Room ID is required" });
    }
    
    // Get all bookings for this room that are occupying it (pending, confirmed, or checked_in)
    const sql = `
        SELECT bookingId, checkIn, checkOut, status, guestName
        FROM bookings
        WHERE room_id = ? AND status IN ('pending', 'confirmed', 'checked_in')
        ORDER BY checkIn ASC
    `;
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.status(200).json(results || []);
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

// Check-in booking: sets booking.status=checked_in and room.status=booked (with warehouse deduction)
app.patch("/api/bookings/:bookingId/check-in", async (req, res) => {
    const { bookingId } = req.params;
    if (!bookingId) return res.status(400).json({ error: "bookingId required" });

    const getSql = "SELECT room_id, status FROM bookings WHERE bookingId = ? LIMIT 1";
    db.query(getSql, [bookingId], (gErr, rows) => {
        if (gErr) return res.status(500).json({ error: gErr.message });
        if (!rows?.length) return res.status(404).json({ error: "Booking not found" });
        
        const roomId = rows[0].room_id;
        const previousStatus = rows[0].status;

        db.beginTransaction(async (err) => {
            if (err) return res.status(500).json({ error: "Failed to start transaction" });
            
            const updBooking = "UPDATE bookings SET status = 'checked_in' WHERE bookingId = ?";
            db.query(updBooking, [bookingId], async (bErr) => {
                if (bErr) return db.rollback(() => res.status(500).json({ error: bErr.message }));
                
                const updRoom = "UPDATE rooms SET status = 'booked' WHERE id = ?";
                db.query(updRoom, [roomId], async (rErr) => {
                    if (rErr) return db.rollback(() => res.status(500).json({ error: rErr.message }));
                    
                    try {
                        // Only deduct inventory if not already deducted (i.e., if previous status wasn't confirmed/approved/checked_in)
                        let deductionResult = { message: 'Inventory already deducted' };
                        if (previousStatus !== 'confirmed' && previousStatus !== 'approved' && previousStatus !== 'checked_in') {
                            deductionResult = await deductRoomInventoryFromWarehouse(
                                roomId, 
                                bookingId, 
                                'Room checked in - inventory deducted from warehouse'
                            );
                            console.log('Warehouse deduction result:', deductionResult);
                        }
                        
                        db.commit(cErr => {
                            if (cErr) return db.rollback(() => res.status(500).json({ error: "Failed to commit" }));
                            return res.json({ 
                                success: true, 
                                inventoryDeducted: deductionResult 
                            });
                        });
                    } catch (deductErr) {
                        return db.rollback(() => {
                            res.status(500).json({ error: `Check-in successful but inventory deduction failed: ${deductErr.message}` });
                        });
                    }
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

// ============================================
// INVENTORY MANAGEMENT ENDPOINTS
// ============================================

// Get all inventory items
app.get("/api/inventory/items", requireAuth, (req, res) => {
    const sql = "SELECT * FROM inventory_items WHERE is_active = 1 ORDER BY name";
    db.query(sql, [], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.status(200).json(results || []);
    });
});

// Create new inventory item
app.post("/api/inventory/items", requireAdmin, (req, res) => {
    const { name, description, category, unit, unit_cost, supplier, low_stock_threshold, reorder_quantity, location, initial_quantity } = req.body;
    
    if (!name || !unit) {
        return res.status(400).json({ error: "Name and unit are required" });
    }
    
    // Default values
    const warehouseLocation = location || 'Main Storage Room';
    const initialQty = parseInt(initial_quantity) || 0;
    
    // Start transaction to create both item and warehouse record
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to start transaction" });
        }
        
        // Insert into inventory_items
        const itemSql = `INSERT INTO inventory_items (name, description, category, unit, unit_cost, supplier, low_stock_threshold, reorder_quantity) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const itemValues = [
            name,
            description || null,
            category || null,
            unit,
            unit_cost || 0,
            supplier || null,
            low_stock_threshold || 10,
            reorder_quantity || 20
        ];
        
        db.query(itemSql, itemValues, (err, itemResult) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ error: err.message });
                });
            }
            
            const newItemId = itemResult.insertId;
            
            // Insert into warehouse_inventory
            const warehouseSql = `INSERT INTO warehouse_inventory (item_id, quantity, location, last_updated) 
                                  VALUES (?, ?, ?, NOW())`;
            
            db.query(warehouseSql, [newItemId, initialQty, warehouseLocation], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                }
                
                // If initial quantity > 0, log it
                if (initialQty > 0) {
                    // Get admin ID from auth header
                    const authHeader = req.headers.authorization;
                    const userEmail = authHeader ? authHeader.replace('Bearer ', '') : null;
                    
                    const getAdminSql = "SELECT id FROM admin_account WHERE admin_email = ? LIMIT 1";
                    db.query(getAdminSql, [userEmail], (err, adminResult) => {
                        const adminId = (adminResult && adminResult.length > 0) ? adminResult[0].id : 1;
                        
                        // Log the initial stock
                        const logSql = `INSERT INTO inventory_log (item_id, change_quantity, new_stock_level, reason, notes, logged_by) 
                                       VALUES (?, ?, ?, ?, ?, ?)`;
                        const logValues = [
                            newItemId,
                            initialQty,
                            initialQty,
                            'Initial stock - new item created',
                            `Item created with initial stock at ${warehouseLocation}`,
                            adminId
                        ];
                        
                        db.query(logSql, logValues, (err) => {
                            if (err) {
                                console.error('Failed to log initial stock:', err);
                            }
                            
                            // Commit transaction
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ error: "Failed to commit transaction" });
                                    });
                                }
                                return res.status(201).json({ 
                                    id: newItemId, 
                                    message: "Item created successfully and added to warehouse" 
                                });
                            });
                        });
                    });
                } else {
                    // Commit transaction without logging
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: "Failed to commit transaction" });
                            });
                        }
                        return res.status(201).json({ 
                            id: newItemId, 
                            message: "Item created successfully and added to warehouse" 
                        });
                    });
                }
            });
        });
    });
});

// Update inventory item
app.patch("/api/inventory/items/:id", requireAdmin, (req, res) => {
    const { id } = req.params;
    const allowed = ['name', 'description', 'category', 'unit', 'unit_cost', 'supplier', 'low_stock_threshold', 'reorder_quantity'];
    const fields = [];
    const values = [];
    
    allowed.forEach(key => {
        if (req.body.hasOwnProperty(key)) {
            fields.push(`${key} = ?`);
            values.push(req.body[key]);
        }
    });
    
    if (fields.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
    }
    
    values.push(id);
    const sql = `UPDATE inventory_items SET ${fields.join(', ')} WHERE id = ?`;
    
    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Item not found" });
        }
        return res.status(200).json({ success: true });
    });
});

// Delete inventory item
app.delete("/api/inventory/items/:id", requireAdmin, (req, res) => {
    const { id } = req.params;
    
    // Soft delete - set is_active to 0
    const sql = "UPDATE inventory_items SET is_active = 0 WHERE id = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Item not found" });
        }
        return res.status(200).json({ success: true });
    });
});

// Get warehouse inventory
app.get("/api/inventory/warehouse", requireAuth, (req, res) => {
    const sql = `
        SELECT w.*, i.name as item_name, i.unit, i.low_stock_threshold
        FROM warehouse_inventory w
        JOIN inventory_items i ON w.item_id = i.id
        WHERE i.is_active = 1
        ORDER BY i.name
    `;
    
    db.query(sql, [], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.status(200).json(results || []);
    });
});

// Add or remove warehouse stock (transaction)
app.post("/api/inventory/warehouse/transaction", requireAuth, async (req, res) => {
    const { item_id, change_quantity, reason, notes } = req.body;
    
    if (!item_id || !change_quantity || !reason) {
        return res.status(400).json({ error: "item_id, change_quantity, and reason are required" });
    }
    
    // Get admin ID from auth header
    const authHeader = req.headers.authorization;
    const userEmail = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    db.beginTransaction(async (err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to start transaction" });
        }
        
        try {
            // Get current stock and admin ID
            const getStockSql = "SELECT quantity FROM warehouse_inventory WHERE item_id = ?";
            const stockResult = await new Promise((resolve, reject) => {
                db.query(getStockSql, [item_id], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            let currentStock = 0;
            if (stockResult && stockResult.length > 0) {
                currentStock = stockResult[0].quantity;
            }
            
            const newStock = currentStock + parseInt(change_quantity);
            
            if (newStock < 0) {
                return db.rollback(() => {
                    res.status(400).json({ error: "Insufficient stock" });
                });
            }
            
            // Update or insert warehouse stock
            if (stockResult && stockResult.length > 0) {
                const updateSql = "UPDATE warehouse_inventory SET quantity = ?, last_updated = NOW() WHERE item_id = ?";
                await new Promise((resolve, reject) => {
                    db.query(updateSql, [newStock, item_id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            } else {
                const insertSql = "INSERT INTO warehouse_inventory (item_id, quantity, location) VALUES (?, ?, 'Main Storage Room')";
                await new Promise((resolve, reject) => {
                    db.query(insertSql, [item_id, newStock], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
            
            // Get admin ID
            const getAdminSql = "SELECT id FROM admin_account WHERE admin_email = ? LIMIT 1";
            const adminResult = await new Promise((resolve, reject) => {
                db.query(getAdminSql, [userEmail], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            const adminId = adminResult && adminResult.length > 0 ? adminResult[0].id : 1;
            
            // Log transaction
            const logSql = `INSERT INTO inventory_log (item_id, change_quantity, new_stock_level, reason, notes, logged_by) 
                           VALUES (?, ?, ?, ?, ?, ?)`;
            await new Promise((resolve, reject) => {
                db.query(logSql, [item_id, change_quantity, newStock, reason, notes || null, adminId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // Check if we need to create an alert
            const getItemSql = "SELECT low_stock_threshold FROM inventory_items WHERE id = ?";
            const itemResult = await new Promise((resolve, reject) => {
                db.query(getItemSql, [item_id], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            if (itemResult && itemResult.length > 0) {
                const threshold = itemResult[0].low_stock_threshold;
                if (newStock <= threshold && newStock > 0) {
                    // Create low stock alert
                    const alertSql = `INSERT INTO inventory_alerts (alert_type, item_id, message, severity, created_at) 
                                     VALUES ('low_stock', ?, ?, 'warning', NOW())`;
                    const alertMessage = `Stock level is low (${newStock} remaining, threshold: ${threshold})`;
                    await new Promise((resolve, reject) => {
                        db.query(alertSql, [item_id, alertMessage], (err) => {
                            if (err) console.error('Failed to create alert:', err);
                            resolve();
                        });
                    });
                } else if (newStock === 0) {
                    // Create out of stock alert
                    const alertSql = `INSERT INTO inventory_alerts (alert_type, item_id, message, severity, created_at) 
                                     VALUES ('out_of_stock', ?, 'Item is out of stock', 'critical', NOW())`;
                    await new Promise((resolve, reject) => {
                        db.query(alertSql, [item_id], (err) => {
                            if (err) console.error('Failed to create alert:', err);
                            resolve();
                        });
                    });
                }
            }
            
            db.commit((err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: "Failed to commit transaction" });
                    });
                }
                return res.status(200).json({ success: true, new_stock: newStock });
            });
        } catch (error) {
            db.rollback(() => {
                res.status(500).json({ error: error.message });
            });
        }
    });
});

// Get room inventory
app.get("/api/inventory/room-inventory", requireAuth, (req, res) => {
    const sql = `
        SELECT ri.*, i.name as item_name, i.unit, r.name as room_name, r.room_number
        FROM room_inventory ri
        JOIN inventory_items i ON ri.item_id = i.id
        JOIN rooms r ON ri.room_id = r.id
        WHERE i.is_active = 1
        ORDER BY r.room_number, i.name
    `;
    
    db.query(sql, [], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.status(200).json(results || []);
    });
});

// Update or add room inventory item (NO warehouse deduction here)
app.post("/api/inventory/room-inventory", requireAuth, async (req, res) => {
    const { room_id, item_id, quantity, action } = req.body;
    
    if (!room_id || !item_id || quantity === undefined) {
        return res.status(400).json({ error: "room_id, item_id, and quantity are required" });
    }
    
    db.beginTransaction(async (err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to start transaction" });
        }
        
        try {
            // Check if room inventory record exists
            const checkSql = "SELECT * FROM room_inventory WHERE room_id = ? AND item_id = ?";
            const existing = await new Promise((resolve, reject) => {
                db.query(checkSql, [room_id, item_id], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            let newQuantity = parseInt(quantity);
            
            if (existing && existing.length > 0) {
                // Update existing record
                if (action === 'add') {
                    newQuantity = existing[0].current_quantity + parseInt(quantity);
                } else if (action === 'subtract') {
                    newQuantity = existing[0].current_quantity - parseInt(quantity);
                    if (newQuantity < 0) newQuantity = 0;
                }
                // else action === 'set' - use newQuantity as is
            }
            
            // Determine status based on quantity
            const getItemSql = "SELECT i.*, rti.standard_quantity FROM inventory_items i LEFT JOIN room_type_inventory rti ON i.id = rti.item_id LEFT JOIN rooms r ON rti.room_type_id = r.room_type_id WHERE i.id = ? AND r.id = ? LIMIT 1";
            const itemInfo = await new Promise((resolve, reject) => {
                db.query(getItemSql, [item_id, room_id], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            let status = 'sufficient';
            if (itemInfo && itemInfo.length > 0 && itemInfo[0].standard_quantity) {
                const standardQty = itemInfo[0].standard_quantity;
                if (newQuantity === 0) {
                    status = 'out_of_stock';
                } else if (newQuantity < standardQty * 0.5) {
                    status = 'low';
                }
            }
            
            // Update or insert room inventory (NO warehouse deduction)
            if (existing && existing.length > 0) {
                const updateSql = "UPDATE room_inventory SET current_quantity = ?, last_restocked = NOW(), last_checked = NOW(), status = ? WHERE room_id = ? AND item_id = ?";
                await new Promise((resolve, reject) => {
                    db.query(updateSql, [newQuantity, status, room_id, item_id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            } else {
                // Insert new record
                if (newQuantity === 0) {
                    status = 'out_of_stock';
                }
                
                const insertSql = "INSERT INTO room_inventory (room_id, item_id, current_quantity, last_restocked, last_checked, status) VALUES (?, ?, ?, NOW(), NOW(), ?)";
                await new Promise((resolve, reject) => {
                    db.query(insertSql, [room_id, item_id, newQuantity, status], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
            
            db.commit((err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: "Failed to commit transaction" });
                    });
                }
                return res.status(200).json({ 
                    success: true, 
                    new_quantity: newQuantity,
                    message: 'Room inventory updated. Warehouse stock will be deducted when room is booked.'
                });
            });
        } catch (error) {
            db.rollback(() => {
                res.status(500).json({ error: error.message });
            });
        }
    });
});

// Get inventory for a specific room
app.get("/api/inventory/room-inventory/:roomId", requireAuth, (req, res) => {
    const { roomId } = req.params;
    
    const sql = `
        SELECT ri.*, i.name as item_name, i.unit, i.category,
               rti.standard_quantity, rti.replenish_quantity
        FROM room_inventory ri
        JOIN inventory_items i ON ri.item_id = i.id
        LEFT JOIN rooms r ON ri.room_id = r.id
        LEFT JOIN room_type_inventory rti ON rti.room_type_id = r.room_type_id AND rti.item_id = i.item_id
        WHERE ri.room_id = ? AND i.is_active = 1
        ORDER BY i.category, i.name
    `;
    
    db.query(sql, [roomId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.status(200).json(results || []);
    });
});

// Restock room to standard levels based on room type
app.post("/api/inventory/room-inventory/restock", requireAuth, async (req, res) => {
    const { room_id } = req.body;
    
    if (!room_id) {
        return res.status(400).json({ error: "room_id is required" });
    }
    
    db.beginTransaction(async (err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to start transaction" });
        }
        
        try {
            // Get room type
            const getRoomSql = "SELECT room_type_id FROM rooms WHERE id = ?";
            const roomResult = await new Promise((resolve, reject) => {
                db.query(getRoomSql, [room_id], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            if (!roomResult || roomResult.length === 0) {
                return db.rollback(() => {
                    res.status(404).json({ error: "Room not found" });
                });
            }
            
            const roomTypeId = roomResult[0].room_type_id;
            
            // Get standard inventory for this room type
            const getStandardSql = `
                SELECT rti.*, i.name as item_name
                FROM room_type_inventory rti
                JOIN inventory_items i ON rti.item_id = i.id
                WHERE rti.room_type_id = ? AND i.is_active = 1
            `;
            const standardItems = await new Promise((resolve, reject) => {
                db.query(getStandardSql, [roomTypeId], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            if (!standardItems || standardItems.length === 0) {
                return db.rollback(() => {
                    res.status(400).json({ error: "No standard inventory defined for this room type" });
                });
            }
            
            // Update or insert each item
            for (const standardItem of standardItems) {
                const checkSql = "SELECT * FROM room_inventory WHERE room_id = ? AND item_id = ?";
                const existing = await new Promise((resolve, reject) => {
                    db.query(checkSql, [room_id, standardItem.item_id], (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    });
                });
                
                const targetQuantity = standardItem.replenish_quantity || standardItem.standard_quantity;
                
                if (existing && existing.length > 0) {
                    // Update existing
                    const updateSql = "UPDATE room_inventory SET current_quantity = ?, last_restocked = NOW(), last_checked = NOW(), status = 'sufficient' WHERE room_id = ? AND item_id = ?";
                    await new Promise((resolve, reject) => {
                        db.query(updateSql, [targetQuantity, room_id, standardItem.item_id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                } else {
                    // Insert new
                    const insertSql = "INSERT INTO room_inventory (room_id, item_id, current_quantity, last_restocked, last_checked, status) VALUES (?, ?, ?, NOW(), NOW(), 'sufficient')";
                    await new Promise((resolve, reject) => {
                        db.query(insertSql, [room_id, standardItem.item_id, targetQuantity], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            }
            
            db.commit((err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: "Failed to commit transaction" });
                    });
                }
                return res.status(200).json({ 
                    success: true, 
                    message: `Restocked ${standardItems.length} items to standard levels`,
                    items_restocked: standardItems.length
                });
            });
        } catch (error) {
            db.rollback(() => {
                res.status(500).json({ error: error.message });
            });
        }
    });
});

// Remove item from room inventory
app.delete("/api/inventory/room-inventory/:roomId/:itemId", requireAuth, (req, res) => {
    const { roomId, itemId } = req.params;
    
    const sql = "DELETE FROM room_inventory WHERE room_id = ? AND item_id = ?";
    
    db.query(sql, [roomId, itemId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Room inventory item not found" });
        }
        return res.status(200).json({ success: true });
    });
});

// Get housekeeping tasks
app.get("/api/inventory/tasks", requireAuth, (req, res) => {
    const sql = `
        SELECT t.*, r.name as room_name, r.room_number, u.username as assigned_to_name
        FROM housekeeping_tasks t
        JOIN rooms r ON t.room_id = r.id
        LEFT JOIN user_account u ON t.assigned_to = u.id
        ORDER BY 
            CASE t.priority
                WHEN 'urgent' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                WHEN 'low' THEN 4
            END,
            t.created_at DESC
    `;
    
    db.query(sql, [], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.status(200).json(results || []);
    });
});

// Create housekeeping task
app.post("/api/inventory/tasks", requireAuth, async (req, res) => {
    const { room_id, task_type, priority, description, assigned_to } = req.body;
    
    if (!room_id || !task_type) {
        return res.status(400).json({ error: "room_id and task_type are required" });
    }
    
    // Get user ID from auth header
    const authHeader = req.headers.authorization;
    const userEmail = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    db.beginTransaction(async (err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to start transaction" });
        }
        
        try {
            // Try to get creator ID from admin_account first
            const getAdminSql = "SELECT id FROM admin_account WHERE admin_email = ? LIMIT 1";
            const adminResult = await new Promise((resolve, reject) => {
                db.query(getAdminSql, [userEmail], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            let createdBy = null;
            
            if (adminResult && adminResult.length > 0) {
                createdBy = adminResult[0].id;
            } else {
                // Try user_account table for staff users
                const getUserSql = "SELECT id FROM user_account WHERE email = ? AND role IN ('staff', 'admin') LIMIT 1";
                const userResult = await new Promise((resolve, reject) => {
                    db.query(getUserSql, [userEmail], (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    });
                });
                
                if (userResult && userResult.length > 0) {
                    createdBy = userResult[0].id;
                } else {
                    // Default to 1 if no valid user found
                    createdBy = 1;
                }
            }
            
            // Insert the task
            const sql = `INSERT INTO housekeeping_tasks (room_id, task_type, priority, status, assigned_to, created_by, description, created_at) 
                         VALUES (?, ?, ?, 'pending', ?, ?, ?, NOW())`;
            const values = [
                room_id,
                task_type,
                priority || 'medium',
                assigned_to || null,
                createdBy,
                description || null
            ];
            
            const taskResult = await new Promise((resolve, reject) => {
                db.query(sql, values, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            
            // If task type is maintenance, update room status to 'maintenance'
            if (task_type === 'maintenance') {
                const updateRoomSql = "UPDATE rooms SET status = 'maintenance' WHERE id = ?";
                await new Promise((resolve, reject) => {
                    db.query(updateRoomSql, [room_id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
            
            db.commit((err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: "Failed to commit transaction" });
                    });
                }
                return res.status(201).json({ id: taskResult.insertId, message: "Task created successfully" });
            });
        } catch (error) {
            db.rollback(() => {
                res.status(500).json({ error: error.message });
            });
        }
    });
});

// Update housekeeping task
app.patch("/api/inventory/tasks/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { status, assigned_to, priority, description } = req.body;
    
    db.beginTransaction(async (err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to start transaction" });
        }
        
        try {
            // Get the task details first to check if it's a maintenance task
            const getTaskSql = "SELECT room_id, task_type, status as current_status FROM housekeeping_tasks WHERE id = ?";
            const taskResult = await new Promise((resolve, reject) => {
                db.query(getTaskSql, [id], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            if (!taskResult || taskResult.length === 0) {
                return db.rollback(() => {
                    res.status(404).json({ error: "Task not found" });
                });
            }
            
            const task = taskResult[0];
            const isMaintenance = task.task_type === 'maintenance';
            const roomId = task.room_id;
            
            // Build update query for task
            const fields = [];
            const values = [];
            
            if (status) {
                fields.push('status = ?');
                values.push(status);
                if (status === 'completed') {
                    fields.push('completed_at = NOW()');
                }
            }
            if (assigned_to !== undefined) {
                fields.push('assigned_to = ?');
                values.push(assigned_to);
            }
            if (priority) {
                fields.push('priority = ?');
                values.push(priority);
            }
            if (description !== undefined) {
                fields.push('description = ?');
                values.push(description);
            }
            
            if (fields.length === 0) {
                return db.rollback(() => {
                    res.status(400).json({ error: "No fields to update" });
                });
            }
            
            values.push(id);
            const updateTaskSql = `UPDATE housekeeping_tasks SET ${fields.join(', ')} WHERE id = ?`;
            
            await new Promise((resolve, reject) => {
                db.query(updateTaskSql, values, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            
            // Update room status if this is a maintenance task and status changed
            if (isMaintenance && status) {
                let newRoomStatus = null;
                
                if (status === 'completed' || status === 'cancelled') {
                    // Task is done, set room back to available
                    newRoomStatus = 'available';
                } else if (status === 'in_progress' || status === 'pending') {
                    // Task is active, set room to maintenance
                    newRoomStatus = 'maintenance';
                }
                
                if (newRoomStatus) {
                    const updateRoomSql = "UPDATE rooms SET status = ? WHERE id = ?";
                    await new Promise((resolve, reject) => {
                        db.query(updateRoomSql, [newRoomStatus, roomId], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            }
            
            db.commit((err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: "Failed to commit transaction" });
                    });
                }
                return res.status(200).json({ success: true });
            });
        } catch (error) {
            db.rollback(() => {
                res.status(500).json({ error: error.message });
            });
        }
    });
});

// Get inventory alerts
app.get("/api/inventory/alerts", requireAuth, (req, res) => {
    const sql = `
        SELECT a.*, i.name as item_name, r.name as room_name, r.room_number
        FROM inventory_alerts a
        LEFT JOIN inventory_items i ON a.item_id = i.id
        LEFT JOIN rooms r ON a.room_id = r.id
        ORDER BY 
            CASE a.severity
                WHEN 'critical' THEN 1
                WHEN 'warning' THEN 2
                WHEN 'info' THEN 3
            END,
            a.created_at DESC
    `;
    
    db.query(sql, [], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.status(200).json(results || []);
    });
});

// Resolve alert
app.patch("/api/inventory/alerts/:id/resolve", requireAuth, async (req, res) => {
    const { id } = req.params;
    
    // Get admin ID from auth header
    const authHeader = req.headers.authorization;
    const userEmail = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    try {
        const getAdminSql = "SELECT id FROM admin_account WHERE admin_email = ? LIMIT 1";
        const adminResult = await new Promise((resolve, reject) => {
            db.query(getAdminSql, [userEmail], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        const resolvedBy = adminResult && adminResult.length > 0 ? adminResult[0].id : 1;
        
        const sql = "UPDATE inventory_alerts SET is_resolved = 1, resolved_by = ?, resolved_at = NOW() WHERE id = ?";
        
        db.query(sql, [resolvedBy, id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Alert not found" });
            }
            return res.status(200).json({ success: true });
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Get inventory logs
app.get("/api/inventory/logs", requireAuth, (req, res) => {
    const limit = req.query.limit || 100;
    
    const sql = `
        SELECT l.*, i.name as item_name, i.unit
        FROM inventory_log l
        JOIN inventory_items i ON l.item_id = i.id
        ORDER BY l.created_at DESC
        LIMIT ?
    `;
    
    db.query(sql, [parseInt(limit)], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.status(200).json(results || []);
    });
});

// Get unique item categories (for amenity options)
app.get("/api/inventory/categories", requireAuth, (req, res) => {
    const sql = `
        SELECT DISTINCT category 
        FROM inventory_items 
        WHERE category IS NOT NULL AND category != '' AND is_active = 1
        ORDER BY category
    `;
    
    db.query(sql, [], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Return just the category names as an array
        const categories = (results || []).map(row => row.category);
        return res.status(200).json(categories);
    });
});

// Sync item categories to amenities table
app.post("/api/inventory/categories/sync-to-amenities", requireAdmin, async (req, res) => {
    try {
        // Get all unique categories from inventory items
        const getCategoriesSql = `
            SELECT DISTINCT category 
            FROM inventory_items 
            WHERE category IS NOT NULL AND category != '' AND is_active = 1
        `;
        
        const categories = await new Promise((resolve, reject) => {
            db.query(getCategoriesSql, [], (err, results) => {
                if (err) reject(err);
                else resolve(results || []);
            });
        });
        
        let addedCount = 0;
        let skippedCount = 0;
        
        // Add each category as an amenity if it doesn't exist
        for (const row of categories) {
            const category = row.category;
            
            // Check if amenity already exists
            const checkSql = "SELECT id FROM amenities WHERE name = ?";
            const existing = await new Promise((resolve, reject) => {
                db.query(checkSql, [category], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            if (!existing || existing.length === 0) {
                // Add as amenity
                const insertSql = "INSERT INTO amenities (name) VALUES (?)";
                await new Promise((resolve, reject) => {
                    db.query(insertSql, [category], (err) => {
                        if (err && err.code !== 'ER_DUP_ENTRY') reject(err);
                        else resolve();
                    });
                });
                addedCount++;
            } else {
                skippedCount++;
            }
        }
        
        return res.status(200).json({ 
            success: true,
            message: `Synced ${addedCount} categories to amenities (${skippedCount} already existed)`,
            added: addedCount,
            skipped: skippedCount
        });
    } catch (error) {
        console.error('Error syncing categories to amenities:', error);
        return res.status(500).json({ error: error.message });
    }
});

// Get inventory reports
app.get("/api/inventory/reports", requireAuth, (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    // Get summary statistics
    const summarySql = `
        SELECT 
            COUNT(DISTINCT i.id) as total_items,
            SUM(w.quantity * i.unit_cost) as total_value,
            COUNT(l.id) as total_transactions,
            (SELECT COUNT(*) FROM warehouse_inventory w2 
             JOIN inventory_items i2 ON w2.item_id = i2.id 
             WHERE w2.quantity <= i2.low_stock_threshold) as low_stock_items
        FROM inventory_items i
        LEFT JOIN warehouse_inventory w ON i.id = w.item_id
        LEFT JOIN inventory_log l ON i.id = l.item_id AND l.created_at >= ?
        WHERE i.is_active = 1
    `;
    
    db.query(summarySql, [dateFrom], (err, summaryResults) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Get most used items
        const mostUsedSql = `
            SELECT 
                i.id, i.name, i.category, i.unit, i.unit_cost,
                SUM(ABS(l.change_quantity)) as total_used
            FROM inventory_items i
            JOIN inventory_log l ON i.id = l.item_id
            WHERE l.created_at >= ? AND l.change_quantity < 0 AND i.is_active = 1
            GROUP BY i.id
            ORDER BY total_used DESC
            LIMIT 10
        `;
        
        db.query(mostUsedSql, [dateFrom], (err, mostUsedResults) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            // Get category breakdown
            const categorySql = `
                SELECT 
                    i.category,
                    COUNT(l.id) as transaction_count,
                    SUM(ABS(l.change_quantity) * i.unit_cost) as total_cost
                FROM inventory_items i
                JOIN inventory_log l ON i.id = l.item_id
                WHERE l.created_at >= ? AND i.is_active = 1
                GROUP BY i.category
                ORDER BY transaction_count DESC
            `;
            
            db.query(categorySql, [dateFrom], (err, categoryResults) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                // Get recent activity
                const activitySql = `
                    SELECT l.*, i.name as item_name
                    FROM inventory_log l
                    JOIN inventory_items i ON l.item_id = i.id
                    WHERE l.created_at >= ?
                    ORDER BY l.created_at DESC
                    LIMIT 50
                `;
                
                db.query(activitySql, [dateFrom], (err, activityResults) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    
                    return res.status(200).json({
                        summary: summaryResults[0],
                        most_used_items: mostUsedResults || [],
                        category_breakdown: categoryResults || [],
                        recent_activity: activityResults || []
                    });
                });
            });
        });
    });
});

// Export inventory reports as CSV
app.get("/api/inventory/reports/export", requireAuth, (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    // Get summary statistics
    const summarySql = `
        SELECT 
            COUNT(DISTINCT i.id) as total_items,
            SUM(w.quantity * i.unit_cost) as total_value,
            COUNT(l.id) as total_transactions,
            (SELECT COUNT(*) FROM warehouse_inventory w2 
             JOIN inventory_items i2 ON w2.item_id = i2.id 
             WHERE w2.quantity <= i2.low_stock_threshold) as low_stock_items
        FROM inventory_items i
        LEFT JOIN warehouse_inventory w ON i.id = w.item_id
        LEFT JOIN inventory_log l ON i.id = l.item_id AND l.created_at >= ?
        WHERE i.is_active = 1
    `;
    
    db.query(summarySql, [dateFrom], (err, summaryResults) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const summary = summaryResults[0];
        
        // Get most used items
        const mostUsedSql = `
            SELECT 
                i.id, i.name, i.category, i.unit, i.unit_cost,
                SUM(ABS(l.change_quantity)) as total_used
            FROM inventory_items i
            JOIN inventory_log l ON i.id = l.item_id
            WHERE l.created_at >= ? AND l.change_quantity < 0 AND i.is_active = 1
            GROUP BY i.id
            ORDER BY total_used DESC
            LIMIT 20
        `;
        
        db.query(mostUsedSql, [dateFrom], (err, mostUsedResults) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            // Get category breakdown
            const categorySql = `
                SELECT 
                    i.category,
                    COUNT(l.id) as transaction_count,
                    SUM(ABS(l.change_quantity) * i.unit_cost) as total_cost
                FROM inventory_items i
                JOIN inventory_log l ON i.id = l.item_id
                WHERE l.created_at >= ? AND i.is_active = 1
                GROUP BY i.category
                ORDER BY transaction_count DESC
            `;
            
            db.query(categorySql, [dateFrom], (err, categoryResults) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                // Get recent activity
                const activitySql = `
                    SELECT l.*, i.name as item_name, i.unit
                    FROM inventory_log l
                    JOIN inventory_items i ON l.item_id = i.id
                    WHERE l.created_at >= ?
                    ORDER BY l.created_at DESC
                    LIMIT 100
                `;
                
                db.query(activitySql, [dateFrom], (err, activityResults) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    
                    // Generate CSV content
                    let csv = 'Inventory Report\n';
                    csv += `Date Range: Last ${days} days\n`;
                    csv += `Generated: ${new Date().toLocaleString()}\n`;
                    csv += '\n';
                    csv += 'Summary Statistics\n';
                    csv += `Total Items,${summary.total_items || 0}\n`;
                    csv += `Total Inventory Value,₱${(summary.total_value || 0).toFixed(2)}\n`;
                    csv += `Total Transactions,${summary.total_transactions || 0}\n`;
                    csv += `Low Stock Items,${summary.low_stock_items || 0}\n`;
                    csv += '\n\n';
                    
                    // Add most used items
                    csv += 'Most Used Items\n';
                    csv += 'Item Name,Category,Total Used,Unit,Unit Cost,Total Cost\n';
                    
                    const escapeCSV = (val) => {
                        if (val === null || val === undefined) return '';
                        const str = String(val);
                        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                            return `"${str.replace(/"/g, '""')}"`;
                        }
                        return str;
                    };
                    
                    (mostUsedResults || []).forEach(item => {
                        const totalCost = (item.total_used || 0) * (item.unit_cost || 0);
                        csv += [
                            escapeCSV(item.name),
                            escapeCSV(item.category),
                            escapeCSV(item.total_used),
                            escapeCSV(item.unit),
                            escapeCSV(parseFloat(item.unit_cost || 0).toFixed(2)),
                            escapeCSV(totalCost.toFixed(2))
                        ].join(',') + '\n';
                    });
                    
                    csv += '\n\n';
                    
                    // Add category breakdown
                    csv += 'Usage by Category\n';
                    csv += 'Category,Transaction Count,Total Cost\n';
                    
                    (categoryResults || []).forEach(category => {
                        csv += [
                            escapeCSV(category.category || 'Uncategorized'),
                            escapeCSV(category.transaction_count),
                            escapeCSV(parseFloat(category.total_cost || 0).toFixed(2))
                        ].join(',') + '\n';
                    });
                    
                    csv += '\n\n';
                    
                    // Add recent activity
                    csv += 'Recent Activity\n';
                    csv += 'Date,Item Name,Change Quantity,New Stock Level,Reason,Notes\n';
                    
                    (activityResults || []).forEach(activity => {
                        csv += [
                            escapeCSV(new Date(activity.created_at).toLocaleString()),
                            escapeCSV(activity.item_name),
                            escapeCSV(activity.change_quantity),
                            escapeCSV(activity.new_stock_level),
                            escapeCSV(activity.reason),
                            escapeCSV(activity.notes)
                        ].join(',') + '\n';
                    });
                    
                    // Set headers for CSV download
                    const filename = `inventory-report-${days}days-${Date.now()}.csv`;
                    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                    
                    // Send CSV
                    return res.send(csv);
                });
            });
        });
    });
});

// Get admin dashboard statistics
app.get("/api/admin/stats", requireAuth, async (req, res) => {
    try {
        // Get total rooms count
        const totalRoomsSql = "SELECT COUNT(*) as count FROM rooms";
        const totalRoomsResult = await new Promise((resolve, reject) => {
            db.query(totalRoomsSql, [], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        const totalRooms = totalRoomsResult[0].count;

        // Get active bookings count (pending, confirmed, checked_in)
        const activeBookingsSql = "SELECT COUNT(*) as count FROM bookings WHERE status IN ('pending', 'confirmed', 'checked_in')";
        const activeBookingsResult = await new Promise((resolve, reject) => {
            db.query(activeBookingsSql, [], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        const activeBookings = activeBookingsResult[0].count;

        // Get occupancy rate (rooms with status 'booked' / total rooms * 100)
        const bookedRoomsSql = "SELECT COUNT(*) as count FROM rooms WHERE status = 'booked'";
        const bookedRoomsResult = await new Promise((resolve, reject) => {
            db.query(bookedRoomsSql, [], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        const bookedRooms = bookedRoomsResult[0].count;
        const occupancyRate = totalRooms > 0 ? ((bookedRooms / totalRooms) * 100).toFixed(1) : 0;

        // Get revenue today (sum of totalPrice for bookings created today)
        const revenueTodaySql = "SELECT COALESCE(SUM(totalPrice), 0) as revenue FROM bookings WHERE DATE(bookingDate) = CURDATE()";
        const revenueTodayResult = await new Promise((resolve, reject) => {
            db.query(revenueTodaySql, [], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        const revenueToday = parseFloat(revenueTodayResult[0].revenue) || 0;

        // Calculate percentage changes (for now, return 0% as we don't have historical data)
        // In a real application, you would compare with previous period
        return res.status(200).json({
            totalRooms: {
                value: totalRooms,
                change: '+0%' // Placeholder - would need historical data
            },
            activeBookings: {
                value: activeBookings,
                change: '+0%' // Placeholder - would need historical data
            },
            occupancyRate: {
                value: `${occupancyRate}%`,
                change: '+0%' // Placeholder - would need historical data
            },
            revenueToday: {
                value: revenueToday,
                change: '+0%' // Placeholder - would need historical data
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return res.status(500).json({ error: error.message || "Failed to fetch statistics" });
    }
});

// Export analytics data as CSV
app.get("/api/admin/reports/analytics/export", requireAuth, async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    try {
        // Get all bookings within the date range
        const bookingsSql = `
            SELECT 
                b.bookingId,
                b.bookingDate,
                b.guestName,
                b.guest_email,
                b.guest_phone,
                b.guest_gender,
                b.guest_age,
                b.roomName,
                r.room_number,
                b.checkIn,
                b.checkOut,
                b.guests,
                b.totalPrice,
                b.status
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            WHERE b.bookingDate >= ?
            ORDER BY b.bookingDate DESC
        `;
        
        const bookings = await new Promise((resolve, reject) => {
            db.query(bookingsSql, [dateFrom], (err, results) => {
                if (err) reject(err);
                else resolve(results || []);
            });
        });
        
        // Calculate summary statistics
        const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.totalPrice) || 0), 0);
        const totalBookings = bookings.length;
        const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
        const completedBookings = bookings.filter(b => b.status === 'completed').length;
        const pendingBookings = bookings.filter(b => b.status === 'pending').length;
        const confirmedBookings = bookings.filter(b => ['confirmed', 'checked_in'].includes(b.status)).length;
        const cancelledBookings = bookings.filter(b => ['cancelled', 'declined'].includes(b.status)).length;
        
        // Generate CSV content
        let csv = 'Analytics Report\n';
        csv += `Date Range: Last ${days} days\n`;
        csv += `Generated: ${new Date().toLocaleString()}\n`;
        csv += '\n';
        csv += 'Summary Statistics\n';
        csv += `Total Revenue,₱${totalRevenue.toFixed(2)}\n`;
        csv += `Total Bookings,${totalBookings}\n`;
        csv += `Average Booking Value,₱${avgBookingValue.toFixed(2)}\n`;
        csv += `Completed Bookings,${completedBookings}\n`;
        csv += `Confirmed/Checked-In Bookings,${confirmedBookings}\n`;
        csv += `Pending Bookings,${pendingBookings}\n`;
        csv += `Cancelled/Declined Bookings,${cancelledBookings}\n`;
        csv += '\n\n';
        
        // Add detailed bookings data
        csv += 'Booking Details\n';
        csv += 'Booking ID,Booking Date,Guest Name,Email,Phone,Gender,Age,Room Type,Room Number,Check-In,Check-Out,Guests,Total Price,Status\n';
        
        bookings.forEach(booking => {
            const escapeCSV = (val) => {
                if (val === null || val === undefined) return '';
                const str = String(val);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };
            
            csv += [
                escapeCSV(booking.bookingId),
                escapeCSV(new Date(booking.bookingDate).toLocaleString()),
                escapeCSV(booking.guestName),
                escapeCSV(booking.guest_email),
                escapeCSV(booking.guest_phone),
                escapeCSV(booking.guest_gender),
                escapeCSV(booking.guest_age),
                escapeCSV(booking.roomName),
                escapeCSV(booking.room_number),
                escapeCSV(booking.checkIn),
                escapeCSV(booking.checkOut),
                escapeCSV(booking.guests),
                escapeCSV(parseFloat(booking.totalPrice || 0).toFixed(2)),
                escapeCSV(booking.status)
            ].join(',') + '\n';
        });
        
        // Set headers for CSV download
        const filename = `analytics-report-${days}days-${Date.now()}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Send CSV
        return res.send(csv);
    } catch (error) {
        console.error('Error exporting analytics:', error);
        return res.status(500).json({ error: error.message || 'Failed to export analytics' });
    }
});

const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
