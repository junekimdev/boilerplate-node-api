# Description of User

## Types of User

1. Special type
   1. guest
   1. admin1
   1. (admin2...)
1. General type
   1. user1
   1. (user2...)

## Types of Service

1. Free services
1. Premium services
1. Admin services

## Relationship

- `guest` can use _free services_ only
- `admin` can use _admin services_
- `admin` can have many more types depending on organizational structure
- `user` can use _premium service_ as well as _free services_
- `user` can have many more types depending on pricing policy
