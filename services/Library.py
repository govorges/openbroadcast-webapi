import requests
from os import environ
import json

class LibraryAPI:
    def __init__(self):
        API_Endpoint_Address = environ["LIBRARY_ENDPOINT_ADDRESS"]
        if "http" not in API_Endpoint_Address:
            self.API_Endpoint_URL = f"http://{API_Endpoint_Address}"

    def library__Register(self, google_id: str) -> dict | None:
        requestURL = f"{self.API_Endpoint_URL}/library/register"
        payload = { 
            "Accessor": google_id 
        }
        
        request = requests.post(requestURL, json=payload)
        object = request.json()

        return object
    
    def library__Details(self, google_id: str) -> dict | None:
        requestURL = f"{self.API_Endpoint_URL}/library/details"
        payload = { 
            "Accessor": google_id 
        }
        
        request = requests.get(requestURL, json=payload)
        object = request.json()

        return object
    
    def library__RetrieveCollections(self, google_id: str) -> dict | None:
        requestURL = f"{self.API_Endpoint_URL}/library/collections"
        payload = { 
            "Accessor": google_id 
        }
        
        request = requests.get(requestURL, json=payload)
        object = request.json()

        return object
    
    def library__RetrieveVideos(self, google_id: str) -> dict | None:
        requestURL = f"{self.API_Endpoint_URL}/library/videos"
        payload = { 
            "Accessor": google_id 
        }
        
        request = requests.get(requestURL, json=payload)
        object = request.json()

        return object

    def upload__Create(self, google_id: str, videoId: str) -> dict | None:
        requestURL = f"{self.API_Endpoint_URL}/library/upload/create"
        payload = {
            "Accessor": google_id,
            "videoId": videoId
        }

        request = requests.post(requestURL, json=payload)
        object = request.json()

        return object
    
    def video__Create(self, google_id: str, data: dict) -> dict | None:
        requestURL = f"{self.API_Endpoint_URL}/library/video/create"
        payload = {
            "Accessor": google_id,
            "video_data": data
        }

        request = requests.post(requestURL, json=payload)
        object = request.json()

        return object


