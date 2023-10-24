FROM node:16-alpine AS build
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json .
COPY yarn.lock .
COPY tsconfig.build.json .
COPY tsconfig.json .

RUN yarn install --immutable

RUN yarn build

FROM node:16-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

COPY package.json .
COPY yarn.lock .

RUN yarn install --immutable

# Copy production build
COPY --from=build /app/dist/ ./dist/

# Expose application port
EXPOSE 3000

# Start application
CMD [ "node", "dist/main.js" ]
