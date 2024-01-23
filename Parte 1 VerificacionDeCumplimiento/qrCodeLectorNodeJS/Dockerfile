# Use the AWS Lambda Node.js 20 base image
FROM public.ecr.aws/lambda/nodejs:20.2024.01.05.14

# Copy function code and package.json
COPY index.js package*.json ${LAMBDA_TASK_ROOT}/

# Install NPM dependencies
RUN npm install

# Set the CMD to your handler
CMD ["index.handler"]
