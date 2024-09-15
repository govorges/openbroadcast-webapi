from flask import Flask, render_template, request, redirect, url_for, make_response
from werkzeug.utils import secure_filename

from services.Video import VideoAPI

from os import path
import json
import requests

HOME_DIR = path.dirname(path.realpath(__file__))
UPLOAD_DIR = path.join(HOME_DIR, "uploads")

api_Video = VideoAPI()

api = Flask(__name__)
api.config['MAX_CONTENT_LENGTH'] = 512 * 1000 * 1000 # Maximum file size is 512MB
api.config["UPLOAD_FOLDER"] = UPLOAD_DIR

ALLOWED_EXTENSIONS = ["mp4"]

def _allowedFile(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@api.route("/", methods=["GET", "POST"])
def index():
    return render_template("index.html")

@api.route("/status", methods=["GET"])
def status():
    return f"Alive"

@api.route("/videos/upload", methods=["GET", "POST"])
def videos_upload():
    if request.method == "GET":
        return render_template("upload.html")
    if "video" not in request.files:
        return make_response("No file uploaded.", 400)
    if "thumbnail" not in request.files:
        return make_response("No thumbnail uploaded", 400)
    
    video = request.files["video"]
    thumbnail = request.files["thumbnail"]

    if video.filename == "":
        return redirect(url_for('index'))
    
    if video and _allowedFile(video.filename):
        video_id = api_Video.videos__GenerateID()
        video_filename = secure_filename(f"{video_id}.mp4")
        video.save(path.join(api.config['UPLOAD_FOLDER'], video_filename))

        thumbnail_filename = secure_filename(f"{video_id}.png")
        thumbnail.save(path.join(api.config["UPLOAD_FOLDER"], thumbnail_filename))

        video_metadata = request.form.get("metadata")
        if video_metadata is None:
            return make_response("No video metadata retrieved.", 400)
        video_metadata = json.loads(video_metadata)
        
        
        video_metadata = {
            "title": video_metadata.get("title", f"{video_id}.mp4"),
            "description": video_metadata.get("description", "A video uploaded to OpenBroadcast"),
        }

        api_Video.videos__IngestVideo(
            id = f"{video_id}", 
            video_metadata = video_metadata
        )
        return make_response("Video ingested successfully.", 200)

if __name__ == "__main__":
    api.run("127.0.0.1", 5000, True)