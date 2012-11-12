from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('submit_jobs.views',
    url(r'^submit_job/(?P<distro>.*)', 'submit_job'),
    url(r'^submit_job', 'index'),
)
