# KAT Life — OSTAYA™ Wellness Wear

E-commerce website for KAT Innovation's **KAT Life** brand, featuring OSTAYA™ Wellness Skorts and Shorts.

---

## Project Structure

```
kat-innovation/
├── backend/          # Node.js + Express REST API
│   ├── server.js
│   ├── database.js   # SQLite setup + seeding
│   └── routes/
│       ├── products.js
│       ├── cart.js
│       ├── subscribe.js
│       └── contact.js
└── frontend/         # React app
    ├── public/
    └── src/
        ├── components/
        │   ├── Navbar.js / Navbar.css
        │   └── Footer.js / Footer.css
        └── pages/
            ├── Shop.js / Shop.css
            ├── ProductDetail.js / ProductDetail.css
            └── Contact.js / Contact.css
```

---

## Prerequisites

- **Node.js** v18+ — https://nodejs.org
- **npm** v9+

---

## Setup & Running

### 1. Backend

```bash
cd backend
npm install
node server.js
```

The API server starts at **http://localhost:5000**

On first run, the SQLite database (`kat_life.db`) is created and seeded with **8 products** (4 Wellness Skorts + 4 Wellness Shorts).

### 2. Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm start
```

The React app starts at **http://localhost:3000** and proxies API calls to `http://localhost:5000`.

---

## Pages

| Route | Page |
|---|---|
| `/` | Redirects to `/shop` |
| `/shop` | Product listing with filter & sort |
| `/shop/:id` | Product detail with size/color selector |
| `/contact` | Contact form + info |

---

## API Endpoints

### Products
| Method | Route | Description |
|---|---|---|
| GET | `/api/products` | All products |
| GET | `/api/products/:id` | Single product |

### Cart
| Method | Route | Description |
|---|---|---|
| POST | `/api/cart` | Add item (`session_id`, `product_id`, `size`, `color`, `quantity`) |
| GET | `/api/cart/:sessionId` | Get cart for session |
| PUT | `/api/cart/:itemId` | Update quantity |
| DELETE | `/api/cart/:itemId` | Remove item |

### Newsletter
| Method | Route | Description |
|---|---|---|
| POST | `/api/subscribe` | Subscribe email |

### Contact
| Method | Route | Description |
|---|---|---|
| POST | `/api/contact` | Submit contact form |

---

## Database (SQLite)

File: `backend/kat_life.db` (auto-created on first run)

| Table | Columns |
|---|---|
| `products` | id, name, type, color, price, image_url, description, created_at |
| `cart` | id, session_id, product_id, size, color, quantity, created_at |
| `email_subscriptions` | id, email, subscribed_at |
| `contact_messages` | id, full_name, contact, email, message, sent_at |

---

## Brand Details

- **Brand:** KAT Life by KAT Innovation
- **Product:** OSTAYA™ Wellness Skorts & Shorts
- **Colors:** White, Black, Grey, Royal Blue, Navy Blue
- **Sizes:** XS, S, M, L, XL
- **Tagline:** *Osteo Support That Activates Your Active Core™*
- **Contact:** info@katinnovation.com | +1 123-456-7890
