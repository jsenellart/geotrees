from django import forms

class ImageUploadForm(forms.Form):
    image = forms.ImageField(label="Upload a plant image")
    organs = forms.ChoiceField(
        choices=[
            ('leaf', 'Leaf'),
            ('flower', 'Flower'),
            ('fruit', 'Fruit'),
            ('bark', 'Bark'),
        ],
        required=False
    )
