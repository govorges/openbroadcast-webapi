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







