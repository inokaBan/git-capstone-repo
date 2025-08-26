-- Hotel Reservation System Database Schema
-- Updated schema without floor, view, policies, and features

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS osner_db;
USE osner_db;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS room_images;
DROP TABLE IF EXISTS room_amenities;
DROP TABLE IF EXISTS amenities;
DROP TABLE IF EXISTS rooms;

-- Create rooms table with new schema
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Standard',
    image VARCHAR(500),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    original_price VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Available',
    rating DECIMAL(3,2) DEFAULT 5.0,
    guests INT DEFAULT 1,
    size VARCHAR(100),
    description TEXT,
    beds INT DEFAULT 1,
    bathrooms INT DEFAULT 1,
    reviews INT DEFAULT 0,
    long_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create amenities master table
CREATE TABLE amenities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create room_amenities junction table
CREATE TABLE room_amenities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    amenity_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_amenity (room_id, amenity_id)
);

-- Create room_images table for multiple images per room
CREATE TABLE room_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Insert sample amenities
INSERT INTO amenities (name) VALUES 
('WiFi'),
('Air Conditioning'),
('Mini Bar'),
('Room Service'),
('Parking'),
('Gym Access'),
('Pool Access'),
('Balcony'),
('Ocean View'),
('City View'),
('Premium Bedding'),
('Coffee Machine'),
('King Bed'),
('Marble Bathroom'),
('Panoramic View'),
('Floor-to-ceiling Windows'),
('Seating Area'),
('Premium WiFi'),
('Living Area'),
('Concierge Service'),
('Premium Amenities'),
('Connecting Rooms'),
('Kid-friendly'),
('Kitchenette'),
('Family Games'),
('Private Balcony'),
('Jacuzzi'),
('Champagne Service'),
('Rose Petals'),
('Private Terrace'),
('Butler Service'),
('Premium Dining'),
('Personal Chef'),
('Private Elevator'),
('24/7 Butler');

-- Insert sample rooms
INSERT INTO rooms (name, category, image, price, original_price, status, rating, guests, size, description, beds, bathrooms, reviews, long_description) VALUES
('Classic Standard Room', 'Standard', 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 120.00, '₱150', 'Available', 4.5, 2, '25 m²', 'Comfortable and cozy room with modern amenities and city view.', 1, 1, 128, 'This is a sample long description about the room\'s layout, comfort, and style. You can customize this per room for more detail.'),
('Standard Twin Room', 'Standard', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 110.00, '₱140', 'Available', 4.3, 2, '23 m²', 'Twin bed configuration perfect for friends or business travelers.', 1, 1, 128, 'This is a sample long description about the room\'s layout, comfort, and style. You can customize this per room for more detail.'),
('Standard Garden View', 'Standard', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 135.00, '₱160', 'Available', 4.6, 2, '27 m²', 'Peaceful room overlooking our beautiful garden courtyard.', 1, 1, 128, 'This is a sample long description about the room\'s layout, comfort, and style. You can customize this per room for more detail.'),
('Deluxe City View', 'Deluxe', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 200.00, '₱250', 'Available', 4.7, 3, '35 m²', 'Spacious room with premium furnishing and panoramic city views.', 1, 1, 128, 'This is a sample long description about the room\'s layout, comfort, and style. You can customize this per room for more detail.'),
('Deluxe King Room', 'Deluxe', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 220.00, '₱270', 'Available', 4.8, 2, '40 m²', 'Luxurious king-sized bed with elegant decor and modern amenities.', 1, 1, 128, 'This is a sample long description about the room\'s layout, comfort, and style. You can customize this per room for more detail.'),
('Deluxe Corner Room', 'Deluxe', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 240.00, '₱290', 'Available', 4.9, 3, '45 m²', 'Corner room with floor-to-ceiling windows and stunning city panorama.', 1, 1, 128, 'This is a sample long description about the room\'s layout, comfort, and style. You can customize this per room for more detail.'),
('Executive Suite', 'Suite', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 350.00, '₱400', 'Available', 4.9, 4, '60 m²', 'Elegant suite with separate living area and breathtaking ocean views.', 1, 1, 128, 'This is a sample long description about the room\'s layout, comfort, and style. You can customize this per room for more detail.'),
('Family Suite', 'Suite', 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 320.00, '₱380', 'Available', 4.7, 6, '75 m²', 'Perfect for families with connecting rooms and kid-friendly amenities.', 1, 1, 128, 'This is a sample long description about the room\'s layout, comfort, and style. You can customize this per room for more detail.'),
('Honeymoon Suite', 'Suite', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 380.00, '₱450', 'Available', 5.0, 2, '55 m²', 'Romantic suite with private balcony and champagne service.', 1, 1, 128, 'This is a sample long description about the room\'s layout, comfort, and style. You can customize this per room for more detail.'),
('Presidential Suite', 'Presidential', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 600.00, '₱750', 'Available', 5.0, 6, '120 m²', 'Ultimate luxury with private terrace, dining area, and exclusive amenities.', 1, 1, 128, 'This is a sample long description about the room\'s layout, comfort, and style. You can customize this per room for more detail.'),
('Royal Presidential Suite', 'Presidential', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 800.00, '₱950', 'Available', 5.0, 8, '150 m²', 'The pinnacle of luxury with panoramic views and personalized service.', 1, 1, 128, 'This is a sample long description about the room\'s layout, comfort, and style. You can customize this per room for more detail.');

