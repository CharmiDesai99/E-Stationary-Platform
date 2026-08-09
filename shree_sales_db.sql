-- ============================================================
--  SHREE SALES STATIONERY - MySQL Database Schema
--  Run this in phpMyAdmin or MySQL Workbench
-- ============================================================

-- 1. Create and select the database
CREATE DATABASE IF NOT EXISTS shree_sales_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shree_sales_db;

-- ============================================================
--  NOTE: Django will create these tables automatically when you
--  run: python manage.py migrate
--  The SQL below is for reference and for phpMyAdmin setup.
-- ============================================================

-- Django Auth User Table (created by Django)
-- django_content_type, auth_permission, auth_group, auth_user, etc.

-- Categories
CREATE TABLE IF NOT EXISTS products_category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Products
CREATE TABLE IF NOT EXISTS products_product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description LONGTEXT,
    image VARCHAR(100),
    is_best_seller TINYINT(1) DEFAULT 0,
    stock INT DEFAULT 100,
    FOREIGN KEY (category_id) REFERENCES products_category(id)
);

-- Customer Profile (extends Django User)
CREATE TABLE IF NOT EXISTS accounts_customerprofile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    full_name VARCHAR(200) DEFAULT '',
    address LONGTEXT DEFAULT '',
    pincode VARCHAR(10) DEFAULT '',
    mobile VARCHAR(15) DEFAULT ''
    -- FOREIGN KEY (user_id) REFERENCES auth_user(id)
);

-- Orders
CREATE TABLE IF NOT EXISTS products_order (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    customer_name VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address LONGTEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    platform_charge DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(20) DEFAULT 'cod',
    payment_screenshot VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    admin_comment LONGTEXT,
    created_at DATETIME(6) NOT NULL
    -- FOREIGN KEY (user_id) REFERENCES auth_user(id)
);

-- Order Items
CREATE TABLE IF NOT EXISTS products_orderitem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(200) DEFAULT '',
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    shape VARCHAR(50),
    color VARCHAR(50),
    stamp_text LONGTEXT,
    stamp_image VARCHAR(100),
    FOREIGN KEY (order_id) REFERENCES products_order(id) ON DELETE CASCADE
    -- FOREIGN KEY (product_id) REFERENCES products_product(id)
);

-- Feedback
CREATE TABLE IF NOT EXISTS products_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    username VARCHAR(150) DEFAULT '',
    stars INT DEFAULT 5,
    message LONGTEXT,
    created_at DATETIME(6) NOT NULL
    -- FOREIGN KEY (user_id) REFERENCES auth_user(id)
);

-- Visitor Counter
CREATE TABLE IF NOT EXISTS products_visitor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    count INT DEFAULT 0
);

-- Insert initial visitor record
INSERT INTO products_visitor (id, count) VALUES (1, 0) ON DUPLICATE KEY UPDATE id=id;

-- ============================================================
--  Sample Categories (you can add more via Django Admin)
-- ============================================================
INSERT INTO products_category (name) VALUES
('Pens & Pencils'),
('Notebooks'),
('Art Supplies'),
('Office Supplies'),
('Stamps'),
('Gift & Wrapping'),
('Files & Folders'),
('Printer Paper');

-- ============================================================
--  HOW TO SWITCH TO MYSQL IN DJANGO:
--
--  1. Install MySQL client:
--     pip install mysqlclient
--
--  2. In settings.py, change DATABASES to:
--     DATABASES = {
--         'default': {
--             'ENGINE': 'django.db.backends.mysql',
--             'NAME': 'shree_sales_db',
--             'USER': 'root',
--             'PASSWORD': 'your_password_here',
--             'HOST': 'localhost',
--             'PORT': '3306',
--             'OPTIONS': {'charset': 'utf8mb4'},
--         }
--     }
--
--  3. Run: python manage.py migrate
--  4. Run: python manage.py createsuperuser
-- ============================================================
