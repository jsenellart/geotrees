from rest_framework import viewsets
from core.models import Tree
from .serializers import TreeGeoSerializer
from django.contrib.gis.geos import Polygon
from django.shortcuts import render
from django.shortcuts import render
from .forms import ImageUploadForm

from core.utils.plantnet_utils import get_plantnet_response, get_plantnet_quota

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
    form = ImageUploadForm(request.POST or None, request.FILES or None)
    results = None
    error   = None

    if request.method == 'POST' and form.is_valid():
        image_files = form.cleaned_data['images']
        organ       = ["auto" for i in range(len(image_files))]
        try:
            resp = get_plantnet_response(image_files, organ)
            if resp.status_code == 200:
                results = resp.json().get("results", [])
            else:
                error = f"API Error {resp.status_code}: {resp.text}"
        except Exception as e:
            error = str(e)
    try:
        qr = get_plantnet_quota()
        if qr.status_code == 200:
            q = qr.json()
            used      = q.get("count",    {}).get("identify", "N/A")
            remaining = q.get("remaining", {}).get("identify", "N/A")
        else:
            used = remaining = "N/A"
    except Exception:
        used = remaining = "Error"

    return render(request, 'plantnet_upload.html', {
        'form':            form,
        'results':         results,
        'error':           error,
        'request_count':   used,
        'remaining_quota': remaining,
    })