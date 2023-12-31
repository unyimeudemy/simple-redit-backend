# FROM node:slim
# WORKDIR /redit-server
# COPY . /redit-server
# COPY package.json yarn.lock ./
# RUN yarn install
# EXPOSE 4000
# CMD [ "nodemon", "--exec", "ts-node", "src/index.ts" ]

FROM node:18.12.1
WORKDIR /redit-server
COPY . /redit-server
COPY package.json yarn.lock ./
RUN yarn install
RUN yarn add typeorm pg
COPY config.env ./config.env
COPY ormconfig.json ./ormconfig.json
RUN yarn build
EXPOSE 4000
CMD [ "node", "dist/index.js" ]



# FROM node:14

# # Create app directory
# WORKDIR /usr/src/app

# # Install app dependencies
# # A wildcard is used to ensure both package.json AND package-lock.json are copied
# # where available (npm@5+)
# COPY package.json ./
# COPY yarn.lock ./

# RUN yarn

# COPY . .
# COPY .env.production .env

# RUN yarn build

# ENV NODE_ENV production

# EXPOSE 8080
# CMD [ "node", "dist/index.js" ]
# USER node
