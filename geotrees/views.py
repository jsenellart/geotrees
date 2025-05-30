from rest_framework import viewsets
from core.models import Tree
from .serializers import TreeGeoSerializer

from django.shortcuts import render

def map_view(request):
    return render(request, 'trees/map.html')

class TreeGeoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tree.objects.all()
    serializer_class = TreeGeoSerializer
