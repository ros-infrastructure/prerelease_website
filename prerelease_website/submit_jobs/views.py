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
            if not repo_list.has_key(name):
                repo_list[name] = d
            else:
                for key, value in d.iteritems():
                    print "Key " + key
                    for v in value:
                        print "Value " + v
                        print "Previous " + str(repo_list[name][key])
                        repo_list[name][key].append(v)
        print "Got wet repo list"

    print repo_list



    return render_to_response('submit_job.html',
                              {'repo_list': repo_list, 'distro': distro},
                              context_instance=RequestContext(request))
