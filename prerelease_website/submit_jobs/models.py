import yaml
import urllib2
import logging
from rosdistro import get_index, get_index_url, get_source_file, get_release_file
from rosdistro.manifest_provider import get_release_tag
import rospkg.distro
#from django.db import models

logger = logging.getLogger('submit_jobs')


class DryRosDistro(object):
    def __init__(self, distro):
        self.distro = distro
        self.distro_obj = rospkg.distro.load_distro(rospkg.distro.distro_uri(distro))

    def get_info(self):
        res = {}
        for name, s in self.distro_obj.stacks.iteritems():
            if s.vcs_config.type == 'svn':
                url = s.vcs_config.anon_dev
                branch = ""
            else:
                url = s.vcs_config.repo_uri
                branch = s.vcs_config.dev_branch
            res[name] = {'distro': self.distro + "_dry",
                         'version': ["devel"],
                         'url': [url],
                         'branch': [branch]}
        return res


#We're essentially using GitHub as a backend since the distro files are hosted there
class WetRosDistro(object):
    def __init__(self, distro):
        self.distro = distro

        try:
            index = get_index(get_index_url())
            self._release_file = get_release_file(index, distro)
            self._source_file = get_source_file(index, distro)
        except:
            logger.error("Could not load rosdistro release or test file")
            self._release_file = None
            self._source_file = None

    def get_info(self):
        res = {}
        for name in self._release_file.repositories.keys() + self._source_file.repositories.keys():
            res[name] = {'distro': self.distro + "_wet", 'version': [], 'url': [], 'branch': []}

        # first add devel
        for name, r in self._source_file.repositories.iteritems():
            if not r.version:
                res[name]['branch'].append("")
            else:
                res[name]['branch'].append(r.version)
            res[name]['version'].append('devel')
            res[name]['url'].append(r.url)

        # then add release
        for name, r in self._release_file.repositories.iteritems():
            if 'release' not in r.tags:
                continue
            release_tag = get_release_tag(r, '{package}')
            if r.version is not None:
                release_tag_without_version = release_tag.replace('/%s' % r.version, '').replace('/%s' % r.version.split('-')[0], '')
            else:
                release_tag_without_version = release_tag.replace('/{version}', '').replace('/{upstream_version}', '')
            res[name]['version'].append('latest')
            res[name]['url'].append(r.url)
            res[name]['branch'].append(release_tag_without_version)

            if r.version:
                res[name]['version'].append(r.version.split('-')[0])
                res[name]['url'].append(r.url)
                res[name]['branch'].append(release_tag)
                #res[name]['branch'].append("release/pkg_name/" + r.version.split('-')[0])
        return res

    def get_repos(self):
        if self._release_file is None or self._source_file is None:
            return []
        return list(set(self._release_file.repositories.keys() + self._source_file.repositories.keys()))

    def is_released(self, repo_name):
        if self._release_file is None:
            return False
        return repo_name in self._release_file.repositories

    def get_release_info(self, repo_name):
        if self._release_file is None:
            return None
        return self._release_file.repositories[repo_name]

    def is_devel(self, repo_name):
        if self._source_file is None:
            return False
        return repo_name in self._source_file.repositories

    def get_devel_info(self, repo_name):
        if self._source_file is None:
            return None
        return self._source_file.repositories[repo_name]

    def get_repo_version(self, repo_name):
        if repo_name not in self._release_file.repositories:
            logger.error("Repo %s not in distro file for %s" % (repo_name, self.distro))
            return None

        #Since debian information is tacked onto the version #, we split
        return self._release_file.repositories[repo_name]['version'].split('-')[0]


#We're essentially using GitHub as a backend since the distro files are hosted there
class WetRosFuerte(object):

    def __init__(self):
        self.distro = 'fuerte'
        url = 'https://raw.github.com/ros/rosdistro/master/releases/%s.yaml' % self.distro
        devel_url = 'https://raw.github.com/ros/rosdistro/master/releases/%s-devel.yaml' % self.distro

        try:
            self.distro_file = yaml.load(urllib2.urlopen(url))
            self.devel_file = yaml.load(urllib2.urlopen(devel_url))
        except:
            logger.error("Could not load rosdistro file or devel file")
            self.distro_file = None
            self.devel_file = None

    def get_info(self):
        res = {}
        for name in self.devel_file['repositories'].keys() + self.distro_file['repositories'].keys():
            res[name] = {'distro': self.distro + "_wet", 'version': [], 'url': [], 'branch': []}

        # first add devel
        for name, r in self.devel_file['repositories'].iteritems():
            if not 'version' in r or not r['version']:
                res[name]['branch'].append("")
            else:
                res[name]['branch'].append(r['version'])
            res[name]['version'].append('devel')
            res[name]['url'].append(r['url'])

        # then add release
        for name, r in self.distro_file['repositories'].iteritems():
            res[name]['version'].append('latest')
            res[name]['url'].append(r['url'])
            res[name]['branch'].append("release/pkg_name")

            if r['version']:
                res[name]['version'].append(r['version'].split('-')[0])
                res[name]['url'].append(r['url'])
                res[name]['branch'].append("release/pkg_name/" + r['version'].split('-')[0])
        return res

    def get_repos(self):
        if self.distro_file is None or self.devel_file is None:
            return []
        return list(set(self.distro_file['repositories'].keys() + self.devel_file['repositories'].keys()))

    def is_released(self, repo_name):
        if self.distro_file is None:
            return False
        return repo_name in self.distro_file['repositories']

    def get_release_info(self, repo_name):
        if self.distro_file is None:
            return None
        return self.distro_file['repositories'].get(repo_name, None)

    def is_devel(self, repo_name):
        if self.devel_file is None:
            return False
        return repo_name in self.devel_file['repositories']

    def get_devel_info(self, repo_name):
        if self.devel_file is None:
            return None
        return self.devel_file['repositories'].get(repo_name, None)

    def get_repo_version(self, repo_name):
        if repo_name not in self.distro_file['repositories']:
            logger.error("Repo %s not in distro file for %s" % (repo_name, self.distro))
            return None

        #Since debian information is tacked onto the version #, we split
        return self.distro_file['repositories'][repo_name]['version'].split('-')[0]
