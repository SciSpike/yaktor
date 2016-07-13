FROM alpine:3.4
RUN set -x \
  && apk add --no-cache \
    openssh \
    dhcp

   

RUN ssh-keygen -f /etc/ssh/ssh_host_rsa_key -N '' -t rsa

RUN sed -i "s/UsePrivilegeSeparation.*/UsePrivilegeSeparation no/g" /etc/ssh/sshd_config && sed -i "s/UsePAM.*/UsePAM no/g" /etc/ssh/sshd_config && sed -i "s/PermitRootLogin.*/PermitRootLogin yes/g" /etc/ssh/sshd_config && sed -i "s/#AuthorizedKeysFile/AuthorizedKeysFile/g" /etc/ssh/sshd_config
RUN echo PermitRootLogin without-password >> /etc/ssh/sshd_config
RUN echo PermitTunnel yes >> /etc/ssh/sshd_config
RUN mkdir ~/.ssh 

CMD ["/usr/sbin/sshd","-D"]