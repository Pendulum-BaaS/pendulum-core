FROM node:22-alpine

# set working dir in container
# "./" now refers to "/app" in the container
WORKDIR /app

# copy package files for installing dependencies
COPY package*.json ./

# install all dependencies
RUN npm ci

COPY src/ ./src/
COPY tsconfig.json ./

# compile ts to js
RUN npm run build

# remove dev dependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# create non-root user for security
# RUN addgroup -g 1001 -S nodejs && \
# 	adduser -S nodejs -u 1001

# RUN chown -R nodejs:nodejs /app

# USER nodejs

# documenting which port should be exposed
EXPOSE 3000

ENV NODE_ENV=production

RUN wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O /tmp/global-bundle.pem

CMD ["node", "./dist/src/server.js"]
