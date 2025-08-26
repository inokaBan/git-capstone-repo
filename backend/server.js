const express = require("express")
const mysql = require("mysql")
const cors = require("cors")

const app = express()
app.use(cors())
// Increase body size limits to handle base64 images from admin room uploads
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))


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

// Rooms: list all rooms
app.get("/api/rooms", (req, res) => {
    const sql = "SELECT * FROM rooms ORDER BY id DESC";
    db.query(sql, [], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        // Parse JSON fields
        const rooms = (results || []).map((row) => {
            const id = row.id ?? row.room_id ?? row.ID;
            const name = row.name ?? row.room_name ?? row.Name;
            const description = row.description ?? row.room_description ?? row.Description;
            const ratingRaw = row.rating ?? row.room_rating ?? row.Rating;
            const status = row.status ?? row.room_status ?? row.Status ?? "Available";
            const bedsRaw = row.beds ?? row.num_beds ?? row.Beds;
            const priceRaw = row.price_num ?? row.price ?? row.room_price ?? row.Price;
            const maxGuestsRaw = row.maxGuests ?? row.max_guests ?? row.capacity ?? row.guests ?? row.MaxGuests;
            const size = row.size ?? row.room_size ?? row.Size ?? "";
            const amenitiesRaw = row.amenities ?? row.room_amenities ?? row.Amenities;
            const imagesRaw = row.images ?? row.room_images ?? row.Images;

            const parseJSON = (val) => {
                if (val == null) return [];
                if (Array.isArray(val)) return val;
                try { return JSON.parse(val); } catch { return []; }
            };

            return {
                id,
                name,
                description,
                rating: Number(ratingRaw) || 0,
                status,
                beds: Number(bedsRaw) || 0,
                price: Number(priceRaw) || 0,
                maxGuests: Number(maxGuestsRaw) || 0,
                size,
                amenities: parseJSON(amenitiesRaw),
                images: parseJSON(imagesRaw)
            };
        });
        return res.status(200).json(rooms);
    });
});

// Rooms: create a new room
app.post("/api/rooms", (req, res) => {
    const body = req.body || {};

    // Accept both new admin payload and legacy data.json-like fields
    const name = body.name;
    const description = body.description ?? "";
    const rating = Number(body.rating ?? 0);
    const status = body.status ?? "Available";
    const beds = Number(body.beds ?? 1);
    const reviews = Number(body.reviews ?? 0);
    const size = body.size ?? "";
    const category = body.category ?? null;

    // Price: support either numeric price or string like "₱200" + optional price_num
    const priceNum = body.price_num != null
        ? Number(body.price_num)
        : (typeof body.price === 'number' ? Number(body.price) : Number(String(body.price || '').replace(/[^\d.]/g, '')) || 0);
    const priceStr = body.price != null && typeof body.price === 'string' ? body.price : `₱${priceNum}`;
    const originalPrice = body.original_price ?? null;

    // Guests field in DB is `guests`; accept maxGuests or guests
    const guests = Number(body.maxGuests ?? body.guests ?? 1);

    // Images: store cover in `image` and full array JSON in `images`
    const images = Array.isArray(body.images) ? body.images.slice(0, 5) : [];
    const image = body.image ?? images[0] ?? null;

    const amenities = Array.isArray(body.amenities) ? body.amenities : [];

    if (!name) {
        return res.status(400).json({ error: "Missing required field: name" });
    }

    const sql = `INSERT INTO rooms (
        name, category, image, price, original_price, price_num,
        status, rating, guests, size, description,
        amenities, images, beds, reviews, check_in, check_out
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        name,
        category,
        image,
        priceStr,
        originalPrice,
        priceNum,
        status,
        rating,
        guests,
        size,
        description,
        JSON.stringify(amenities),
        JSON.stringify(images),
        beds,
        reviews,
        body.check_in ?? null,
        body.check_out ?? null,
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        return res.status(201).json({ id: result.insertId });
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