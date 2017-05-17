import logging
import os
import sys

logging.basicConfig()

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, os.path.join(this_dir, '..', '..'))

os.environ['PYTHON_EGG_CACHE'] = os.path.join(this_dir, '..', '..', 'python_egg_cache')

site_root = '/var/www/prerelease_website'

activate_this = os.path.join(site_root, 'venv', 'bin', 'activate_this.py')
execfile(activate_this, dict(__file__=activate_this))

os.environ['ROS_HOME'] = site_root

from prerelease_website import app as application
