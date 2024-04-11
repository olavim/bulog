# Bulog - Web UI for application logs

Stream application logs into a central web-based UI.

## Features

- Send application logs to a web UI. Logs from different applications can be sent to different buckets for better organization in the UI.
- View individual logs with a JSON viewer.
- Search and filter logs with [liqe](https://github.com/gajus/liqe), a lucene-like query language.
- Add columns and configure them with a flexible JavaScript formatter.
- Combine data from multiple buckets into filtered views.
- Configurable from command line and from the web UI.
- Import and export settings.

## Installation

```
$ npm install -g bulog
```

## Quick start

First start the Bulog server

```
$ bulog start
Bulog is running at http://localhost:3100
```

The web UI can now be accessed at `http://localhost:3100`.

The following command will forward output from `tail` to the server

```
$ tail -f logs.txt | bulog fw my-logs
```

These logs can immediately be seen in the web UI's `my-logs` bucket.

## Usage

### Start a Bulog instance

```
$ bulog start
```

```
USAGE
  $ bulog start [-p <value>] [-h <value>] [-i <value>] [-m <value>] [--tempConfig]

FLAGS
  -h, --host=<host>         Server hostname to bind or connect to
  -i, --instance=<name>     [default: default] Server instance name to use. Instances have separate configurations.
  -m, --memorySize=<value>  Number of logs to keep in memory. Logs in memory are sent to clients when they connect.
  -p, --port=<port>         Server port to bind to
      --tempConfig          Use a temporary configuration that doesn't persist after the server is closed

DESCRIPTION
  Starts the Bulog server

EXAMPLES
  Start an instance
    $ bulog start

  Start an instance on port 3000
    $ bulog start -p 3000

  Start an instance with the name "my-instance" on port 7000
    $ bulog start -p 7000 -i my-instance
```

### Forward logs from stdin to a Bulog instance

```
$ bulog forward BUCKET
or
$ bulog fw BUCKET
```

```
USAGE
  $ bulog fw BUCKET [-i <value> | -h <value> | -p <value>] [-v <value>] [-o]

ARGUMENTS
  BUCKET  Bucket name. Logs are separated by buckets in the Web UI.

FLAGS
  -h, --host=<host>       [default: 127.0.0.1] Server hostname to connect to
  -i, --instance=<id>     [default: default] Server instance to connect to
  -o, --pipeOutput        Echo logs in addition to sending them to Bulog
  -p, --port=<port>       [default: 3100] Server port to connect to
  -v, --value=<value>...  Value added to logs

DESCRIPTION
  Forwards logs from stdin to a Bulog instance

ALIASES
  $ bulog fw

EXAMPLES
  Send logs to bucket "my-app"
    $ tail -f logs.txt | bulog fw my-app

  Send logs to a Bulog instance running at 127.0.0.1:3000
    $ tail -f logs.txt | bulog fw my-app -p 3000

  Send logs to a Bulog instance running at myhost:3000
    $ tail -f logs.txt | bulog fw my-app -h myhost -p 3000

  Send logs with additional log fields
    $ tail -f logs.txt | bulog fw my-app -v name:MyApp1 group:MyApps

  Send logs to a Bulog instance with name "my-instance"
    $ tail -f logs.txt | bulog fw my-app -i my-instance
```

## Instances

You can give an instance name when you start Bulog. Each instance name has its own persistent configuration attached to it. This can make it easier to manage cases where you have multiple sets of buckets that you want to separate.

An example would be simultaneous development of two different microservice architecture based projects. Here you might want to send logs from project A to one Bulog instance, and logs from project B to another. Named instances can support such use-cases without needing to remember port numbers.

### Start a named Bulog instance

```
$ bulog start -i project-A -p 7455
```

This starts a Bulog instance with name `project-A` on port `7455`.

### Forward logs to a named instance

```
$ tail -f logs.txt | bulog fw my-bucket -i project-A
```

This forwards logs to a Bulog instance with the name `project-A`. Note that you didn't need to provide a port number.

### Default instance

If you start a Bulog instance without specifying an instance name, it will implicitly get the name `default`. Similarly, forwarding logs without specifying an instance name or other connection details will by automatically connect to the `default` instance.

```
$ bulog start -p 3456
...
$ tail -f logs.txt | bulog fw my-bucket
```

### Limitations

When forwarding logs based on an instance name, the target instance must be running on the same system. You will need to specify the hostname and port to forward logs to a remote instance.
