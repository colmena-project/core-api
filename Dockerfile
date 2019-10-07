FROM node:lts
WORKDIR /srv/node-scripts/
# Bundle APP files
COPY package.json .
# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install
# Expose the listening port of your app
EXPOSE ${PORT}

CMD [ "npm", "run", "start" ]