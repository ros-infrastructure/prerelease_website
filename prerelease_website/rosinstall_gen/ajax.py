from django.conf import settings
from dajaxice.decorators import dajaxice_register
from django.utils import simplejson
import datetime
import os
from prerelease_website.rosinstall_gen.views import get_rosinstall

import logging
logger = logging.getLogger('submit_jobs')


@dajaxice_register
def get_rosinstall_ajax(request, distro, packages, gen_type):
    logger.info("Got distro %s, packages %s, gen_type %s" % (distro, packages, gen_type))

    try:
        if gen_type == 'dry':
            logger.info("Calling dry")
            rosinstall = get_rosinstall(distro, packages, dry_only=True)
        elif gen_type == 'combined':
            rosinstall = get_rosinstall(distro, packages)
        else:
            logger.info("Calling wet")
            rosinstall = get_rosinstall(distro, packages, wet_only=True)
    except RuntimeError as e:
        return simplejson.dumps({'rosinstall_error': 'Error generating rosinstall file: {0}'.format(e)})

    timestr = datetime.datetime.now().strftime("%Y%m%d-%H%M%S%f")
    filename = '%s.rosinstall' % '_'.join(packages)
    relative_dir = os.path.join('rosinstalls', timestr)
    path = os.path.join(settings.MEDIA_ROOT, relative_dir, filename)
    logger.info("Writing rosinstall file to %s" % path)
    try:
        os.makedirs(os.path.realpath(os.path.dirname(path)))
    except:
        pass
    with open(path, 'w+') as f:
        f.write(rosinstall)

    return simplejson.dumps({'rosinstall_url': os.path.join(relative_dir,
                                                            filename)})
