FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
# Install using lockfile for reproducibility
RUN npm ci --silent || npm install --silent

# Copy source
COPY . ./

ENV NODE_ENV=production

EXPOSE 5000 5001

CMD ["node", "app.js"]
