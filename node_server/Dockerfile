FROM node:10.16-slim

RUN \
    mkdir /src && \
    mkdir /src/middleware

COPY ./package.json /src/

RUN \
    cd /src && \
    npm install

# RUN npm install -g nodemon

# COPY ./* /src/
COPY ./ /src/

# RUN \
#     mv /src/check-auth.js /src/middleware/

CMD node /src/server.js
# CMD nodemon /src/server.js
# CMD tail -f /dev/null