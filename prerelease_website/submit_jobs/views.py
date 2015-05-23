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


def run_job(request):
    data = request.POST

    i = 1
    repos = []
    while True:
        if 'repo_%d' % i in data and 'version_%d' % i in data:
            repos.append((data['repo_%d' % i], data['version_%d' % i]))
            i += 1
        else:
            break

    return render_to_response('run_job.html',
                              {'email': data['email'], 'ros_distro': data['ros_distro'],
                               'repos': repos},
                              context_instance=RequestContext(request))


def index(request):
    return render_to_response('index.html', {})


def generate_command(request, distro):
    return render_to_response(
        'generate_command.html',
        {'distro': distro},
        context_instance=RequestContext(request)
    )
