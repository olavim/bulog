# Bulog - Web UI for application logs

Stream application logs into a central web-based UI.

## Table of contents

- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Commands](#commands)
  - [start](#commands-start)
  - [forward](#commands-forward)
  - [config where](#commands-config-where)
- [Configuration](#configuration)
  - [Server](#configuration-server)
  - [Log clients](#configuration-log-clients)
    - [Config schema](#configuration-log-clients-schema)
    - [Example config](#configuration-log-clients-example)
  - [Config precedence](#configuration-precedence)
- [Instances](#instances)
- [Authentication](#authentication)
  - [OpenID Connect](#authentication-oidc)

## Features <a name="features"></a>

- Send application logs to a web UI. Logs from different applications can be sent to different buckets for better organization in the UI.
- View individual logs with a JSON viewer.
- Search and filter logs with [liqe](https://github.com/gajus/liqe), a lucene-like query language.
- Add columns and configure them with a flexible JavaScript formatter.
- Combine data from multiple buckets into filtered views.
- Configurable from command line and from the web UI.
- Import and export settings.

## Installation <a name="installation"></a>

```
$ npm install -g bulog
```

## Quick start <a name="quick-start"></a>

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

## Commands <a name="commands"></a>

### `start` <a name="commands-start"></a>

Starts a Bulog server

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

### `forward` <a name="commands-forward"></a>

Aliases: `fw`

Forward logs from stdin to a Bulog instance

```
USAGE
  $ bulog fw BUCKET [-i <value> | -u <value>] [-v <value>] [-o] [--insecure]

ARGUMENTS
  BUCKET  Bucket name. Logs are separated by buckets in the Web UI.

FLAGS
  -i, --instance=<id>     [default: default] Bulog instance to connect to
  -o, --pipeOutput        Echo logs in addition to sending them to Bulog
  -u, --url=<url>         [default: http://localhost:3100] Bulog instance URL to connect to
  -v, --value=<value>...  Value added to logs
      --insecure          Allow SSL/TLS connections to servers with self-signed certificates

DESCRIPTION
  Forwards logs from stdin to a Bulog server

ALIASES
  $ bulog fw

EXAMPLES
  Send logs to bucket "my-app"
    $ tail -f logs.txt | bulog fw my-app

  Send logs to a Bulog instance running at http://localhost:3000
    $ tail -f logs.txt | bulog fw my-app -u http://localhost:3000

  Send logs with additional hard-coded log fields
    $ tail -f logs.txt | bulog fw my-app -v name:MyApp1 group:MyApps

  Send logs to a Bulog instance with name "my-instance"
    $ tail -f logs.txt | bulog fw my-app -i my-instance
```

### `config where` <a name="commands-config-where"></a>

Returns the config directory.

```
USAGE
  $ bulog config where

DESCRIPTION
  Returns the config directory
```

## Configuration <a name="configuration"></a>

Use the `bulog config where` command to find the config directory.

All configuration files are in [TOML](https://toml.io/en/) format.

### Server <a name="configuration-server"></a>

All Bulog server configuration can be done from the web UI.

That said, the instance-specific configuration files can be found in

- `<instance-name>/server.toml` - Server defaults and authentication configs
- `<instance-name>/buckets.toml` - Instance bucket configs
- `<instance-name>/filters.toml` - Instance filter configs

### Log clients <a name="configuration-log-clients"></a>

Log client refers to the `bulog forward` command. Log client configurations can be found in the `log-client.toml` file.

Log client configurations are instance-specific. For example, if you wanted to send logs to a remote Bulog server running at `https://example.com` using an easy to remember name `example`, you can define an instance `example` and set the `url` config under it.

```toml
[example]
url = "https://example.com"
```

Now you can send logs to the remote Bulog server with `tail -f logs.txt | bulog fw -i example`.

If you are using Bulog to just make local development easier, there is probably no need for you to ever touch the config files. The config files are there primarily to make connecting to remote instances easier, and when sending logs to instances with authentication enabled.

#### Log client config schema <a name="configuration-log-clients-schema"></a>

| config                       | environment variable                   | CLI flag | description                                                                                              |
| ---------------------------- | -------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `url`                        | `BULOG_FW_URL`                         | `--url`  | Bulog instance URL to send logs to.                                                                      |
| `auth.method`                | `BULOG_FW_AUTH_METHOD`                 |          | Authentication method. Set to `"none"` for no authentication. Set to `"oidc"` for OpenID Connect.        |
| `auth.oidc.issuerUrl`        | `BULOG_FW_AUTH_OIDC_ISSUER_URL`        |          | OpenID Connect issuer base URL when using OpenID Connect authentication.                                 |
| `auth.oidc.clientId`         | `BULOG_FW_AUTH_OIDC_CLIENT_ID`         |          | Client ID used in client credentials flow when using OpenID Connect authentication.                      |
| `auth.oidc.clientSecret`     | `BULOG_FW_AUTH_OIDC_CLIENT_SECRET`     |          | Client secret used in client credentials flow when using OpenID Connect authentication.                  |
| `auth.oidc.additionalParams` | `BULOG_FW_AUTH_OIDC_ADDITIONAL_PARAMS` |          | Additional parameter to send during client credentials request when using OpenID Connect authentication. |

#### Example log client config file <a name="configuration-log-clients-example"></a>

```toml
# Default instance config
# This is the configuration used when running `bulog forward` without the --instance flag
[default]
# Bulog instance URL
url = "http://localhost:3100"

# Authentication method. Either "none" for no authentication, or "oidc" for OpenID Connect.
auth.method = "none"

# Issuer base URL when using OpenID Connect authentication.
auth.oidc.issuerUrl = "https://my-issuer.com"

# Client ID used in client credentials flow when using OpenID Connect authentication.
auth.oidc.clientId = "xxxxxxxxxxxxxxxx"

# Client secret used in client credentials flow when using OpenID Connect authentication.
auth.oidc.clientSecret = "xxxxxxxxxxxxxxxx"

# Additional parameters to send during client credentials request.
auth.oidc.additionalParams.audience = "example"
auth.oidc.additionalParams.scope = "openid profile"

# This is the configuration used when running `bulog forward --instance instance2`
[instance2]
url = "https://example.com"
```

### Configuration precedence <a name="configuration-precedence"></a>

Where applicable, configurations take the following precedence:

```
CLI flag > environment variable > config file
```

## Instances <a name="instances"></a>

You can give an instance name when you start Bulog. Each instance name has its own persistent configuration attached to it. This can make it easier to manage cases where you have multiple sets of buckets that you want to separate.

An example would be simultaneous development of two different microservice architecture based projects. Here you might want to send logs from project A to one Bulog instance, and logs from project B to another. Named instances can support such use-cases without needing to remember specific connection details.

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

If you start a Bulog instance without specifying an instance name, it will implicitly get the name `default`. Similarly, forwarding logs without specifying an instance name or other connection details will automatically connect to the `default` instance.

```
$ bulog start -p 3456
...
$ tail -f logs.txt | bulog fw my-bucket
```

### Limitations

When forwarding logs based on an instance name, automatic instance discovery only works for instances running on the same system. If you want to connect to a remote instance with an instance name, you must add configuration for the instance in `log-client.toml`.

## Authentication <a name="authentication"></a>

You can enable simple username and password authentication, or integrate into an external OpenID Connect provider, such as Auth0 or Keycloak. Authentication can be configured in the web UI or in the `<instance>/server.toml` configuration file (you can find the config location with the `bulog config where` command).

If you accidentally lock yourself out while configuring authentication, you can start the server with the `--no-auth` flag to temporarily disable authentication.

When authentication is enabled, web UI users must first log in. Additionally, the `bulog forward` command will need some extra configuration to get access to the server instance.

### OpenID Connect integration <a name="authentication-oidc"></a>

Enables authentication with an external OpenID Connect provider, such as Auth0 or Keycloak.

#### Authenticating log clients

The `bulog forward` command uses the OAuth 2.0 client credential flow to gain access to the Bulog server instance. Therefore the command must be provided with parameters required to make client credential requests. These parameters can be set either in the `log-client.toml` configuration file, or with environment variables.

| config                       | environment variable                   | description                                                     |
| ---------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| `auth.method`                | `BULOG_FW_AUTH_METHOD`                 | Authentication method. Set to `"oidc"` for OpenID Connect.      |
| `auth.oidc.issuerUrl`        | `BULOG_FW_AUTH_OIDC_ISSUER_URL`        | OpenID Connect issuer base URL.                                 |
| `auth.oidc.clientId`         | `BULOG_FW_AUTH_OIDC_CLIENT_ID`         | Client ID used in client credentials flow.                      |
| `auth.oidc.clientSecret`     | `BULOG_FW_AUTH_OIDC_CLIENT_SECRET`     | Client secret used in client credentials flow.                  |
| `auth.oidc.additionalParams` | `BULOG_FW_AUTH_OIDC_ADDITIONAL_PARAMS` | Additional parameter to send during client credentials request. |

The `auth.oidc.additionalParams` config is a key-value mapping of additional parameters to send during the client credentials request. It depends on the OpenID Connect provider what should be put here. For example, Auth0 requires the `audience` parameter to identify the API you are requesting credentials for. Many providers also allow you to specify a `scope`.

Example `auth.oidc.additionalParams` config with an example `audience` and `scope`:

```
auth.oidc.additionalParams.audience = "https://example.com"
auth.oidc.additionalParams.scope = "openid profile"
```

Equivalent `BULOG_FW_AUTH_OIDC_ADDITIONAL_PARAMS` value:

```
BULOG_FW_AUTH_OIDC_ADDITIONAL_PARAMS="audience=https://example.com;scope=openid profile"
```

This would result in a client credentials request similar to

```
POST /token HTTP/1.1
Host: your-issuer.com

grant_type=client_credentials
&client_id=xxxxxxxxxx
&client_secret=xxxxxxxxxx
&audience=https://example.com
&scope=openid profile
```
