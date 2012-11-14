from dajax.core import Dajax
from dajaxice.decorators import dajaxice_register
from models import WetRosDistro
from django.utils import simplejson
import logging
import subprocess

logger = logging.getLogger('submit_jobs')

@dajaxice_register
def run_job_ajax(request, email, ros_distro, repositories):
   logger.info(repositories)
   logger.info("---")
   logger.info(email)
   logger.info(ros_distro)
   logger.info(repositories)
   logger.info("---")
   info = ['rosbuild', 'gopr2']

   if ros_distro in ['electric_dry', 'diamondback_dry']:
      command = 'export ROS_HOME=/tmp && export ROS_PACKAGE_PATH="/home/willow/ros_release:/opt/ros/cturtle/stacks" && export ROS_ROOT="/opt/ros/cturtle/ros" && export PATH="/opt/ros/cturtle/ros/bin:$PATH" && export PYTHONPATH="/opt/ros/cturtle/ros/core/roslib/src" && rosrun job_generation generate_prerelease.py %s %s --repeat 0 --email %s --rosdistro %s'%(info[0], info[1], email, ros_distro)

   elif ros_distro == 'fuerte_dry':
      command = 'generate_prerelease.py %s %s --repeat 0 --email %s --rosdistro %s'%(info[0], info[1], email, ros_distro)

   elif ros_distro == 'groovy_dry':
      command = 'generate_groovy_prerelease.py %s %s --repeat 0 --email %s --rosdistro %s'%(info[0], info[1], email, ros_distro)

   elif ros_distro == 'groovy_wet':
      command = "generate_jenkins_prerelease %s groovy %s"%(email, ' '.join(['%s %s'%(r['repo'], r['version']) for r in repositories]))

   logger.info(command)


   return simplejson.dumps({'success': 'true'})



@dajaxice_register
def get_version(request, id_num, distro, repo):
    wd = WetRosDistro(distro)
    out = []
    rel_info = wd.get_release_info(repo)
    devel_info = wd.get_devel_info(repo)
    description_output = []
    if rel_info:
        out.append('<option value="latest">Latest</option>')
        description_output.append('<div name="latest">Text for latest</div>')
        out.append('<option value="%s">%s</option>' % (wd.get_repo_version(repo), wd.get_repo_version(repo)))
        description_output.append('<div name="%s">Text for %s</div>'% (wd.get_repo_version(repo), wd.get_repo_version(repo)))
    if devel_info:
        out.append('<option value="devel">Devel</option>')
        description_output.append('<div name="devel">Text for devel</div>')

    return simplejson.dumps({'id': id_num,
                             'select_innerHTML': ''.join(out),
                             'descriptions': ''.join(description_output)})

