from flask import Flask, make_response, render_template, request

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

def error_404(e):
    '''Not Found'''
    error_data = {
        "name": "Page Not Found",
        "message": f"Sorry! The page you were looking for, <span class='markdown_Code'>{request.url}</span> does not exist."
    }
    response = make_response(render_template("pages/Error.html", error=error_data))
    response.status_code = 404
    
    return response

def error_429(e):
    '''Rate Limit Exceeded'''
    error_data = {
        "name": "Rate Limit Exceeded",
        "message": f"You've exceeded the rate limit for this page. Try again later."
    }
    response = make_response(render_template("pages/Error.html", error=error_data))
    response.status_code = 429
    
    return response

errorhandlers = {
    401: error_401,
    404: error_404,
    429: error_429
}

def apply_application_errorhandlers(application: Flask):
    """Registers all error handlers defined in applications/errors.py for the given application."""
    if application is None:
        return
    for key in errorhandlers.keys():
        application.register_error_handler(key, errorhandlers[key])

