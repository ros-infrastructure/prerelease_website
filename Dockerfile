FROM python:3.11-alpine

COPY requirements.txt /prerelease_website/requirements.txt
WORKDIR /prerelease_website
RUN pip  --no-cache-dir install -r requirements.txt
COPY . /prerelease_website
ENTRYPOINT ["/prerelease_website/entrypoint.sh"]
EXPOSE 5000
