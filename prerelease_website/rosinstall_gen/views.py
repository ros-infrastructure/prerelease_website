from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponseServerError
import yaml

from rosinstall_generator.generator import generate_rosinstall, sort_rosinstall

import logging
logger = logging.getLogger('submit_jobs')


# Create your views here.
def landing_page(request):
    return render_to_response('landing_page.html', {})


def dry_raw(request, distro, packages):
    try:
        rosinstall = get_rosinstall(distro, packages.split(','), dry_only=True)
    except RuntimeError as e:
        return HttpResponseServerError("Error generating rosinstall file: {0}".format(e))
    return render_to_response('rosinstall.html', {'rosinstall': rosinstall})


def dry_index(request, distro, packages):
    logger.info('Distro: %s' % distro)
    logger.info('Packages: %s' % packages.split(','))
    return render_to_response('index.html', {'distro': distro,
                                             'packages': packages.split(','),
                                             'gen_type': 'dry',
                                             },
                              context_instance=RequestContext(request))


def raw(request, distro, packages):
    try:
        rosinstall = get_rosinstall(distro, packages.split(','), wet_only=True)
    except RuntimeError as e:
        return HttpResponseServerError("Error generating rosinstall file: {0}".format(e))
    return render_to_response('rosinstall.html', {'rosinstall': rosinstall})


def index(request, distro, packages):
    logger.info('Distro: %s' % distro)
    logger.info('Packages: %s' % packages.split(','))
    return render_to_response('index.html', {'distro': distro,
                                             'packages': packages.split(','),
                                             'gen_type': 'wet'},
                              context_instance=RequestContext(request))


def combined_raw(request, distro, packages):
    try:
        rosinstall = get_rosinstall(distro, packages.split(','))
    except RuntimeError as e:
        return HttpResponseServerError("Error generating rosinstall file: {0}".format(e))
    return render_to_response('rosinstall.html', {'rosinstall': rosinstall})


def combined_index(request, distro, packages):
    logger.info('Distro: %s' % distro)
    logger.info('Packages: %s' % packages.split(','))
    return render_to_response('index.html', {'distro': distro,
                                             'packages': packages.split(','),
                                             'gen_type': 'combined'},
                              context_instance=RequestContext(request))


def get_rosinstall(distro_name, names, wet_only=False, dry_only=False):
    rosinstall_data = generate_rosinstall(distro_name, names, wet_only=wet_only, dry_only=dry_only, deps=True, tar=True)
    rosinstall_data = sort_rosinstall(rosinstall_data)
    return yaml.safe_dump(rosinstall_data, default_flow_style=False)
