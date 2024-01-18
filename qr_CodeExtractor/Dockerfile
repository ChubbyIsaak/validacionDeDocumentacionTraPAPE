# Use an official Python runtime as a parent image
FROM public.ecr.aws/lambda/python:3.8.2024.01.05.15

# Copy the function code and requirements file into the container
# Assuming LAMBDA_TASK_ROOT is /var/task, which is the default for AWS Lambda base images
COPY lambda_function.py  ${LAMBDA_TASK_ROOT}/
COPY requirements.txt ${LAMBDA_TASK_ROOT}/

# Set the working directory to LAMBDA_TASK_ROOT
WORKDIR ${LAMBDA_TASK_ROOT}

# Upgrade pip and install Python dependencies from requirements.txt
RUN pip install --upgrade pip &&\
    pip install --no-cache-dir -r requirements.txt

# Install zbar
RUN yum -y install https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm &&\
    sed -i "s/metalink=https/metalink=http/" /etc/yum.repos.d/epel.repo &&\
    yum makecache &&\
    yum -y install zbar

# The CMD instruction should specify the handler function
CMD [ "lambda_function.lambda_handler" ]
