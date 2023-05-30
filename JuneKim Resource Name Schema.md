# JuneKim Resource Name

## Schema

```text
jrn;region;owner;service;resource
```

|    name    | meaning                                           | required | default value |
| :--------: | :------------------------------------------------ | :------: | :-----------: |
|   `jrn`    | indicator of JuneKim Resource Name Schema         |    ✔️    |      n/a      |
|  `region`  | ID or the name of region of the resource          |          |    global     |
|  `owner`   | ID or the name of the owner of the resource       |          |     root      |
| `service`  | ID or the name of service related to the resource |          |      any      |
| `resource` | ID, name, or URL of the resource                  |          |      all      |

- When omitted, the default value applies

> ⚠️ The resource(s) refered by this schema MAY or MAY NOT be unique

## Examples

- `jrn;;;;`

  - meaning: all resources related to any services owned by root globally

  > ⚠️ NOT RECOMMENDED to use this unless you know what you are doing

- `jrn;;;;image.png`

  - meaning: `image.png` related to any services owned by root globally available

- `jrn;;;myhomepage;image.png`

  - meaning: `image.png` related to `myhomepage` service owned by root globally available

- `jrn;;mycompany;myhomepage;image.png`

  - meaning: `image.png` related to `myhomepage` service owned by `mycompany` globally available

- `jrn:seoul;mycompany;myhomepage;image.png`

  - meaning: `image.png` related to `myhomepage` service owned by `mycompany` available in `seoul` region

## Use Case

- Json Web Token

```json
{
  "iss": "jrn;;;auth:jwt",
  "aud": "jrn;seoul;awesomeDev;cash_cow;users",
  "sub": "thirdparty@example.com"
}
```

- the _issuer of token_ is the resource named `jwt`, which is
  - related to `auth` service,
  - owned by `root`
- the _audience of token_ is the resource named `users`, which is
  - related to `cash_cow` service,
  - owned by `awesomeDev`,
  - available in `seoul` region
- the _subject of token_ is a thirst party app ID named with: `thirdparty@example.com`, which is not in `jrn` format
