from dajax.core import Dajax
from dajaxice.decorators import dajaxice_register
from django.utils import simplejson
import logging
import os
import subprocess
from models import WetRosDistro, DryRosDistro

logger = logging.getLogger('submit_jobs')


@dajaxice_register
def get_repo_list_ajax(request, ros_distro):
   dry_distro = DryRosDistro(ros_distro)
   repo_list = dry_distro.get_info()
   logger.info("Got dry repo list")

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

      f = open('/var/www/prerelease_website/jenkins.conf')
      info = f.read().split(',')

      script = find_executable('generate_groovy_prerelease.py')
      if not script:
         logger.error('Could not find generate_groovy_prerelease.py script')
         assert False
      command = '%s %s %s --repeat 0 --email %s --rosdistro %s'%(script, info[0], info[1], email, ros_distro)

      for r in repo_list:
         command += " --stack %s"%r

   elif '_wet' in ros_distro:
      ros_distro = ros_distro.split("_")[0]
      script = find_executable('generate_jenkins_prerelease')
      if not script:
         logger.error('Could not find generate_jenkins_prerelease script')
         assert False
      command = "%s %s %s %s"%(script, email, ros_distro, ' '.join(['%s %s'%(r, v) for r, v in repo_list.iteritems()]))

   else:
      assert False, 'Neither wet nor dry'


   logger.info("Executing command")
   logger.info(command)
   helper = subprocess.Popen(['bash', '-c', command], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
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

   return simplejson.dumps({'success': success, 'command': command, 'std_out': res, 'std_err': err})


def find_executable(file_name):
    for path in os.getenv('PATH').split(os.path.pathsep):
        file_path = os.path.join(path, file_name)
        if os.path.isfile(file_path) and os.access(file_path, os.X_OK):
            return file_path
    return None
