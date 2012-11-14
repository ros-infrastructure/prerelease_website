from dajax.core import Dajax
from dajaxice.decorators import dajaxice_register
from models import WetRosDistro
from django.utils import simplejson
import logging
import subprocess
from models import WetRosDistro, DryRosDistro


logger = logging.getLogger('submit_jobs')



@dajaxice_register
def get_repo_list_ajax(request, ros_distro):
   dry_distro = DryRosDistro(ros_distro)
   repo_list = dry_distro.get_info()
   logger.info("Got dry repo list")

   if ros_distro == 'groovy':
       wet_distro = WetRosDistro(ros_distro)
       for name, d in wet_distro.get_info().iteritems():
           if repo_list.has_key(name):
               logger.info("%s is in both wet and dry rosdistro!!!!"%name)
           else:
              repo_list[name] = d
       logger.info("Got wet repo list")

   return simplejson.dumps({'repo_list': repo_list})




@dajaxice_register
def run_jobs_ajax(request, email, ros_distro, repo_list):
   logger.info("---")
   logger.info(email)
   logger.info(ros_distro)
   logger.info(repo_list)
   logger.info("---")

   if '_dry' in ros_distro:
      ros_distro = ros_distro.split("_")[0]

      f = open('/var/www/hds.xml')
      info = f.read().split(',')

      if ros_distro in ['electric', 'diamondback']:
         command = 'export ROS_HOME=/tmp && export ROS_PACKAGE_PATH="/home/willow/ros_release:/opt/ros/cturtle/stacks" && export ROS_ROOT="/opt/ros/cturtle/ros" && export PATH="/opt/ros/cturtle/ros/bin:$PATH" && export PYTHONPATH="/opt/ros/cturtle/ros/core/roslib/src" && rosrun job_generation generate_prerelease.py %s %s --repeat 0 --email %s --rosdistro %s'%(info[0], info[1], email, ros_distro)

      elif ros_distro == 'fuerte':
         command = 'generate_prerelease.py %s %s --repeat 0 --email %s --rosdistro %s'%(info[0], info[1], email, ros_distro)

      elif ros_distro == 'groovy':
         command = 'generate_groovy_prerelease.py %s %s --repeat 0 --email %s --rosdistro %s'%(info[0], info[1], email, ros_distro)

      for r in repo_list:
         command += " --stack %s"%r

   elif '_wet' in ros_distro:
      ros_distro = ros_distro.split("_")[0]
      if ros_distro == 'groovy':
         command = "generate_jenkins_prerelease %s groovy %s"%(email, ' '.join(['%s %s'%(r, v) for r, v in repo_list.iteritems()]))


   logger.info("Executing command")
   logger.info(command)
   helper = subprocess.Popen(['bash', '-c', command], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
   res, err = helper.communicate()
   logger.info(str(res))
   logger.info(str(err))

   success = 'true'
   if helper.returncode != 0:
      success = 'false'

   return simplejson.dumps({'success': success, 'command': command, 'std_out': res, 'std_err': err})




