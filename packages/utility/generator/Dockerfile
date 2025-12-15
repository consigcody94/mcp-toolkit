FROM apify/actor-node:20
COPY package*.json ./
RUN npm install --omit=dev
COPY . ./
RUN npm run build
CMD npm start
