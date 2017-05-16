Flask application for prerelease.ros.org
========================================

This is the web application which powers http://prerelease.ros.org/.

This project is licensed under the Apache 2.0 License.

Setup
-----

To run this website, you'll need to first setup a development environment.

This project requires Python 3.6, but uses `pyenv` to manage this, especially for machines that do not have Python 3.6.

pyenv
~~~~~

Install `pyenv` following some version of those instructions:

https://github.com/pyenv/pyenv#installation

Make sure you also have the `pyenv-virtualenv` plugin (note that the [pyenv-installer](https://github.com/pyenv/pyenv-installer) already installs this for you):

https://github.com/pyenv/pyenv-virtualenv#installation

Install Python 3.6.1:

```
pyenv install 3.6.1
```

pyenv virtualenv
~~~~~~~~~~~~~~~~

Next use `pyenv` to create a virtualenv.
See the usage of it, documented here:

https://github.com/pyenv/pyenv-virtualenv#usage

First, create a new virtualenv:

```
$ pyenv virtualenv 3.6.1 prerelease_website-3.6.1
```

Note that the pyenv plugin stores the virtualenv's in the `PYENV_ROOT`, which is probably `~/.pyenv`.
So give your virtualenv a unique name.

Then source your virtualenv in any terminal where you want to use the project:

```
$ pyenv activate prerelease_website-3.6.1
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
