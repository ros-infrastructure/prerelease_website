import json
import logging
import os
import shutil
import subprocess
import tempfile
import traceback

from catkin_pkg.packages import find_packages
import rospkg
from vcstool.commands.import_ import main as vcs_import_main
import yaml

from .models import DryRosDistro
from .models import WetRosDistro

logger = logging.getLogger('prerelease')

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


def get_repo_list_ajax(ros_distro):
    dry_distro = DryRosDistro(ros_distro)
    repo_list = dry_distro.get_info()
    logger.info("Got dry repo list")

    wet_distro = WetRosDistro(ros_distro)
    for name, d in wet_distro.get_info().items():
        if name in repo_list:
            logger.info("%s is in both wet and dry rosdistro!!!!" % name)
        else:
            repo_list[name] = d
    logger.info("Got wet repo list")

    return json.dumps({
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
        repos_file = os.path.join(tmp_dir, repo + '.repo')
        _write_repos_file(repos_file, repo, vcs, url, branch)
        rc = vcs_import_main(['--input', repos_file, '--shallow', tmp_dir])
        if rc:
            raise RuntimeError(
                "Failed to checkout branch '{0}' from '{1}'"
                .format(branch, url)
            )
        # Find the packages in the repository
        pkg_names = [pkg.name for pth, pkg in find_packages(tmp_dir).items()]
        if version == 'latest':
            # Also consider ignored list
            _write_repos_file(repos_file, repo, vcs, url, 'master')
            rc = vcs_import_main(['--input', repos_file, '--shallow', tmp_dir])
            if rc:
                raise RuntimeError(
                    "Failed to checkout branch 'master' from '{1}'"
                    .format(branch, url)
                )
            if os.path.exists(ros_distro + '.ignored'):
                with open(ros_distro + '.ignored', 'r') as f:
                    pkgs_to_ignore = [l.strip() for l in f.read().split() if l]
        return [p for p in pkg_names if p not in pkgs_to_ignore]


def _write_repos_file(path, repo, vcs, url, branch):
    with open(path, 'w') as h:
        h.write('repositories:\n')
        h.write('  %s:\n' % repo)
        h.write('    type: %s\n' % vcs)
        h.write('    url: %s\n' % url)
        h.write('    version: %s\n' % branch)


def get_package_list_for_remote_repo_ajax(
    request, ros_distro, repo, version, vcs, url, branch, repo_entry_number
):
    try:
        return json.dumps({
            'package_names': get_package_list_for_remote_repo(
                ros_distro, repo, version, vcs, url, branch
            ),
            'repo': repo,
            'version': version,
            'repo_entry_number': repo_entry_number,
        })
    except Exception as exc:
        import traceback
        traceback.print_exc()
        msg = "Error listing packages in remote repo '{0}': '{1}'".format(
            repo, exc
        )
        logger.error(msg)
        return json.dumps({
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


def get_rdepends_by_level_and_excludes_ajax(
    request, ros_distro, repo_list, level, excludes, args_hash
):
    generate_prerelease_overlay_script = \
        find_executable('generate_prerelease_overlay_script.py')
    if not generate_prerelease_overlay_script:
        msg = "Could not find 'generate_prerelease_overlay_script.py' script"
        logger.error(msg)
        return json.dumps({
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
        return json.dumps({
            'status': 500,
            'message': "'generate_prerelease_overlay_script.py' returned a non-zero exit code",
            'returncode': p.returncode,
            'out': out,
            'err': err,
        })
    result = {}
    result['rdepends'] = json.loads(out)
    result['args_hash'] = args_hash
    return json.dumps(result)


def find_executable(file_name):
    for path in os.getenv('PATH').split(os.path.pathsep):
        file_path = os.path.join(path, file_name)
        if os.path.isfile(file_path) and os.access(file_path, os.X_OK):
            return file_path
    return None
