from dajax.core import Dajax
from dajaxice.decorators import dajaxice_register
from models import WetRosDistro
from django.utils import simplejson

@dajaxice_register
def get_version(request, id_num, distro, option):
    wd = WetRosDistro(distro)
    #dajax = Dajax()
    out = []
    out.append('<option value="%s">%s</option>' % (wd.get_repo_version(option), wd.get_repo_version(option)))
    #dajax.assign('#version_%s' % id_num, 'innerHTML', ''.join(out))
    return simplejson.dumps({'id': id_num, 'select_innerHTML': ''.join(out)})
    #return dajax.json()

