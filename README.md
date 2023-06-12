# Boilerplate-node-api

Boilerplate codes to build Restful API in NodeJS

---

## Table of Contents

1. [Getting Started](#getting-started)
1. [Tech Stack](#tech-stack)
1. [Packages Used](#packages-used)
1. [S/W Architecture](#sw-architecture)
1. [Examples](#examples)
1. [Code Generation](#code-generation)
1. [What's Next?](#whats-next)
1. [Authors](#authors)
1. [License](#license)

---

## Getting Started

### Prerequisite

Install latest Node.js LTS
<https://nodejs.org/en/download/package-manager/>

- Debian

```shell
sudo apt update
sudo apt install nodejs
nodejs -v
```

- Windows

```shell
choco install nodejs-lts
node --version
```

Install PostgreSQL DB

- Debian

```shell
sudo apt install postgresql
```

- Windows

```shell
choco install postgresql
```

### Installation

#### Clone the repo and install dependencies

```shell
# git clone will create a directory named myAppName
# if the directory is already created, then use .(dot) instead of myAppName
git clone https://github.com/junekimdev/boilerplate-node-api.git <myAppName>
cd myAppName
yarn
```

#### Make sure to remove `.git` directory to start afresh

```shell
# remove .git directory beforehand
git init
git add .
git commit -m "Initial commit"
git branch -M master
git remote add origin <myGitRepo>
git push -u origin master
```

#### Add a file `.env` that includes environmental variables

Example:

```conf
#NODE_ENV=production
SERVICE_NAME=myservice
PORT=3000
CORS_ORIGIN=http://localhost:3000
#TRUST_PROXY=172.17.0.0/16

# DB
PGHOST=localhost
PGUSER=myservice
PGDATABASE=myservicedb
PGPASSWORD=securepassword
PGPORT=5432
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONN_TIMEOUT=2000

# JWT
JWT_PRI_FILENAME=es256_prv.pem
JWT_PUB_FILENAME=es256_pub.pem
JWT_ISS=jrn;;;auth;https://mycompany.com/auth

#VAPID
VAPID_SUBJECT=mailto:user@mycompany.com # this should be url or mailto
#VAPID_PUB_KEY=
#VAPID_PRI_KEY=
```

#### Initiate your PostgreSQL DB

Modify `init.sql` file to your liking except some SQLs between `REQUIRED`

```shell
psql -f init.sql
```

## Tech Stack

- Backend language: Typescript(Javascript)
- API documentation standard: openapi 3.0.3
- Database: PostgreSQL
- Access control: Basic Authorization & Bearer Authorization ([RFC 7235](https://datatracker.ietf.org/doc/html/rfc7235))
- Basic authorization scheme: email(which is username) and password as in [RFC 7617](https://datatracker.ietf.org/doc/html/rfc7617)
- Bearer authorization scheme: JWT as in [RFC 6750](https://datatracker.ietf.org/doc/html/rfc6750)
- Token signing algorithm: ES256, which is ECDSA using P-256 and SHA256
- Public & private key format: PEM
- Password hash algorithm and encoding: SHA256 with Base64 encoding
- WebAPIs: Push API

## Packages Used

- JS engine: node.js
- API engine: express.js
- Body-parse middleware: express.js built-ins
- header middleware: helmet.js
- CORS middleware: cors
- Logging middleware: pino.js
- DBMS (for PostgreSQL): pg
- Environmental variable loader: dotenv
- Access-token (for JWT): jsonwebtoken
- Push-notification: web-push
- Unit Test: jest
- Integration Test: jest & supertest

## S/W Architecture

### Directory Structure

```text
root/
├── package.json
├── .env
├── project_files
├── public/
│   └── static_files
├── doc/
|   ├── openapi.yaml
│   └── document_files
├── keys/
│   └── key_files
├── src/
│   ├── server.ts
│   ├── errorHandler.ts
│   ├── api/
│   │   ├── index.ts
│   │   └── v1.ts
│   ├── middleware/
│   │   ├── basicAuth.ts
│   │   ├── bearerAuth.ts
│   │   ├── data_validator_files
│   │   └── access_control_files
│   ├── services/
│   │   └── eachService/
│   │       ├── index.ts
│   │       ├── apiHandler.ts
│   │       ├── provider.ts
│   │       └── types.ts
│   └── utils/
│       ├── errors.ts
│       └── utility_files
└── test/
    ├── test.config
    ├── initTest.ts
    ├── testData.sql
    ├── unit/
    │   ├── eachService/
    │   │   ├── handler.test.ts
    │   │   └── provider.test.ts
    │   └── unit_test_files
    ├── integration/
    │   └── integration_test_files
    └── coverage/
        └── test_coverage_report_files
```

### Explanation of the Architecture

1. `/public` serves static files
1. `/doc` serves documents for the project
1. `/doc/openapi.yaml`is API document according to OpenAPI 3.x Spec
1. `/src` serves source codes of the API server
1. `/src/server.ts` is the entry file for the server
   - This sets up all middlewares
   - This has the central error handler
1. `/src/api/index.ts` selects API version and provides root router
1. `/src/api/v1.ts` provides routing logic in the said version
   - This connects API paths to services
1. `/src/middleware/basicAuth.ts`is the basic authorization middleware
   - This sets `userId` and `email` in `req.locals`
1. `/src/middleware/bearerAuth.ts`is the bearer authorization middleware
   - This sets decoded `accessToken` in `req.locals`
1. `/services` holds services, which processes business logic
1. `/services/eachService` should have descriptive names that clearly says what it does
   - Recommended format: `verb + noun`
   - CRUD verbs are great
1. `/services/eachService/index.ts` decouples inside from outside
1. `/services/eachService/apiHandler.ts` handles requests
   - This MUST do:
     - extracts data out of request `body`/`param`/`query`
     - extracts data out of request `locals` passed by middleware
     - validates data
     - calls provider to process the data
     - decides which HTTP status will send (REST API)
     - decides which error to throw
     - try-catch all internal errors and pass them to the central error handler
1. `/services/eachService/provider.ts` provides the core of service by processing business logic
   - This MAY do:
     - interacts with DB or network to process data
     - executes another file to process data such as python files, golang files, etc.
1. `/services/eachService/types.ts` provides definitions of type that need for the service
   - This MAY have: `IReqBody`,`IReqParam`,`IReqQuery`,`IReqLocals`,`IResBody`, etc.
1. `/src/utils` holds utility files that are used across the project
1. `/src/utils/errors.ts` defines:
   - `class AppError` that extends `Error` class
   - `errDef` object that holds pre-defined error descriptions ordered by status number
   - `code` property in `errDef` object
     - is Error-Identification-Code that you maintain within your organization
     - can be used for analytics and for informing client

## Examples

### Database

- [Database ER Diagram](./doc/database_ER_diagrams.md)
- [Beginning SQLs](./example.sql)

### User Types

- [User Description](./doc/example_user_description.md)

### Resource Name Schema

- [JuneKim Resource Name Schema](./doc/JuneKim%20Resource%20Name%20Schema.md)

## Code Generation

### Adding a New Service

```shell
node codegen.js -name=servicename
```

This will create files according to the architecture explained above

### Adding a New Public/Private Key Pair

```shell
node keygen-es256.js -name=keyname
```

This will create a ES256 key pair to be used

### Generating a New VAPID key Pair

```shell
# Required web-push installed
node keygen-vapid.js
```

This will append a VAPID key pair in `.env` file

## What's Next?

- Add **Redis** as a cache layer to implement cache-first fetching strategy
- Add **node-cron** as a scheduler to execute timed tasks

## Authors

- **June Kim** - _Initial work_ - [Github](https://github.com/junekimdev)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
