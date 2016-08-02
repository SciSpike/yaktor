FROM yaktor/base:0.34.1

RUN echo 'PS1="\u@\h:\w$ "' >> ~/.bash_profile
RUN echo '. ~/.profile' >> ~/.bash_profile

CMD ["tail -f /dev/null"]
