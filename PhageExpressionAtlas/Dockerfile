# syntax=docker/dockerfile:1

FROM python:3.11-alpine

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install --upgrade pip
RUN pip3 install -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

EXPOSE 5001
CMD ["gunicorn","--workers", "4","--timeout","600","--graceful-timeout", "300", "--bind", "0.0.0.0:5001","app:app"]