FROM node:4

ENV PATH ./node_modules/.bin:$PATH
RUN apt-get update && \
     apt-get install -y openjdk-7-jre-headless
RUN apt-get install -y sudo
ARG UID
ARG USER
ARG VERSION
RUN useradd -ms /bin/bash ${USER:-docker} --uid ${UID:-1000}
RUN adduser ${USER:-docker} sudo
RUN echo "${USER:-docker} ALL=(ALL) NOPASSWD: ALL"  >> /etc/sudoers
RUN test ! -z "${VERSION}" && npm install -g yaktor@${VERSION} || echo "no version"
USER ${USER:-docker}

CMD ["bash"]