# Use the official Node.js image as a base
FROM node:18

# Set the working directory
WORKDIR /usr/src/app


# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies including mysql2
RUN npm install --prefix ./

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3001

# Command to run the application
CMD ["node", "./index.js"]  # Change this to point to index.js
