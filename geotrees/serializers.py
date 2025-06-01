from rest_framework_gis.serializers import GeoFeatureModelSerializer
from rest_framework import serializers
from core.models import Tree

class TreeGeoSerializer(GeoFeatureModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Tree
        geo_field = "location"
        fields = ("tree_id", "public_accessible", "created_at", "created_by", "created_by_username")
        read_only_fields = ("tree_id", "created_at", "created_by", "created_by_username")
