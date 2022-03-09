FROM node:14
WORKDIR /srv/node-scripts/
ARG NPM_RUN_SCRIPT=start
ENV NPM_RUN_SCRIPT ${NPM_RUN_SCRIPT}

# Install mongo functionalities
RUN wget -qO - http://www.mongodb.org/static/pgp/server-4.2.asc | apt-key add - &&\
    echo "deb [ arch=amd64,arm64 ] http://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.2.list &&\
    apt-get update &&\
    apt-get install -y mongodb-org-tools

RUN npm i -g npm@6.4.1

# Bundle APP files
COPY package.json package.json
COPY package-lock.json package-lock.json

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn

# RUN if [ "$NPM_RUN_SCRIPT" = "start" ] ; then npm run ci ; else npm install -D; fi
RUN npm ci
COPY seeds ./seeds
COPY tsconfig.json tsconfig.json
COPY src ./src

RUN if [ "$NPM_RUN_SCRIPT" = "start" ] ; then npm run build ; fi 

# Expose the listening port of your app
EXPOSE 4444
CMD ["sh", "-c", "npm run ${NPM_RUN_SCRIPT}"]