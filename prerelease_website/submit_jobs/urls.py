from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('submit_jobs.views',
    url(r'^select_job', 'index'),
    url(r'^submit_job/(?P<distro>.*)', 'submit_job'),
)
