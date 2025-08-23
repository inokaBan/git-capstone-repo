const express = require("express")
const mysql = require("mysql")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())


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

    if (!bookingId || !roomId || !roomName || !guestName || !guestContact || !checkIn || !checkOut || !guests || !totalPrice || !status || !bookingDate) {
        return res.status(400).json({ error: "Missing required booking fields." });
    }

    const sql = `INSERT INTO bookings (bookingId, roomId, roomName, guestName, guestContact, checkIn, checkOut, guests, totalPrice, status, bookingDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [bookingId, roomId, roomName, guestName, guestContact, checkIn, checkOut, guests, totalPrice, status, bookingDate];

    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.code || err.message || "Database error" });
        }
        // Return the saved booking with its new ID
        res.status(201).json({
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