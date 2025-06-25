# Use official Node image
FROM node:18

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install

# Expose port (Render uses PORT env variable)
ENV PORT=5000
EXPOSE 5000

# Start the app
CMD ["npm", "start"]
