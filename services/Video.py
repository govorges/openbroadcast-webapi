import requests
from os import environ

class VideoAPI:
    def __init__(self):
        API_Endpoint_Address = environ["VIDEO_ENDPOINT_ADDRESS"]
        if "http" not in API_Endpoint_Address:
            self.API_Endpoint_URL = f"http://{API_Endpoint_Address}"

    def videos__IngestVideo(self, id: str, video_metadata: dict):
        requestURL = f"{self.API_Endpoint_URL}/videos/ingest"
        headers = { "id": id }
        
        r = requests.post(requestURL, headers=headers, json=video_metadata)

        return r

    def videos__GenerateID(self):
        requestURL = f"{self.API_Endpoint_URL}/videos/generate_id"

        response_data = requests.get(requestURL).json()
        id = response_data.get("id")

        return id










