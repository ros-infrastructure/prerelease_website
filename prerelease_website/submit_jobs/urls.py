from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('prerelease_website.submit_jobs.views',
    url(r'^select_distro', 'select_distro'),
    url(r'^create_job/(?P<distro>.*)', 'create_job'),
)
