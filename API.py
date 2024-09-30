from flask import Flask, render_template, request, redirect, url_for, make_response, jsonify
import sass

from werkzeug.utils import secure_filename

from services.Video import VideoAPI

from os import path, environ
import json

HOME_DIR = path.dirname(path.realpath(__file__))
UPLOAD_DIR = path.join(HOME_DIR, "uploads")

api_Video = VideoAPI()

api = Flask(__name__)
api.config['MAX_CONTENT_LENGTH'] = 512 * 1000 * 1000 # Maximum file size is 512MB
api.config["UPLOAD_FOLDER"] = UPLOAD_DIR

# SCSS Compilation to CSS at runtime.
sass.compile(dirname=(path.join(HOME_DIR, "static", "scss"), path.join(HOME_DIR, "static", "css")))

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

@api.route("/uploads/status", methods=["GET"])
def uploads_status():
    guid = request.headers.get("guid")
    if guid is None or guid == "":
        return make_response("Upload guid is missing.", 400)
    
    try:
        video = api_Video.videos__Retrieve(guid=guid)
    except:
        return make_response("Error retrieving video with provided guid", 500)

    responseData = {
        "status": video.get("status")
    }
    return jsonify(responseData)


@api.route("/videos/upload", methods=["GET"])
def videos_upload():
    return render_template("upload_new.html")

if __name__ == "__main__":
    api.run("127.0.0.1", 5000, True)
