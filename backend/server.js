const express = require("express")
const mysql = require("mysql")
const cors = require("cors")
const path = require("path")
const fs = require("fs")
const multer = require("multer")

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



const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "osner_db"
})

app.post("/osner_db", (req, res) => {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Missing required fields: username, email, and password are required." });
    }

    const sql = "INSERT INTO user_account (username, email, password) VALUES (?)";
    const values = [username, email, password];

    db.query(sql, [values], (err, data) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        return res.status(201).json({ insertId: data.insertId, affectedRows: data.affectedRows });
    })
})

// Save booking data
app.post("/api/bookings", (req, res) => {
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
        status,
        bookingDate
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
    if (isEmpty(bookingDate)) missing.push('bookingDate');
    const priceNumber = Number(totalPrice);
    if (Number.isNaN(priceNumber)) missing.push('totalPrice');
    if (missing.length > 0) {
        return res.status(400).json({ error: `Missing or invalid fields: ${missing.join(', ')}` });
    }

    const sql = `INSERT INTO bookings (bookingId, roomId, roomName, guestName, guestContact, checkIn, checkOut, guests, totalPrice, status, bookingDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [bookingId, roomId, roomName, guestName, guestContact, checkIn, checkOut, guests, priceNumber, status, bookingDate];

    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        // After booking, also mark the room as booked
        const updateSql = "UPDATE rooms SET status = ? WHERE id = ?";
        db.query(updateSql, ['booked', roomId], (uErr) => {
            if (uErr) {
                console.warn('Failed to update room status after booking:', uErr);
            }
            // Return the saved booking
            return res.status(201).json({
            bookingId,
            roomId,
            roomName,
            guestName,
            guestContact,
            checkIn,
            checkOut,
            guests,
            totalPrice,
            status,
            bookingDate
            });
        });
    });
});

app.listen(8081, () => {
    console.log("Server is running on port 8081")
})

// Login route: verify user credentials

// Get all bookings for admin panel
app.get("/api/bookings", (req, res) => {
    const status = req.query.status;
    let sql = "SELECT * FROM bookings";
    let params = [];
    
    if (status && status !== 'all') {
        sql += " WHERE status = ?";
        params.push(status);
    }
    
    sql += " ORDER BY bookingDate DESC";
    
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
    const sql = "UPDATE bookings SET status = ? WHERE bookingId = ?";
    db.query(sql, [status, bookingId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        return res.status(200).json({ success: true });
    });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields: email and password are required." });
    }

    const sql = "SELECT id, username, email FROM user_account WHERE email = ? AND password = ? LIMIT 1";
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        if (!results || results.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = results[0];
        return res.status(200).json({ user });
    })
})

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

// Rooms: list all rooms with amenities and images
app.get("/api/rooms", (req, res) => {
    const sql = `
        SELECT 
            r.*,
            GROUP_CONCAT(DISTINCT a.name) as amenity_names,
            GROUP_CONCAT(DISTINCT ri.image_url) as room_images
        FROM rooms r
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
            const name = row.name;
            const description = row.description;
            const rating = Number(row.rating) || 0;
            const status = row.status || "Available";
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
                name,
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
            GROUP_CONCAT(DISTINCT a.name) as amenity_names,
            GROUP_CONCAT(DISTINCT ri.image_url) as room_images
        FROM rooms r
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
            name: row.name,
            category: row.category,
            image: row.image,
            price: Number(row.price) || 0,
            original_price: row.original_price,
            status: row.status || "Available",
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
        name: body.name,
        uploadedFilesCount: uploadedFiles.length,
        amenitiesCount: body.amenities?.length || 0
    });

    const name = body.name;
    const description = body.description ?? "";
    const rating = Number(body.rating ?? 0);
    const status = body.status ?? "Available";
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

    if (!name) {
        return res.status(400).json({ error: "Missing required field: name" });
    }

    // Start transaction
    db.beginTransaction(async (err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to start transaction" });
        }

        try {
            // Insert room
            const roomSql = `INSERT INTO rooms (
                name, category, image, price, original_price,
                status, rating, guests, size, description,
                beds, bathrooms, reviews, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

            const roomValues = [
                name, category, image, price, original_price,
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
        } catch (error) {
            db.rollback(() => {
                res.status(500).json({ error: error.message });
            });
        }
    });
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

// Admin login route: verify admin credentials
app.post("/admin/login", (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields: email and password are required." });
    }

    // Table: admin_account, columns: admin_username, admin_email, admin_password
    const sql = "SELECT admin_username, admin_email FROM admin_account WHERE admin_email = ? AND admin_password = ? LIMIT 1";
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        if (!results || results.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const admin = results[0];
        return res.status(200).json({ admin });
    })
})