# Use an AWS Lambda base image for Node.js
FROM public.ecr.aws/lambda/nodejs:20.2024.01.05.14

# Define the working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy package.json and package-lock.json
COPY index.js package*.json ${LAMBDA_TASK_ROOT}/

# Install NPM dependencies
RUN npm install --production

# Copy the application code
COPY . .

# Set the CMD to your handler
CMD ["index.handler"]
