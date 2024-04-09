# Bulog - Web UI for application logs

Stream application logs into a central web-based UI.

## Features

- Send application logs to a web UI. Logs from different applications can be sent to different buckets for better organization in the UI.
- View individual logs with a JSON viewer.
- Search and filter logs with [liqe](https://github.com/gajus/liqe), a lucene-like query language.
- Add columns and configure them with a flexible JavaScript formatter.
- Combine data from multiple buckets into custom views.

## Installation

```
$ npm install -g bulog
```

## Quick start

First start the Bulog server

```
$ bulog
Bulog is running at http://localhost:3100
```

The web UI can now be accessed at `http://localhost:3100`.

The following command will forward output from `some-program` to the server

```
$ my-program | bulog my-program-logs
```

These logs can immediately be seen in the web UI's `my-program-logs` bucket.

## Usage

```
USAGE
  Start the Bulog server
  $ bulog [-h <host>] [-p <port>] [-m <memorySize>] [--tempConfig]

  Start a Bulog client and send logs from stdin to a bucket
  $ bulog [BUCKET] [-h <host>] [-p <port>] [-v <value>....] [-o]

ARGUMENTS
  BUCKET  Bucket name. Logs are separated by buckets in the Web UI.

SERVER FLAGS
  -m, --memorySize=<value>  Number of logs to keep in memory. Logs in memory are sent to clients when they connect.
  -h, --host=<host>         Server hostname to bind or connect to
  -p, --port=<port>         Server port to bind to
      --tempConfig          Use a temporary configuration that doesn't persist after the server is closed

CLIENT FLAGS
  -o, --pipeOutput        Echo logs in addition to sending them to Bulog
  -v, --value=<value>...  Value added to logs
  -h, --host=<host>       Server hostname to connect to
  -p, --port=<port>       Server port to connect to

DESCRIPTION
  Starts the Bulog server or sends logs to it

EXAMPLES
  Start the Bulog server on port 3000
    $ bulog -p 3000

  Send logs to Bulog running on port 3000
    $ echo "example" | bulog my-app -p 3000

  Send logs to Bulog with additional log fields
    $ echo "example" | bulog my-app -v name:MyApp1 group:MyApps
```
