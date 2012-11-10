import yaml
import urllib2
import logging
#from django.db import models

logger = logging.getLogger('submit_jobs')

#We're essentially using GitHub as a backend since the distro files are hosted there
class WetRosDistro(object):
    def __init__(self, distro):
        self.distro = distro
        url = 'https://raw.github.com/ros/rosdistro/master/releases/%s.yaml' % distro

        try:
            self.distro_file = yaml.load(urllib2.urlopen(url))
        except:
            logger.error("Could not load rosdistro file")
            self.distro_file = None

    def refresh(self):
        try:
            self.distro_file = yaml.load(urllib2.urlopen(url))
        except:
            logger.error("Could not load rosdistro file")
            self.distro_file = None

    def get_repos(self):
        if self.distro_file is None:
            return []
        return self.distro_file['repositories'].keys()

    def get_repo_version(self, repo_name):
        if repo_name not in self.distro_file['repositories']:
            logger.error("Repo %s not in distro file for %s" % (repo_name, self.distro))
            return None

        #Since debian information is tacked onto the version #, we split
        return self.distro_file['repositories'][repo_name]['version'].split('-')[0]
