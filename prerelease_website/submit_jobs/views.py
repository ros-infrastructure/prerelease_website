from django.shortcuts import render_to_response
from models import WetRosDistro, DryRosDistro
from django.template import RequestContext

import logging

logger = logging.getLogger('submit_jobs')

def index(request):
    return render_to_response('index.html', {})

def submit_job(request, distro):
    dry_distro = DryRosDistro(distro)
    repo_list = dry_distro.get_info()
    print "Got dry repo list"

    if distro == 'groovy':
        wet_distro = WetRosDistro(distro)
        for name, d in wet_distro.get_info().iteritems():
            if repo_list.has_key(name):
                print "%s is in both wet and dry rosdistro!!!!"%name
            repo_list[name] = d
        print "Got wet repo list"

    return render_to_response('submit_job.html',
                              {'repo_list': repo_list, 'distro': distro},
                              context_instance=RequestContext(request))
