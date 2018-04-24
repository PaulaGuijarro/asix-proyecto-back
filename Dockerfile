# Versión de la máquina node de docker
FROM node:9.11.1-alpine
# Create a new user to our new container and avoid the root user
RUN addgroup -S nodeadmin && adduser -S -g nodeadmin nodeadmin
ENV HOME=/home/nodeadmin
COPY package.json package-lock.json $HOME/app/
COPY src/ $HOME/app/src
COPY .env $HOME/app
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.1/dumb-init_1.2.1_amd64 /usr/local/bin/dumb-init
WORKDIR $HOME/app
RUN chown -R nodeadmin:nodeadmin $HOME/* /usr/local/
RUN chmod +x /usr/local/bin/dumb-init
RUN npm cache verify
RUN npm install --silent --progress=false
RUN npm install nodemon -g
USER nodeadmin
EXPOSE 3000
CMD ["dumb-init","npm", "start"]