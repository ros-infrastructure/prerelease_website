import logging
import os
import shutil
import subprocess
import tempfile
import traceback

from catkin_pkg.packages import find_packages
from dajaxice.decorators import dajaxice_register
from django.utils import simplejson
import rospkg
import vcstools
import yaml

from models import DryRosDistro
from models import WetRosDistro

logger = logging.getLogger('submit_jobs')

BUILD_FARM_CONFIG_URL = 'https://raw.githubusercontent.com/ros-infrastructure/ros_buildfarm_config/production/index.yaml'


class temporary_directory(object):
    def __init__(self, prefix=''):
        self.prefix = prefix

    def __enter__(self):
        self.original_cwd = os.getcwd()
        self.temp_path = tempfile.mkdtemp(prefix=self.prefix)
        os.chdir(self.temp_path)
        return self.temp_path

    def __exit__(self, exc_type, exc_value, traceback):
        if self.temp_path and os.path.exists(self.temp_path):
            shutil.rmtree(self.temp_path)
        if self.original_cwd and os.path.exists(self.original_cwd):
            os.chdir(self.original_cwd)


@dajaxice_register
def get_repo_list_ajax(request, ros_distro):
    dry_distro = DryRosDistro(ros_distro)
    repo_list = dry_distro.get_info()
    logger.info("Got dry repo list")

    wet_distro = WetRosDistro(ros_distro)
    for name, d in wet_distro.get_info().iteritems():
        if name in repo_list:
            logger.info("%s is in both wet and dry rosdistro!!!!" % name)
        else:
            repo_list[name] = d
    logger.info("Got wet repo list")

    return simplejson.dumps({
        'repo_list': repo_list,
        'release_platforms': wet_distro.get_release_platforms(),
        'build_farm_config_url': BUILD_FARM_CONFIG_URL,
    })


def get_package_list_for_remote_repo(
    ros_distro, repo, version, vcs, url, branch
):
    with temporary_directory() as tmp_dir:
        pkgs_to_ignore = []
        if version == 'latest':
            # If "latest" in a release repository, use combined upstream branch
            branch = 'upstream'
        logger.info("Cloning '{0}' from '{1}' @ '{2}' with '{3}'...".format(
            repo, url, branch, vcs
        ))
        client = vcstools.get_vcs_client(vcs, tmp_dir)
        if not client.checkout(url, version=branch, shallow=True):
            raise RuntimeError(
                "Failed to checkout branch '{0}' from '{1}'"
                .format(branch, url)
            )
        # Find the packages in the repository
        pkg_names = [pkg.name for pth, pkg in find_packages(tmp_dir).items()]
        if version == 'latest':
            # Also consider ignored list
            client.update(version='master')
            if os.path.exists(ros_distro + '.ignored'):
                with open(ros_distro + '.ignored', 'r') as f:
                    pkgs_to_ignore = [l.strip() for l in f.read().split() if l]
        return [p for p in pkg_names if p not in pkgs_to_ignore]


@dajaxice_register
def get_package_list_for_remote_repo_ajax(
    request, ros_distro, repo, version, vcs, url, branch, repo_entry_number
):
    try:
        return simplejson.dumps({
            'package_names': get_package_list_for_remote_repo(
                ros_distro, repo, version, vcs, url, branch
            ),
            'repo': repo,
            'version': version,
            'repo_entry_number': repo_entry_number,
        })
    except Exception as exc:
        msg = "Error listing packages in remote repo '{0}': '{1}'".format(
            repo, exc
        )
        logger.error(msg)
        return simplejson.dumps({
            'status': 500,
            'message': msg,
            'traceback': traceback.format_exc(),
            'repo': repo,
            'version': version,
            'vcs': vcs,
            'url': url,
            'branch': branch,
            'repo_entry_number': repo_entry_number,
        })


@dajaxice_register
def get_rdepends_by_level_and_excludes_ajax(
    request, ros_distro, repo_list, level, excludes, args_hash
):
    generate_prerelease_overlay_script = \
        find_executable('generate_prerelease_overlay_script.py')
    if not generate_prerelease_overlay_script:
        msg = "Could not find 'generate_prerelease_overlay_script.py' script"
        logger.error(msg)
        return simplejson.dumps({
            'status': 500,
            'message': msg,
        })
    cmd = [generate_prerelease_overlay_script]
    cmd += [
        BUILD_FARM_CONFIG_URL,
        ros_distro,
        # The next three arguments don't really affect the output of this cmd.
        'ubuntu',
        'trusty',
        'amd64',
    ]
    cmd += ['--underlay-packages']
    for repo in repo_list.values():
        cmd.extend(repo['package_names'])
    cmd += ['--level', str(level)]
    print(excludes)
    if excludes:
        cmd += [
            '--exclude-pkg',
        ]
        cmd.extend(excludes)
    cmd += [
        '--json'
    ]
    logger.info("running command: {0}".format(cmd))
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate()
    logger.info("{0}".format(out))
    logger.info("{0}".format(err))
    if p.returncode != 0:
        return simplejson.dumps({
            'status': 500,
            'message': "'generate_prerelease_overlay_script.py' returned a non-zero exit code",
            'returncode': p.returncode,
            'out': out,
            'err': err,
        })
    result = {}
    result['rdepends'] = simplejson.loads(out)
    result['args_hash'] = args_hash
    return simplejson.dumps(result)


@dajaxice_register
def run_jobs_ajax(request, email, ros_distro, repo_list):
    logger.info("---")
    logger.info(email)
    logger.info(ros_distro)
    logger.info(repo_list)
    logger.info("---")

    if '_dry' in ros_distro:
        ros_distro = ros_distro.split("_")[0]

        conf_file = os.path.join(
            rospkg.get_ros_home(), 'buildfarm', 'server.yaml'
        )
        f = open(conf_file)
        info = yaml.load(f.read())

        script = find_executable('generate_groovy_prerelease.py')
        if not script:
            logger.error('Could not find generate_groovy_prerelease.py script')
            assert False
        command = '%s %s %s --repeat 0 --email %s --rosdistro %s' % (
            script, info['username'], info['password'], email, ros_distro
        )

        for r in repo_list:
            command += " --stack %s" % r

    elif '_wet' in ros_distro:
        ros_distro = ros_distro.split("_")[0]
        script = find_executable('generate_jenkins_prerelease')
        if not script:
            logger.error('Could not find generate_jenkins_prerelease script')
            assert False
        command = "%s %s %s %s" % (
            script, email, ros_distro,
            ' '.join(['%s %s' % (r, v) for r, v in repo_list.iteritems()])
        )

    else:
        assert False, 'Neither wet nor dry'

    logger.info("Executing command")
    logger.info(command)
    helper = subprocess.Popen(
        ['bash', '-c', command],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    res, err = helper.communicate()
    logger.info(str(res))
    logger.info(str(err))

    res = res.replace('<', '<a href="')
    res = res.replace('>', '">the Jenkins server</a>')
    res = res.replace('\n', '<br>')
    logger.info(str(res))

    success = 'true'
    if helper.returncode != 0:
        success = 'false'

    return simplejson.dumps({
        'success': success,
        'command': command,
        'std_out': res,
        'std_err': err
    })


def find_executable(file_name):
    for path in os.getenv('PATH').split(os.path.pathsep):
        file_path = os.path.join(path, file_name)
        if os.path.isfile(file_path) and os.access(file_path, os.X_OK):
            return file_path
    return None
