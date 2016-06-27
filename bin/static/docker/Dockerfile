FROM yaktor/yaktor:0.2

RUN echo 'PS1="\w\n\u@\h$ "' >> ~/.bash_profile
RUN echo '. ~/.profile' >> ~/.bash_profile

CMD ["tail -f /dev/null"]
