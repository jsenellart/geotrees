from rest_framework import viewsets
from core.models import Tree
from .serializers import TreeGeoSerializer
from django.contrib.gis.geos import Polygon
from django.shortcuts import render

def map_view(request):
    return render(request, 'trees/map.html')

class TreeGeoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tree.objects.all()
    serializer_class = TreeGeoSerializer
    
    def get_queryset(self):
        queryset = Tree.objects.all()
        bbox = self.request.query_params.get('bbox')
        
        if bbox:
            try:
                west, south, east, north = map(float, bbox.split(','))
                bbox_polygon = Polygon.from_bbox((west, south, east, north))
                queryset = queryset.filter(location__within=bbox_polygon)
            except (ValueError, TypeError):
                pass
                
        return queryset
