from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.product_list),
    path('products/<int:product_id>/', views.product_detail),
    path('register/', views.register),
    path('login/', views.login_view),
    path('me/', views.me),
    path('checkout/', views.checkout),
]