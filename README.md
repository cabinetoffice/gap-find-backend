
## GAP Find Backend

This is the backend service for Find a Grant. It's built on the [Nest](https://github.com/nestjs/nest) starter repository with Typescript.

## Set up

### Database Setup with Docker
- Install Colima using the instructions here: [GitHub - abiosoft/colima: Container runtimes on macOS (and Linux) with minimal setup](https://github.com/abiosoft/colima)
- You’ll also need Docker command line so make sure to read that part of the Colima instructions
- run `colima start`
- run `docker pull postgres`
- run `docker run -itd -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 --name postgres-local postgres`
- NOTE: to start this container AFTER the first time you run this command, just use `docker start postgres-local`
  Install PGAdmin either through docker or directly onto your system then connect to the instance of Postgres you’ve just started:
    - host: `localhost` or `127.0.0.1` (or `host.docker.internal` if you also run PGAdmin with docker)
    - port: `5432`
    - username: `postgres`
    - password: `mysecretpassword`

### Database Setup without Docker
- Install postgres and pgadmin
- run `brew services start postgresql`
- open pgadmin and create a database called `postgres` (this may have been created already)
- in your `.env` (you may need to reach out to another member of the team to get one) create this line:
    - `DATABASE_URL=postgresql://localhost:5432/postgres`

## Running the app

1. Install dependencies as above
2. Set up the database as above
3. Run the DB migration script: `yarn run typeorm migration:run`
4. Run one of the following commands:
```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# debug mode
$ yarn run start:debug

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Nest Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## License

Nest is [MIT licensed](LICENSE).

## TypeORM Migrations

create migration file:
`npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate -n <NAME>`

run migrations:
`npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run`
