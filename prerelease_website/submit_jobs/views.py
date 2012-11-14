from django.shortcuts import render_to_response
from models import WetRosDistro, DryRosDistro
from django.template import RequestContext

import logging

logger = logging.getLogger('create_jobs')

def select_distro(request):
    return render_to_response('select_distro.html', {})


def create_job(request, distro):
    dry_distro = DryRosDistro(distro)
    repo_list = dry_distro.get_info()
    logger.info("Got dry repo list")

    if distro == 'groovy':
        wet_distro = WetRosDistro(distro)
        for name, d in wet_distro.get_info().iteritems():
            if repo_list.has_key(name):
                logger.error("%s is in both wet and dry rosdistro!!!!"%name)
            repo_list[name] = d
        logger.info("Got wet repo list")

    return render_to_response('create_job.html',
                              {'repo_list': repo_list, 'distro': distro},
                              context_instance=RequestContext(request))


