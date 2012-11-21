from django.conf.urls.defaults import patterns, include, url
from django.views.generic.simple import redirect_to

urlpatterns = patterns('prerelease_website.submit_jobs.views',
    url(r'^select_distro', 'select_distro'),
    url(r'^create_job/(?P<distro>.*)', 'create_job'),
    url(r'^run_job', 'run_job'),
    url(r'^$', redirect_to, {'url': 'select_distro'}),
)
