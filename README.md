# ShopEase - Simple E-commerce Store

A basic full-stack e-commerce website built as **Task 1** of the CodeAlpha Full Stack Development internship.

## Features

- Product listings loaded from the database
- Product details page (name, description, price, stock)
- Shopping cart (saved in the browser)
- User registration and login (token based)
- Order processing: orders and order items are saved in the database, and stock is reduced
- Django admin panel to manage products, users and orders

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, Django
- **Database:** SQLite
- **Other:** django-cors-headers (lets the frontend call the API)

## Project Structure

```
CodeAlpha_Ecommerce_Store/
├── index.html        # Home page: products, cart, account
├── product.html      # Product details page
├── script.js         # Frontend logic (products, cart, login, checkout)
├── style.css         # Styling
└── backend/
    ├── manage.py
    ├── requirements.txt
    ├── shopease/     # Django project settings and main URLs
    └── store/        # App: models, views, API URLs
```

## How to Run

1. Open a terminal in the `backend` folder.
2. Create and activate a virtual environment:

   ```
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install the packages:

   ```
   python -m pip install -r requirements.txt
   ```

4. Create the database tables:

   ```
   python manage.py migrate
   ```

5. Create an admin user:

   ```
   python manage.py createsuperuser
   ```

6. Start the server:

   ```
   python manage.py runserver
   ```

7. Open `http://127.0.0.1:8000/admin`, log in, and add a few products.
8. Open `index.html` in your browser to use the store.

## API Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/api/products/` | List all products |
| GET | `/api/products/<id>/` | Get one product |
| POST | `/api/register/` | Create a new user |
| POST | `/api/login/` | Log in and get a token |
| GET | `/api/me/` | Get the logged-in user |
| POST | `/api/checkout/` | Place an order (login required) |

## Author

Kamesh - CodeAlpha Full Stack Development Intern
