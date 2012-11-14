import os
import sys
 
path = '/var/www/prerelease_website'
if path not in sys.path:
    sys.path.insert(0, path)
 
os.environ['DJANGO_SETTINGS_MODULE'] = 'prerelease_website.settings'
 
import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()
