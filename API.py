from flask import Flask, render_template, request, redirect, url_for, make_response, jsonify
from werkzeug.utils import secure_filename

from services.Video import VideoAPI

from os import path
import json

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

@api.route("/uploads/create", methods=["POST"])
def uploads_create():
    metadata = request.form.get("metadata")
    if metadata is None:
        return make_response("No metadata retrieved.", 400)
    try:
        metadata = json.loads(metadata)
    except json.JSONDecodeError:
        return make_response("Invalid JSON provided", 400)
    
    title = metadata.get("title")
    if title is None or title == "":
        return make_response("No title provided.", 400)
    if not isinstance(title, str):
        return make_response("Invalid data.", 400)
    if len(title) >= 120:
        return make_response("Title is too large!", 400)
        
    description = metadata.get("description")
    if description is None or description == "":
        metadata['description'] = "A video uploaded to OpenBroadcast."
        description = metadata["description"]
    if not isinstance(description, str):
        return make_response("Invalid data.", 400)
    if len(description) >= 800:
        return make_response("Description is too large!", 400)
    
    category = metadata.get("category", "misc")
    if category not in ["funny", "info", "misc"]:
        return make_response("Category does not exist. Video wouldn't appear in a feed so it has been rejected.", 400)
    
    videoID = api_Video.videos__GenerateID()

    thumbnail = request.files["thumbnail"]
    thumbnail_filename = secure_filename(f"{videoID}.png")
    thumbnail.save(path.join(api.config["UPLOAD_FOLDER"], thumbnail_filename))

    api_Video.videos__UploadThumbnail(thumbnail_filename)

    uploadData = api_Video.uploads__Create(videoID, metadata)
    if uploadData.get("signature") is None:
        return make_response("Error creating TUS signature", 400)

    responseData = {
        "signature": uploadData.get("signature"),
        "metadata": uploadData.get("metadata")
    }

    return jsonify(responseData)

@api.route("/uploads/capture", methods=["POST"])
def uploads_capture():
    id = request.headers.get("id")
    if id is None or id == "":
        return make_response("The header \"id\" is not set or was set incorrectly", 400)

    signatureHash = request.headers.get("signature")
    if signatureHash is None or signatureHash == "":
        return make_response("The header \"signatureHash\" is not set or was set incorrectly", 400)
    
    resCode = api_Video.uploads__Capture(id, signatureHash)
    if resCode != 200:
        return make_response("Upload capture failed. Video not registered.", resCode)
    return make_response("Success", 200)

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