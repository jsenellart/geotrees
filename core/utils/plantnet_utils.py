import requests
import mimetypes
from typing import List, Tuple, IO
from django.conf import settings

def prepare_files(files_in: List[IO]) -> List[Tuple[str, Tuple[str, IO, str]]]:
    """
    Convert uploaded file-like objects into a format compatible with `requests`.
    Each file must have a .name attribute
    """
    files = []

    for file_obj in files_in:
        filename = getattr(file_obj, 'name', 'uploaded_file.jpg')
        mime_type, _ = mimetypes.guess_type(filename)

        if mime_type not in ['image/jpeg', 'image/png']:
            raise ValueError(f"Unsupported MIME type for file: {filename}")

        file_tuple = ('images', (filename, file_obj, mime_type))
        files.append(file_tuple)

    return files


def get_plantnet_response(images : List[IO],
                          organs_type : List[str] = [])-> requests.Response :
    """function used for getting the entire response of the
    query depending on the given image path"""
    return requests.post(settings.PLANTNET_API_URL,
            params=settings.PLANTNET_API_PARAMS,
            files=prepare_files(images),
            data={"organs" : organs_type})