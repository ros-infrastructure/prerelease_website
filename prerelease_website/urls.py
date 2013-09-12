from django.conf import settings
from django.conf.urls.defaults import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from dajaxice.core import dajaxice_autodiscover, dajaxice_config
dajaxice_autodiscover()

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^rosinstall/', include('prerelease_website.rosinstall_gen.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
    url(dajaxice_config.dajaxice_url, include('dajaxice.urls')),

    url(r'^', include('prerelease_website.submit_jobs.urls')),
)

urlpatterns += staticfiles_urlpatterns()
urlpatterns += patterns('',
                        (r'^media/(?P<path>.*)$',
                         'django.views.static.serve', {
                             'document_root': settings.MEDIA_ROOT}))
