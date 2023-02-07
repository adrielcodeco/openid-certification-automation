FROM adrielcodeco/node-lts-alpine.chromium:latest

WORKDIR /usr/src/openidtest

COPY package.json       .
COPY yarn.lock          .

RUN yarn install \
  --ignore-scripts \
  --ignore-engines \
  --frozen-lockfile \
  --network-timeout 10000000

COPY commands           commands
COPY config             config
COPY dto                dto
COPY lib                lib
COPY tests              tests
COPY cli.js             cli
COPY codecept.conf.js   codecept.conf.js
COPY custom_steps.js    custom_steps.js
COPY helper.js          helper.js
COPY test.js            test.js

RUN chmod +x cli

CMD ./cli run --all --np