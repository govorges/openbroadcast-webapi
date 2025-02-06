from os import environ
from flask import Flask

from . import errors, context, filters

def force_application_https(app):
    def wrapper(environ, start_response):
        environ['wsgi.url_scheme'] = 'https'
        return app(environ, start_response)
    return wrapper

def build_application_context(application: Flask):
    """Function to construct and apply template filters, context processors, error handlers, etc to a WSGI application"""
    errors.apply_application_errorhandlers(application = application)
    context.apply_application_contextprocessors(application = application)
    filters.apply_application_template_filters(application = application)