## To run database:
docker run -d \
  --name postgres-nagai \
  -e POSTGRES_DB=nagai \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:latest


  # To clear the database
  mvn flyway:clean