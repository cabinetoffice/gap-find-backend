FROM node:16-alpine AS build
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json .
COPY yarn.lock .
COPY tsconfig.build.json .
COPY tsconfig.json .
COPY ormconfig.json .

RUN yarn install
RUN yarn build

FROM node:16-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN yarn install

# Copy production build
COPY --from=build /app/package*.json /app/
COPY --from=build /app/yarn.lock /app/
COPY --from=build /app/dist/ /app/dist/
COPY --from=build /app/tsconfig.build.json/ /app/tsconfig.build.json/
COPY --from=build /app/tsconfig.json/ /app/tsconfig.json/
COPY --from=build /app/ormconfig.json/ /app/ormconfig.json/

# Expose application port
EXPOSE 3000
# Start application
CMD [ "yarn" , "start" ]