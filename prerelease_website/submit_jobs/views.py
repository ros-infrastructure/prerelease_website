from django.shortcuts import render_to_response
from django.template import RequestContext

import logging

logger = logging.getLogger('submit_jobs')

def select_distro(request):
    return render_to_response('select_distro.html', {})


def create_job(request, distro):
    return render_to_response('create_job.html',
                              {'distro': distro},
                              context_instance=RequestContext(request))


def run_job(request, email, distro, repo_list):
    return render_to_response('run_job.html',
                              {'email': email, 'ros_distro': distro,
                               'repo_list': repo_list},
                              context_instance=RequestContext(request))

