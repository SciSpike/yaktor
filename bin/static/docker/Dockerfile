# TODO: FROM yaktor:${VERSION} -- this will get rid of lines 4-10
FROM node:4

# essential invariants
ENV PATH ./node_modules/.bin:$PATH
RUN apt-get update && \
     apt-get install -y openjdk-7-jre-headless
RUN apt-get install -y sudo
ARG VERSION
RUN test ! -z "${VERSION}" && npm install -g yaktor@${VERSION} || echo "no version"

# app & user specifics
ARG UID
ARG USER
RUN useradd -ms /bin/bash ${USER:-docker} --uid ${UID:-1000}
RUN adduser ${USER:-docker} sudo
RUN echo "${USER:-docker} ALL=(ALL) NOPASSWD: ALL"  >> /etc/sudoers
USER ${USER:-docker}

COPY .setup.sh /.setup.sh
CMD ["/.setup.sh"]
