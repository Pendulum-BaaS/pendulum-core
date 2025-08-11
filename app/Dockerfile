FROM node:22-alpine

# set working dir in container
# "./" now refers to "/app" in the container
WORKDIR /app

# copy package files for installing dependencies
COPY package*.json ./

# install all dependencies
RUN npm install --only=production

COPY app/dist ./dist
COPY app/ui/ ./ui/

# documenting which port should be exposed
EXPOSE 3000

ENV NODE_ENV=production

RUN wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O /tmp/global-bundle.pem

CMD ["node", "./dist/src/server.js"]
