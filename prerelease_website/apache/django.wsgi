import os

os.environ['DJANGO_SETTINGS_MODULE'] = 'prerelease_website.settings'
os.environ['PATH'] = '/var/www/prerelease_website/venv/bin%s%s' % (os.path.pathsep, os.getenv('PATH'))
os.environ['ROS_HOME'] = '/var/www/prerelease_website'

import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()
