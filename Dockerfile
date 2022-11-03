# ------------ Server build ------------ #
FROM node:14-alpine

# Create app directory
WORKDIR /usr/src/app

# Set basic AWS credentials 
ENV AWS_ACCESS_KEY_ID XXID
ENV AWS_SECRET_ACCESS_KEY XXSECRET
ENV AWS_SESSION_TOKEN XXTOKEN

# Install server packages
COPY package*.json ./

RUN apk update && apk add ffmpeg
RUN npm install

# Build server
COPY . .

EXPOSE 3000

# Run the application
CMD ["node", "index"]
