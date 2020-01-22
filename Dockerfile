FROM centos:7

# RUN apt-get update && apt-get install -y python-flask python-rosinstall-generator python-vcstools python-ros-buildfarm
RUN yum -y update 
RUN yum -y install python3-pip && yum clean all
RUN pip3 install -U Flask ros_buildfarm rosinstall_generator vcstools

COPY . /app

WORKDIR /app

# Set the locale Click will complain otherwise
ENV LANG en_US.UTF-8  
ENV LANGUAGE en_US:en  
ENV LC_ALL en_US.UTF-8 

CMD PYTHONPATH=/app FLASK_DEBUG=1 FLASK_APP=prerelease_website python3 -m flask run