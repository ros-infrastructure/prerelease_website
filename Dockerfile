FROM almalinux:8

RUN dnf -y install python2-pip python2-devel git
COPY requirements.txt /prerelease_website/requirements.txt
WORKDIR /prerelease_website
RUN pip2 --no-cache-dir install -r requirements.txt
COPY . /prerelease_website
ENTRYPOINT ["/prerelease_website/entrypoint.sh"]
EXPOSE 5000
