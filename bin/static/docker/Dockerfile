FROM yaktor/yaktor:0.52

RUN echo 'PS1="\u@\h:\w$ "' >> ~/.bash_profile
RUN echo '. ~/.profile' >> ~/.bash_profile

CMD ["tail -f /dev/null"]
