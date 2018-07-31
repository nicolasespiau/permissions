FROM node:9.3.0

WORKDIR /var/www/

ADD . /var/www/
RUN npm install

EXPOSE  80

CMD ["node","index.js"]
