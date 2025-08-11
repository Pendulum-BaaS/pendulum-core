FROM node:22-alpine

# set working dir in container
# "./" now refers to "/app" in the container
WORKDIR /app

# copy package files for installing dependencies
COPY package*.json ./

RUN npm install --only=production

COPY events/dist ./dist

# documenting which port should be exposed
EXPOSE 8080

ENV NODE_ENV=production

RUN wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O /tmp/global-bundle.pem

CMD ["node", "./dist/src/server.js"]
