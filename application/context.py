from flask import Flask, session

def apply_application_contextprocessors(application: Flask):
    """Applies all context processors defined in application/context.py"""
    for context_processor in context_processors:
        application.context_processor(context_processor)

def inject_user():
    return dict(user = {
        "email": session.get('email'),
        "id": session.get('google_id')
    })

context_processors = [inject_user]