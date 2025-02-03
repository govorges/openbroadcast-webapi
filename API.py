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
from services.Library import LibraryAPI

from os import path, environ
import json

import datetime

PULLZONE_HOSTNAME = environ['BUNNY_PULLZONE_HOSTNAME']

HOME_DIR = path.dirname(path.realpath(__file__))
UPLOAD_DIR = path.join(HOME_DIR, "uploads")

sass.compile(
    dirname=(
        path.join(HOME_DIR, "static", "scss"),
        path.join(HOME_DIR, "static", "css")
    )
)

api_Library = LibraryAPI()

api = Flask(__name__)
api.config['MAX_CONTENT_LENGTH'] = 64 * 1000 * 1000 # Maximum file size is 64MB
api.config["UPLOAD_FOLDER"] = UPLOAD_DIR

api_oauth_config_path = path.join(HOME_DIR, "storage", "secrets", "client_secret.json")
api_oauth_config = json.loads(
    open(api_oauth_config_path).read()
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

@api.context_processor
def inject_user():
    return dict(user = {
        "email": session.get('email'),
        "id": session.get('google_id')
    })

# If more filters are added, move to a Filters.py | api.add_template_filter() relevant
@api.template_filter('toDate')
def toDate(timestamp):
    """Converts a POSIX timestamp to a formatted datetime string. """
    date_format = "%Y-%m-%d"
    time = datetime.datetime.fromtimestamp(timestamp)
    return datetime.datetime.strftime(time, date_format)

@api.before_request
def before_request():
        # Don't recompile CSS while we're requesting static files.
        #       (otherwise the CSS breaks mid-request)
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

    try: # Temporary try/except while testing.
        api_Library.library__Register(
            google_id=session["google_id"]
        )
    except:
        pass

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
    userDetails = api_Library.library__Details(session.get("google_id"))
    return render_template("pages/Account.html", userDetails=userDetails)

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

@api.route("/about/", methods=["GET"])
def about():
    return render_template("pages/About.html")

@api.route("/reports/", methods=["GET"])
def reports():
    return render_template("pages/Reports.html")

@api.route("/browse/", methods=["GET"])
def browse():
    return render_template("pages/Browse.html")



@api.route("/library", methods=["GET"], endpoint='library')
@authentication_required
def library():
    return render_template("pages/Library.html")

@api.route("/library/collections", methods=["GET"], endpoint="library_Collections_GET")
@authentication_required
def library_Collections_GET():
    collections = api_Library.library__RetrieveCollections(
        google_id = session.get("google_id")
    )
    return jsonify(collections)

@api.route("/library/collections/add", methods=["POST"], endpoint="library_Collections_Add")
@authentication_required
def library_Collections_Add():
    collection_name = request.json.get("collection_name")
    creation_response = api_Library.library__AddCollection(
        google_id = session.get("google_id"),
        collection_name = collection_name
    )
    return jsonify(creation_response)

@api.route("/library/collections/delete", methods=['POST'], endpoint="library_Collections_Delete")
@authentication_required
def library_Collections_Delete():
    collection_guid = request.json.get("guid")
    creation_response = api_Library.library__DeleteCollection(
        google_id = session.get("google_id"),
        collection_guid = collection_guid
    )
    return jsonify(creation_response)

@api.route("/library/collections/update", methods=['POST'], endpoint="library_Collections_Update")
@authentication_required
def library_Collections_Update():
    collection_guid = request.json.get("guid")
    collection_name = request.json.get("name")

    creation_response = api_Library.library__UpdateCollection(
        google_id = session.get("google_id"),
        collection_guid = collection_guid,
        collection_name = collection_name
    )
    return jsonify(creation_response)


@api.route("/library/videos", methods=["GET"], endpoint="library_Videos_GET")
@authentication_required
def library_Videos_GET():
    videos = api_Library.library__RetrieveVideos(
        google_id = session.get("google_id")
    )
    for video in videos:
        video['thumbnail'] = f"https://{PULLZONE_HOSTNAME}/{video['guid']}/{video['thumbnailFileName']}"
    return jsonify(videos)

@api.route("/library/videos/create", methods=['POST'], endpoint="library_Videos_Create")
@authentication_required
def library_Videos_Create():
    filename = request.json.get("filename")
    collection = request.json.get("collection")

    creation_response = api_Library.video__Create(
        google_id = session.get("google_id"),
        data = {
            "title": filename,
            "collectionId": collection
        }
    )
    video_guid = creation_response.get("guid")
    signature = api_Library.upload__Create(
        google_id = session.get("google_id"),
        videoId = video_guid
    )

    return jsonify(signature)

@api.route("/library/video", methods=['GET'])
@authentication_required
def library_Video():
    video = request.headers.get("video")
    if video is None or video == "":
        return make_response("Invalid request", 400)
    
    video = api_Library.video__Retrieve(
        google_id = session.get("google_id"),
        videoId = video
    )
    return jsonify(video)

@api.route("/library/advertising/update", methods=['POST'], endpoint="library_Advertising_Update")
@authentication_required
def library_Advertising_Update():
    payload = request.json
    allowed_update_keys = ["VastTagUrl"]
    
    update = api_Library.library__Update(
        google_id = session.get("google_id"),
        payload = payload
    )
    return jsonify(update)
    
@api.route("/library/details", methods=['GET'], endpoint="library_Details_GET")
@authentication_required
def library_Details_GET():
    details = api_Library.library__Details(
        google_id = session.get("google_id")
    )
    return jsonify(details)


if __name__ == "__main__":
    debug = True
    if debug:
        environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1' # Useful for OAuth testing over HTTP
    api.run("127.0.0.1", 5000, debug)
