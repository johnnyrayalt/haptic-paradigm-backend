FROM node:12

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json /usr/src/app/
COPY .env .
RUN npm install

# Bundle app source
COPY . . 
RUN npm run build

EXPOSE 8000
CMD [ "npm", "start" ]
