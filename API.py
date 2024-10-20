from flask import Flask, render_template, request, make_response, jsonify, redirect

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

import sass

from werkzeug.utils import secure_filename

from services.Video import VideoAPI

from os import path, environ
import json

HOME_DIR = path.dirname(path.realpath(__file__))
UPLOAD_DIR = path.join(HOME_DIR, "uploads")
sass.compile(dirname=(path.join(HOME_DIR, "static", "scss"), path.join(HOME_DIR, "static", "css")))

api_Video = VideoAPI()

api = Flask(__name__)
api.config['MAX_CONTENT_LENGTH'] = 512 * 1000 * 1000 # Maximum file size is 512MB
api.config["UPLOAD_FOLDER"] = UPLOAD_DIR

limiter = Limiter(
    app=api,
    key_func=get_remote_address,
    default_limits=["12 per second"]
)

@api.before_request
def before_request():
    if api.debug:
        sass.compile(dirname=(path.join(HOME_DIR, "static", "scss"), path.join(HOME_DIR, "static", "css")))

@api.errorhandler(404)
def error_404(e):
    '''Not Found'''
    error_data = {
        "name": "Page Not Found",
        "message": f"Sorry! The page you were looking for, <span class='markdown_Code'>{request.url}</span> does not exist."
    }
    response = make_response(render_template("pages/Error.html", error=error_data))
    response.status_code = 404
    
    return response

@api.errorhandler(429)
def error_429(e):
    '''Rate Limit Exceeded'''
    error_data = {
        "name": "Rate Limit Exceeded",
        "message": f"You've exceeded the rate limit for this page. Try again later."
    }
    response = make_response(render_template("pages/Error.html", error=error_data))
    response.status_code = 429
    
    return response



@api.route("/", methods=["GET", "POST"])
def index():
    return render_template("pages/Index.html")

@api.route("/status", methods=["GET"])
def status():
    return f"Alive"

@api.route("/videos/upload", methods=["GET"])
def videos_upload():
    return render_template("pages/Upload.html")

@api.route("/videos/upload/create", methods=["POST"])
@limiter.limit("30 per day")
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

@api.route("/videos/upload/status", methods=["GET"])
@limiter.limit("2 per second")
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


@api.route("/about/", methods=["GET"])
def about():
    return render_template("pages/About.html")

@api.route("/reports/", methods=["GET"])
def reports():
    return render_template("pages/Reports.html")

@api.route("/browse/", methods=["GET"])
def browse():
    return render_template("pages/Browse.html")

if __name__ == "__main__":
    api.run("127.0.0.1", 5000, True)
