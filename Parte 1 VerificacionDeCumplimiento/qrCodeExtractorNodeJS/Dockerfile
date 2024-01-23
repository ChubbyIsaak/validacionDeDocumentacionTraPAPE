# Use the AWS Lambda Node.js 20 base image
FROM public.ecr.aws/lambda/nodejs:20.2024.01.05.14

# Set the working directory to the Lambda task root
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy package.json and package-lock.json (if available)
COPY package*.json index.js ./

# Install NPM dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set the CMD to your handler
CMD [ "index.handler" ]
