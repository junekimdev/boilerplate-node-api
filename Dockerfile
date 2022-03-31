# based on nodeJS v.16 alpine image
FROM node:16-alpine AS builder

LABEL maintainer="YOUR NAME" version="1.0"

WORKDIR /app

# Add package files
COPY package.json yarn.lock ./

# Install deps
RUN set -eux \
  && apk update \
  && apk add --no-cache --virtual .build-deps \
  yarn \
  && yarn install \
  && apk del .build-deps

ARG GIT_HASH

ENV NODE_ENV=production \
  BUILD_ID=${GIT_HASH}

# Add all files
COPY ./ ./

# Build
RUN yarn build

EXPOSE 3000

CMD yarn start
