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
$ pip install -U ros_buildfarm rosinstall_generator vcstools
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

TODO
