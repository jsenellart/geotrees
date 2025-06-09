from django import forms
from django.core.exceptions import ValidationError

class MultiFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True

class MultiFileField(forms.FileField):
    widget = MultiFileInput

    def to_python(self, data):
        """
        data will be either:
         - a single UploadedFile
         - OR a list of UploadedFile if multiple
        We normalize to a list.
        """
        if not data:
            return []
        return data if isinstance(data, list) else [data]

    def validate(self, value):
        """ value is always a list here """
        super(forms.FileField, self).validate(value)
        if not value:
            raise ValidationError("No files were submitted.")

class ImageUploadForm(forms.Form):
    images = MultiFileField(required=True)
