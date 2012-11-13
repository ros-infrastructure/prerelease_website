from dajax.core import Dajax
from dajaxice.decorators import dajaxice_register
from models import WetRosDistro
from django.utils import simplejson
import logging
logger = logging.getLogger('submit_jobs')

@dajaxice_register
def submit_job(request, repositories):
   logger.info(repositories)
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

