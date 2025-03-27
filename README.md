# Model for Monitoring Microservices Integration in the Presentation Layer
_A Master Degree thesis_

## Setup

In order to run the project you should have **docker** and **docker compose** installed on your machine.

If you meet these requirements, in the root directory please run the following
```
docker compose up
``` 

Since the project had been setup using the **infrastructure as a code** approach, the whole monitoring environment shall initialize and configure

## Running

The docker-compose process had spin up the following applications:

### 1. Grafana <br />
Available at `localhost:3000` - using the default Grafana credentials `admin:admin`

### 2. Single SPA React <br />
An application written in React with a structure of a single application. Used mainly for comparing with micro-frontend approach. <br />
Available at `localhost:4000` - by accessing the website you should already gather some data that can be visualized in Grafana