FROM node:lts as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock ./

RUN yarn install --immutable

COPY . .

RUN yarn build

FROM node:lts-slim

ENV NODE_ENV production

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock ./

RUN yarn install --production --immutable

COPY --from=builder /usr/src/app/dist ./dist

CMD [ "node", "dist/main.js" ]