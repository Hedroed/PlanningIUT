FROM node:carbon

ENV TZ=Europe/Paris
RUN rm /etc/localtime && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY app/package*.json ./

RUN npm install --only=production

# Bundle app source
COPY app/ .

EXPOSE 3000
CMD [ "npm", "run", "server" ]
