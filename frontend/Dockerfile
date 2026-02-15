FROM python:3.11-slim

WORKDIR /app

COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 8080

CMD ["./entrypoint.sh"]
