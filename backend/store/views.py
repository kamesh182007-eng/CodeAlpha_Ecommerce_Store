import json
from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core import signing
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from .models import Product, Order, OrderItem


class OrderError(Exception):
    pass


def product_list(request):
    products = Product.objects.all()
    data = []
    for p in products:
        data.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": float(p.price),
            "image_url": p.image_url,
            "stock": p.stock,
        })
    return JsonResponse(data, safe=False)


def product_detail(request, product_id):
    try:
        p = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)

    return JsonResponse({
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "price": float(p.price),
        "image_url": p.image_url,
        "stock": p.stock,
    })


def get_user(request):
    """Read the login token from the request and return the user (or None)."""
    header = request.headers.get('Authorization', '')
    if not header.startswith('Bearer '):
        return None
    token = header[7:]
    try:
        data = signing.loads(token, max_age=60 * 60 * 24 * 7)  # valid for 7 days
        return User.objects.get(id=data['user_id'])
    except Exception:
        return None


@csrf_exempt
def register(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        data = json.loads(request.body)
    except ValueError:
        return JsonResponse({'error': 'Invalid data'}, status=400)

    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return JsonResponse({'error': 'Username and password are required'}, status=400)
    if len(password) < 6:
        return JsonResponse({'error': 'Password must be at least 6 characters'}, status=400)
    if User.objects.filter(username=username).exists():
        return JsonResponse({'error': 'Username already taken'}, status=400)

    User.objects.create_user(username=username, email=email, password=password)
    return JsonResponse({'message': 'Registered successfully'}, status=201)


@csrf_exempt
def login_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        data = json.loads(request.body)
    except ValueError:
        return JsonResponse({'error': 'Invalid data'}, status=400)

    user = authenticate(
        username=data.get('username', '').strip(),
        password=data.get('password', ''),
    )
    if user is None:
        return JsonResponse({'error': 'Wrong username or password'}, status=401)

    token = signing.dumps({'user_id': user.id})
    return JsonResponse({'token': token, 'username': user.username})


def me(request):
    user = get_user(request)
    if user is None:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    return JsonResponse({'username': user.username, 'email': user.email})


@csrf_exempt
def checkout(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    user = get_user(request)
    if user is None:
        return JsonResponse({'error': 'Please log in first'}, status=401)

    try:
        data = json.loads(request.body)
    except ValueError:
        return JsonResponse({'error': 'Invalid data'}, status=400)

    items = data.get('items', [])
    if not items:
        return JsonResponse({'error': 'Your cart is empty'}, status=400)

    try:
        with transaction.atomic():
            order = Order.objects.create(user=user)
            total = 0

            for item in items:
                try:
                    product = Product.objects.get(id=item.get('id'))
                    qty = int(item.get('qty', 1))
                except (Product.DoesNotExist, ValueError, TypeError):
                    raise OrderError('A product in your cart is not valid')

                if qty < 1:
                    raise OrderError('Invalid quantity')
                if product.stock < qty:
                    raise OrderError('Not enough stock for ' + product.name)

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    name=product.name,
                    price=product.price,
                    quantity=qty,
                )
                product.stock -= qty
                product.save()
                total += product.price * qty

            order.total = total
            order.save()
    except OrderError as error:
        return JsonResponse({'error': str(error)}, status=400)

    return JsonResponse({'order_id': order.id, 'total': float(order.total)}, status=201)