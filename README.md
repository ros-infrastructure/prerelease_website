Flask application for prerelease.ros.org
========================================

This is the web application which powers http://prerelease.ros.org/.

This project is licensed under the Apache 2.0 License.

Setup
-----

To run this website, you'll need to first setup a development environment.

This project requires Python 2.6 (as that is what is on our old web server).

virtualenv
~~~~~~~~~~

Next use `virtualenv` to create a virtualenv:

```
$ python -m virutalenv venv
```

Dependencies
~~~~~~~~~~~~

Install the web framework dependencies:

```
$ pip install -U Flask
```

Install the domain (ROS) specific dependencies:

```
$ pip install -U ros_buildfarm rosinstall_generator vcstool
```

Running Locally
---------------

If you are developing on this project or otherwise want to run it locally, just invoke Flask:

```
$ PYTHONPATH=`pwd` FLASK_DEBUG=1 FLASK_APP=prerelease_website flask run
```

The `PYTHONPATH` assumes you're in the root of this repository, and makes the application importable.
The `FLASK_DEBUG` option provides tracebacks in the web pages when something goes wrong.
`FLASK_APP` is how you tell Flask what module to import for your application.

Setup with Apache
-----------------

We are using these apache configurations on prerelease.ros.org:

```xml
<VirtualHost *:80>
  ServerName prerelease.ros.org
  ServerAlias prerelease.ros.osuosl.org

  DocumentRoot /var/www/prerelease_website/

  <Directory /var/www/prerelease_website/prerelease_website>
    Order allow,deny
    Allow from all
  </Directory>

  <Directory /var/www/prerelease_website/prerelease_website/static>
    Order allow,deny
    Allow from all
  </Directory>

  WSGIDaemonProcess prerelease.ros.org-flask-server processes=2 threads=15 display-name=%{GROUP}
  WSGIProcessGroup prerelease.ros.org-flask-server

  WSGIScriptAlias / /var/www/prerelease_website/prerelease_website/apache/flask.wsgi

  LogFormat "%h %l %u %t %D \"%r\" %>s %b \"%{Referer}i\" \"%{User-agent}i\"" simple
  CustomLog "|/usr/sbin/rotatelogs /var/log/httpd/prerelease.ros.org/access/%Y%m%d.log 86400" simple
  ErrorLog "|/usr/sbin/rotatelogs /var/log/httpd/prerelease.ros.org/error/%Y%m%d.log 86400"
</VirtualHost>
```

And as you can see it is using the `flask.wsgi` file in this repository, which assumes the repository is placed at `/var/www/prerelease_website` and that the virtualenv is in that folder and called `venv`.
