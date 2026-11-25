# Price My Gem — MySQL/XAMPP Setup Guide

## Prerequisites
- XAMPP installed (Apache + MySQL started)
- Node.js 18+

---

## Step 1 — XAMPP Start karo
1. XAMPP Control Panel kholein
2. **Apache** → Start
3. **MySQL** → Start
4. MySQL green ho jaye tab aage barho

---

## Step 2 — Dependencies install karo
```bash
cd backend
npm install
```

---

## Step 3 — Database aur Tables create karo
```bash
npm run init
```
Yeh automatically:
- `pricemygem_db` database create karega
- `users`, `admins`, `prices`, `reports` tables create karega

---

## Step 4 — Default admin aur gem prices seed karo
```bash
npm run seed
```
Default admin credentials:
- **Email:** pricemygem@gmail.com
- **Password:** admin123

---

## Step 5 — Server chalaao
```bash
npm run dev
```
Server: `http://localhost:5002`

---

## Step 6 — Frontend chalaao (alag terminal)
```bash
cd frontend
npm run dev
```
Dashboard: `http://localhost:5173`

---

## Database Tables

| Table     | Description                              |
|-----------|------------------------------------------|
| `users`   | Mobile app registered users              |
| `admins`  | Admin panel users                        |
| `prices`  | Gemstone price per carat (PKR)          |
| `reports` | AI analysis reports (FK → users)        |

---

## .env Configuration
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=        ← XAMPP default has no password
DB_NAME=pricemygem_db
```

Agar aapne XAMPP MySQL ka password set kiya hua hai toh `DB_PASSWORD` mein woh daalein.

---

## phpMyAdmin se verify karo
`http://localhost/phpmyadmin` kholein → `pricemygem_db` database select karein → tables check karein.
