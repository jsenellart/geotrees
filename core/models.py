from django.contrib.gis.db import models as gis_models
from django.db import models
from django.contrib.auth.models import User
import uuid

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=50, choices=[('citizen', 'Citizen'), ('admin', 'Admin')], default='citizen')
    language = models.CharField(max_length=10, default='en')

class Tree(models.Model):
    tree_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    location = gis_models.PointField(geography=True)
    public_accessible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_trees')

class Observation(models.Model):
    observation_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tree = models.ForeignKey(Tree, on_delete=models.CASCADE, related_name='observations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='observations')
    observed_at = models.DateTimeField(auto_now_add=True)
    trunk_diameter = models.FloatField(null=True, blank=True)
    height = models.FloatField(null=True, blank=True)
    rating = models.IntegerField(null=True, blank=True)
    remarkable = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

class ObservationImage(models.Model):
    image_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    observation = models.ForeignKey(Observation, on_delete=models.CASCADE, related_name='images')
    image_url = models.TextField()
    location = gis_models.PointField(geography=True, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

class SpeciesIdentification(models.Model):
    identification_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tree = models.ForeignKey(Tree, on_delete=models.CASCADE, related_name='identifications')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='identifications')
    species_name = models.TextField()
    confidence = models.FloatField(null=True, blank=True)
    proposed_at = models.DateTimeField(auto_now_add=True)

class IdentificationConfirmation(models.Model):
    confirmation_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    identification = models.ForeignKey(SpeciesIdentification, on_delete=models.CASCADE, related_name='confirmations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='confirmations')
    confirmed = models.BooleanField()
    confirmed_at = models.DateTimeField(auto_now_add=True)
