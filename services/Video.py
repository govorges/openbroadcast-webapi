import requests
from os import environ

class VideoAPI:
    def __init__(self):
        API_Endpoint_Address = "unset" # environ["VIDEO_ENDPOINT_ADDRESS"]
        if "http" not in API_Endpoint_Address:
            self.API_Endpoint_URL = f"http://{API_Endpoint_Address}"

    def uploads__Create(self, id: str, video_metadata: dict):
        requestURL = f"{self.API_Endpoint_URL}/uploads/create"
        headers = { "id": id }
        
        r = requests.post(requestURL, headers=headers, json=video_metadata)

        return r.json()

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








