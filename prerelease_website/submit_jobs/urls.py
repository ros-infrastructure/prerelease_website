from django.conf.urls import patterns, url
# from django.views.generic import RedirectView

urlpatterns = patterns(
    'prerelease_website.submit_jobs.views',
    url(r'^$', 'index'),
    url(r'^select_distro', 'select_distro'),
    url(r'^create_job/(?P<distro>.*)', 'create_job'),
    url(r'^(?P<distro>.+)', 'generate_command'),
    url(r'^run_job', 'run_job'),
)
