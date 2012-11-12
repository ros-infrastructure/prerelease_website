from django.shortcuts import render_to_response
from models import WetRosDistro
from django.template import RequestContext

import logging

logger = logging.getLogger('submit_jobs')

def index(request):
    return render_to_response('index.html', {})

def submit_job(request, distro):
    wd = WetRosDistro(distro)
    repo_list = wd.get_repos()
    repo_list.sort()
    return render_to_response('submit_job.html', 
                              {'repo_list': repo_list, 'distro': distro},
                              context_instance=RequestContext(request))
