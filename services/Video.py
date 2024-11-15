import requests
from os import environ
import json

class VideoAPI:
    def __init__(self):
        API_Endpoint_Address = environ["VIDEO_ENDPOINT_ADDRESS"]
        if "http" not in API_Endpoint_Address:
            self.API_Endpoint_URL = f"http://{API_Endpoint_Address}"

    def uploads__Create(self, id: str, video_metadata: dict) -> dict | None:
        requestURL = f"{self.API_Endpoint_URL}/uploads/create"
        headers = { 
            "id": id 
        }
        
        request = requests.post(requestURL, headers=headers, json=video_metadata)
        object = request.json().get("object")

        return object

    def videos__GenerateID(self):
        requestURL = f"{self.API_Endpoint_URL}/videos/generate_id"

        response_data = requests.get(requestURL).json()
        id = response_data.get("id") # 12 char alphanumeric string

        return id

    def videos__UploadThumbnail(self, filename: str):
        requestURL = f"{self.API_Endpoint_URL}/videos/thumbnail-upload"
        headers = { 
            "target-file-path": f"/thumbnails/{filename}",
            "local-file-path": f"/home/app/uploads/{filename}"
        }
        
        r = requests.post(requestURL, headers=headers)

        return r
    
    def videos__Retrieve(self, guid: str):
        requestURL = f"{self.API_Endpoint_URL}/videos/retrieve"
        requestHeaders = {
            "guid": guid,
        }
        r = requests.get(requestURL, headers=requestHeaders)
        return r.json()








