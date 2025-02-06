from flask import Flask
import datetime

def apply_application_template_filters(application: Flask):
    for _filter in filters:
        application.add_template_filter(_filter)


def toDate(timestamp):
    """Converts a POSIX timestamp to a formatted datetime string. """
    date_format = "%Y-%m-%d"
    time = datetime.datetime.fromtimestamp(timestamp)
    return datetime.datetime.strftime(time, date_format)

filters = [toDate]