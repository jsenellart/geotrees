"""
URL configuration for geotrees project.
"""
from django.contrib import admin
from django.urls import path
from rest_framework.routers import DefaultRouter
from django.urls import include, path
from django.contrib.auth import views as auth_views
from .views import TreeGeoViewSet
from .views import map_view, plantnet_upload_view

router = DefaultRouter()
router.register(r'trees', TreeGeoViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('', map_view, name='map'),
    path('login/', auth_views.LoginView.as_view(), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='/'), name='logout'),
    path('identify/', plantnet_upload_view, name='plantnet_upload'),
]
