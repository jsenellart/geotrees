from rest_framework_gis.serializers import GeoFeatureModelSerializer
from core.models import Tree

class TreeGeoSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Tree
        geo_field = "location"
        fields = ("tree_id", "public_accessible", "created_at")
