# JuneKim Resource Name

## Schema

```text
jrn:service:region:owner:resource
```

|    name    | meaning                                     | required | default value |
| :--------: | :------------------------------------------ | :------: | :-----------: |
|   `jrn`    | indicator of JuneKim Resource Name Schema   |          |      n/a      |
| `service`  | ID or the name of service                   |    ✔️    |       -       |
|  `region`  | ID or the name of region of the resource    |          |      all      |
|  `owner`   | ID or the name of the owner of the resource |          |     root      |
| `resource` | ID or URL of the resource                   |    ✔️    |       -       |

- When omitted, the default value applies

## Examples

1. JWT

```json
{
  "iss": "jrn:auth::devNo1:https://junekim.xyz/api/v1/auth",
  "aud": "jrn:my_service:kr-01:awesomeDev:https://junekim.xyz/api/v1/my_service/*",
  "sub": "user@example.come"
}
```

- the issuer of token is the service named with _auth_, which
  - serves _all_ regions,
  - is owned by _devNo1_,
  - can be accessed through given _URL_
- the audience of token is the service named with _my_service_, which
  - serves _kr-01_ regions,
  - is owned by _awesomeDev_,
  - grants permission to access to the given _URLs_
- the subject of token is a user named with: _user@example.come_, which is not in **jrn** format
