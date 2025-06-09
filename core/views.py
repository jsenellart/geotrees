from rest_framework import viewsets
from core.models import Tree
from .serializers import TreeGeoSerializer
from django.contrib.gis.geos import Polygon
from django.shortcuts import render
from django.http import JsonResponse
import tempfile
from django.shortcuts import render
from .forms import ImageUploadForm

from core.utils.plantnet_utils import get_netplant_response

def map_view(request):
    return render(request, 'trees/map.html')

class TreeGeoViewSet(viewsets.ModelViewSet):
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

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

def destroy(self, request, *args, **kwargs):
        tree = self.get_object()
        if tree.created_by != request.user:
            from rest_framework.response import Response
            from rest_framework import status
            return Response({'error': 'You can only delete your own trees'},
                          status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)



def plantnet_upload_view(request):
    result_data = None
    error_message = None

    if request.method == 'POST':
        form = ImageUploadForm(request.POST, request.FILES)
        if form.is_valid():
            image_file = form.cleaned_data['image']
            organ = form.cleaned_data.get('organs')

            try:
                response = get_netplant_response([image_file], [organ])
                if response.status_code == 200:
                    result_data = response.json().get("results", [])
                else:
                    error_message = f"API Error {response.status_code}: {response.text}"
            except Exception as e:
                error_message = str(e)
        else:
            error_message = "Invalid form submission."
    else:
        form = ImageUploadForm()

    return render(request, 'plantnet_upload.html', {
        'form': form,
        'results': result_data,
        'error': error_message
    })