from flask import (
    Flask, render_template, request, 
    make_response, jsonify, redirect, 
    abort, session, url_for
)

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

import requests
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
from pip._vendor import cachecontrol
import google.auth.transport.requests

import sass

from werkzeug.utils import secure_filename

from services.Video import VideoAPI

from os import path, environ
import json

HOME_DIR = path.dirname(path.realpath(__file__))
UPLOAD_DIR = path.join(HOME_DIR, "uploads")

sass.compile(
    dirname=(
        path.join(HOME_DIR, "static", "scss"),
        path.join(HOME_DIR, "static", "css")
    )
)


api_Video = VideoAPI()

api = Flask(__name__)
api.config['MAX_CONTENT_LENGTH'] = 64 * 1000 * 1000 # Maximum file size is 64MB
api.config["UPLOAD_FOLDER"] = UPLOAD_DIR

api_oauth_config_path = path.join(HOME_DIR, "client_secret.json")
api_oauth_config = json.loads(
    open(path.join(HOME_DIR, "client_secret.json")).read()
)
GOOGLE_OAUTH_CLIENT_ID = api_oauth_config.get("web").get("client_id")
api.secret_key = api_oauth_config.get("web").get("client_secret")

limiter = Limiter(
    app=api,
    key_func=get_remote_address,
    default_limits=["30 per 2 seconds"]
)

flow = Flow.from_client_secrets_file(
    client_secrets_file = api_oauth_config_path,
    scopes = ["https://www.googleapis.com/auth/userinfo.email", "openid"],
    redirect_uri = "https://openbroadcast.cz/authentication/callback"
)

def _force_https(app):
    def wrapper(environ, start_response):
        environ['wsgi.url_scheme'] = 'https'
        return app(environ, start_response)
    return wrapper

_force_https(api)

def authentication_required(function):
    def wrapper(*args, **kwargs):
        if 'google_id' not in session.keys():
            return abort(401)
        else:
            return function()
    return wrapper

@api.before_request
def before_request():
        # Don't recompile CSS while we're requesting static files.
        # JS/PNG/etc don't need CSS & CSS shouldn't be recompiled before requesting it.
        # Recompiling CSS before the request will sometimes break in a weird fucked up race condition.
        if api.debug and api.static_url_path not in request.path:
            print(f"Compiling SCSS -> CSS [For: {request.path}]")
            sass.compile(
                dirname=(
                    path.join(HOME_DIR, "static", "scss"),
                    path.join(HOME_DIR, "static", "css")
                )
            )

@api.errorhandler(401)
def error_401(e):
    '''Invalid Authentication'''
    error_data = {
        "name": "This page requires you to be logged in!",
        "message": 
            f"Sorry! This page is only for users who are logged in. \
            <a style='color:var(--accent-1)' href='/authentication/login'> \
            Login with Google \
            </a>"
    }
    response = make_response(render_template("pages/Error.html", error=error_data))
    response.status_code = 401
    
    return response

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

@api.route("/authentication/details", methods=['GET'], endpoint="authentication_details")
def authentication_details():
    '''
    Unauthenticated route to retrieve auth details. 
    Returns jsonify'd dict of `user_id` & `email`, values are null if unauthenticated.
    '''
    session_details = {
        "user_id": session.get('google_id'),
        "email": session.get("email")
    }
    return jsonify(session_details)

@api.route("/authentication/callback")
def authentication_callback():
    flow.fetch_token(authorization_response = request.url)

    if not session["state"] == request.args["state"]:
        abort(500)
    
    credentials = flow.credentials
    request_session = requests.session()
    cached_session = cachecontrol.CacheControl(request_session)
    token_request = google.auth.transport.requests.Request(session = cached_session)

    id_info = id_token.verify_oauth2_token(
        id_token = credentials.id_token,
        request = token_request,
        audience = GOOGLE_OAUTH_CLIENT_ID,
        clock_skew_in_seconds = 60
    )

    session["google_id"] = id_info.get("sub")
    session["email"] = id_info.get("email")
    session["id_token"] = credentials.id_token

    return redirect("/account")

@api.route("/login", endpoint="authentication_login")
@api.route("/authentication/login")
def authentication_login():
    authorization_url, state = flow.authorization_url(prompt="consent")
    session["state"] = state
    return redirect(authorization_url)

@api.route("/logout", endpoint="authentication_logout")
@api.route("/authentication/logout")
def authentication_logout():
    session.clear()
    return redirect("/")

@api.route("/account", endpoint="account")
@authentication_required
def account():
    return render_template("pages/Account.html", user = {
        "email": session['email'],
        "id": session['google_id']
    })

@api.route("/", methods=["GET", "POST"])
def index():
    return render_template("pages/Index.html")

@api.route("/status", methods=["GET"])
def status():
    return f"Alive"

@api.route("/videos/upload", methods=["GET"], endpoint="videos_upload")
@authentication_required
def videos_upload():
    return render_template("pages/Upload.html")

@api.route("/videos/upload/create", methods=["POST"], endpoint="video_uploads_create")
@limiter.limit("30 per day", key_func=lambda: session['google_id'])
def video_uploads_create():
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

@api.route("/videos/upload/status", methods=["GET"], endpoint="video_uploads_status")
@limiter.limit("2 per second", key_func=lambda: session['google_id'])
def video_uploads_status():
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
    debug = True
    if debug:
        environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1' # Useful for OAuth testing over HTTP
    api.run("127.0.0.1", 5000, debug)
