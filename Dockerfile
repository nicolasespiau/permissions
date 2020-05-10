FROM node:14.2.0

WORKDIR /var/www/

ADD . /var/www/
RUN npm install

EXPOSE  80

CMD ["node","index.js"]
