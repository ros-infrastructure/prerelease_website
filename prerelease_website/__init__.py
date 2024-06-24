import json

from flask import Flask
from flask import request
from flask import render_template

from .ajax import get_package_list_for_remote_repo_ajax
from .ajax import get_rdepends_by_level_and_excludes_ajax
from .ajax import get_repo_list_ajax
from .ajax import check_distro_ajax

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/<distro>')
def distro(distro):
    if check_distro_ajax(distro):
        return render_template('generate_command.html', distro=distro)
    else:
        return render_template('404.html', distro=distro), 404


@app.route('/get_repo_list/<distro>')
def get_repo_list(distro):
    return get_repo_list_ajax(distro)


@app.route('/get_package_list_for_remote_repo', methods=['POST'])
def get_package_list_for_remote_repo():
    return get_package_list_for_remote_repo_ajax(
        request,
        request.form['ros_distro'],
        request.form['repo'],
        request.form['version'],
        request.form['vcs'],
        request.form['url'],
        request.form['branch'],
        request.form['repo_entry_number'])


@app.route('/get_rdepends_by_level_and_excludes', methods=['POST'])
def get_rdepends_by_level_and_excludes():
    return get_rdepends_by_level_and_excludes_ajax(
        request,
        request.form['ros_distro'],
        json.loads(request.form['repo_list']),
        request.form['level'],
        json.loads(request.form['excludes']),
        request.form['args_hash'])
