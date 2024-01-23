FROM public.ecr.aws/lambda/nodejs:20.2024.01.05.14

# Set the working directory to the Lambda task root
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy function code and package.json
COPY index.js package*.json ${LAMBDA_TASK_ROOT}/

# Install any additional dependencies
RUN npm install --production

# Set the CMD to your handler
CMD [ "index.handler" ]
