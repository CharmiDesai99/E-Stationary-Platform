# 🛍️ Shree Sales Stationery - How to Run Guide

## Prerequisites

Make sure you have these installed:
- **Python 3.10+** → [python.org](https://python.org)
- **Node.js 16+** → [nodejs.org](https://nodejs.org)
- **pip** (comes with Python)

---

## STEP 1 - Set Up the Django Backend

Open a **Command Prompt / Terminal** and navigate to the backend folder:

```cmd
cd D:\SEM-4\shree-sales-stationary\shree-sales\backend\shreesales
```

### 1a. Create and activate virtual environment
```cmd
python -m venv venv
venv\Scripts\activate
```

### 1b. Install Python dependencies
```cmd
pip install django djangorestframework django-cors-headers pillow
```

### 1c. Apply database migrations
```cmd
python manage.py makemigrations
python manage.py migrate
```

### 1d. Create admin superuser
```cmd
python manage.py createsuperuser
```
Enter a username, email (`aharsh1993@gmail.com` for admin access), and password.

### 1e. Start the Django server
```cmd
python manage.py runserver
```
✅ Backend runs at: **http://127.0.0.1:8000/**

---

## STEP 2 - Set Up the React Frontend

Open a **second Command Prompt** and navigate to frontend:

```cmd
cd D:\SEM-4\shree-sales-stationary\shree-sales\frontend
```

### 2a. Install dependencies
```cmd
npm install
```

### 2b. Start React development server
```cmd
npm start
```
✅ Frontend runs at: **http://localhost:3000/**

---

## STEP 3 - (Optional) Switch to MySQL

1. Install MySQL & phpMyAdmin
2. In phpMyAdmin, create database: `shree_sales_db`
3. Run the file `shree_sales_db.sql` in phpMyAdmin SQL tab
4. Install Python MySQL driver:
   ```cmd
   pip install mysqlclient
   ```
5. In `backend/shreesales/shreesales/settings.py`, uncomment the MySQL DATABASES block and add your password
6. Re-run migrations: `python manage.py migrate`

---

## STEP 4 - Add Products via Django Admin

1. Go to: **http://127.0.0.1:8000/admin/**
2. Login with your superuser
3. Add **Categories** first (e.g., Pens, Notebooks, Stamps...)
4. Add **Products** under each category (with photos, price, best seller toggle)

---

## 🔑 Admin Login

To access the admin dashboard at **http://localhost:3000/admin-dashboard**:
- Login with the superuser email `aharsh1993@gmail.com`
- OR login with any user that has `is_staff = True` in Django admin

---

## ✉️ Email Configuration

Email is already configured in `settings.py`. To use your own Gmail:
1. Enable 2-Factor Authentication on Gmail
2. Create an App Password: Google Account → Security → App Passwords
3. Update in `settings.py`:
   ```python
   EMAIL_HOST_USER = 'your_email@gmail.com'
   EMAIL_HOST_PASSWORD = 'your_16_char_app_password'
   ```

---

## 💳 QR Code (Payment)

In `frontend/src/pages/Checkout.jsx`, find the `qr-placeholder` div and replace it with:
```jsx
<img src="/your-qr-code.png" alt="Payment QR" style={{ width: 180, height: 180 }} />
```
Place your QR image in `frontend/public/`.

---

## 📱 WhatsApp Button

The WhatsApp button is already set to **+91 94284 65069**.
To change it, edit `frontend/src/component/WhatsAppButton.jsx`.

---

## 🗂️ Project Structure

```
shree-sales/
├── backend/shreesales/
│   ├── accounts/          # User auth, profile
│   ├── products/          # Products, orders, feedback
│   └── shreesales/        # Settings, main URLs
├── frontend/src/
│   ├── component/         # Header, Footer, Slider, etc.
│   ├── pages/             # Landing, Cart, Checkout, etc.
│   └── styles/            # Global CSS
└── shree_sales_db.sql     # MySQL schema (optional)
```

---

## 🚀 Quick Start (Both servers)

**Terminal 1 (Backend):**
```cmd
cd D:\SEM-4\shree-sales-stationary\shree-sales\backend\shreesales
venv\Scripts\activate
python manage.py runserver
```

**Terminal 2 (Frontend):**
```cmd
cd D:\SEM-4\shree-sales-stationary\shree-sales\frontend
npm start
```

Open **http://localhost:3000** in your browser! 🎉
