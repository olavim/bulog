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
$ some-program | bulog logs
```

These logs can immediately be seen in the web UI's `logs` bucket.

## Usage

```
USAGE
  $ bulog [-p <port>] [-h <host>]
  $ bulog [BUCKET] [-p <port>] [-h <host>] [-v <value>....] [-o]

ARGUMENTS
  BUCKET  Bucket name. Logs are separated by buckets in the Web UI.

FLAGS
  -h, --host=<host>       [default: 0.0.0.0] Server hostname to bind or connect to
  -o, --pipeOutput        Echo logs in addition to sending them to Bulog server
  -p, --port=<port>       [default: 3100] Server port to bind or connect to
  -v, --value=<value>...  Value added to logs

DESCRIPTION
  Starts the Bulog server or sends logs to it

EXAMPLES
  Start the Bulog server at port 3000

    $ bulog -p 3000

  Send logs to Bulog running at port 3000

    $ echo "example" | bulog my-app -p 3000

  Send logs to Bulog with additional log fields

    $ echo "example" | bulog my-app -v name:MyApp1 group:MyApps
```