-- Insert sample room images
INSERT INTO room_images (room_id, image_url, is_primary, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', TRUE, 1),
(1, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', FALSE, 2),
(1, 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', FALSE, 3),
(1, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', FALSE, 4),
(2, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', TRUE, 1),
(2, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', FALSE, 2),
(3, 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', TRUE, 1),
(3, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', FALSE, 2),
(4, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', TRUE, 1),
(4, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', FALSE, 2),
(5, 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', TRUE, 1),
(5, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', FALSE, 2),
(6, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', TRUE, 1),
(6, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', FALSE, 2),
(7, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', TRUE, 1),
(7, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', FALSE, 2),
(8, 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', TRUE, 1),
(8, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', FALSE, 2),
(9, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', TRUE, 1),
(9, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', FALSE, 2),
(10, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', TRUE, 1),
(10, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', FALSE, 2),
(11, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', TRUE, 1),
(11, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', FALSE, 2);

-- Insert sample room amenities relationships
INSERT INTO room_amenities (room_id, amenity_id) VALUES
-- Classic Standard Room
(1, (SELECT id FROM amenities WHERE name = 'WiFi')),
(1, (SELECT id FROM amenities WHERE name = 'Air Conditioning')),
(1, (SELECT id FROM amenities WHERE name = 'Mini Bar')),
(1, (SELECT id FROM amenities WHERE name = 'Room Service')),

-- Standard Twin Room
(2, (SELECT id FROM amenities WHERE name = 'WiFi')),
(2, (SELECT id FROM amenities WHERE name = 'Air Conditioning')),
(2, (SELECT id FROM amenities WHERE name = 'Mini Bar')),
(2, (SELECT id FROM amenities WHERE name = 'Room Service')),

-- Standard Garden View
(3, (SELECT id FROM amenities WHERE name = 'Garden View')),
(3, (SELECT id FROM amenities WHERE name = 'WiFi')),
(3, (SELECT id FROM amenities WHERE name = 'Mini Bar')),
(3, (SELECT id FROM amenities WHERE name = 'Room Service')),

-- Deluxe City View
(4, (SELECT id FROM amenities WHERE name = 'City View')),
(4, (SELECT id FROM amenities WHERE name = 'Balcony')),
(4, (SELECT id FROM amenities WHERE name = 'Premium Bedding')),
(4, (SELECT id FROM amenities WHERE name = 'Coffee Machine')),

-- Deluxe King Room
(5, (SELECT id FROM amenities WHERE name = 'King Bed')),
(5, (SELECT id FROM amenities WHERE name = 'Marble Bathroom')),
(5, (SELECT id FROM amenities WHERE name = 'Mini Bar')),
(5, (SELECT id FROM amenities WHERE name = 'Room Service')),

-- Deluxe Corner Room
(6, (SELECT id FROM amenities WHERE name = 'Panoramic View')),
(6, (SELECT id FROM amenities WHERE name = 'Floor-to-ceiling Windows')),
(6, (SELECT id FROM amenities WHERE name = 'Seating Area')),
(6, (SELECT id FROM amenities WHERE name = 'Premium WiFi')),

-- Executive Suite
(7, (SELECT id FROM amenities WHERE name = 'Ocean View')),
(7, (SELECT id FROM amenities WHERE name = 'Living Area')),
(7, (SELECT id FROM amenities WHERE name = 'Concierge Service')),
(7, (SELECT id FROM amenities WHERE name = 'Premium Amenities')),

-- Family Suite
(8, (SELECT id FROM amenities WHERE name = 'Connecting Rooms')),
(8, (SELECT id FROM amenities WHERE name = 'Kid-friendly')),
(8, (SELECT id FROM amenities WHERE name = 'Kitchenette')),
(8, (SELECT id FROM amenities WHERE name = 'Family Games')),

-- Honeymoon Suite
(9, (SELECT id FROM amenities WHERE name = 'Private Balcony')),
(9, (SELECT id FROM amenities WHERE name = 'Jacuzzi')),
(9, (SELECT id FROM amenities WHERE name = 'Champagne Service')),
(9, (SELECT id FROM amenities WHERE name = 'Rose Petals')),

-- Presidential Suite
(10, (SELECT id FROM amenities WHERE name = 'Private Terrace')),
(10, (SELECT id FROM amenities WHERE name = 'Butler Service')),
(10, (SELECT id FROM amenities WHERE name = 'Jacuzzi')),
(10, (SELECT id FROM amenities WHERE name = 'Premium Dining')),

-- Royal Presidential Suite
(11, (SELECT id FROM amenities WHERE name = 'Panoramic Views')),
(11, (SELECT id FROM amenities WHERE name = 'Personal Chef')),
(11, (SELECT id FROM amenities WHERE name = 'Private Elevator')),
(11, (SELECT id FROM amenities WHERE name = '24/7 Butler'));

-- Create indexes for better performance
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_category ON rooms(category);
CREATE INDEX idx_rooms_price ON rooms(price);
CREATE INDEX idx_room_amenities_room_id ON room_amenities(room_id);
CREATE INDEX idx_room_amenities_amenity_id ON room_amenities(amenity_id);
CREATE INDEX idx_room_images_room_id ON room_images(room_id);
CREATE INDEX idx_room_images_sort_order ON room_images(sort_order);

-- Show the created tables
SHOW TABLES;

-- Show sample data
SELECT 'Rooms' as table_name, COUNT(*) as count FROM rooms
UNION ALL
SELECT 'Amenities', COUNT(*) FROM amenities
UNION ALL
SELECT 'Room Amenities', COUNT(*) FROM room_amenities
UNION ALL
SELECT 'Room Images', COUNT(*) FROM room_images;
