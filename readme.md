# PERMISSIONS SERVICE

## Description

This micro service is designed to manage user's permissions.

It allows to get and/or create permissions for roles and/or user.

It should be called by any gateway API willing to execute something on a declared object to be sure the connected user is
allowed to execute this action on this object.

## Permission structure

### Role permissions

```json
{
  "roleId": ObjectId,
  "object": String,
  "method": String, //enum: POST, GET, PUT, DELETE
  "allowed": Bool //true only
}
```

A permission not found is considered `false`.

Role permissions are only designed to grant permission. A permission with `allowed: false` does not exist.

Example:

Giving full access to subscriptions to a role:
```json
[{
  "roleId": ObjectId("5ab282a4f90bee91f3dd2e46"),
  "object": "subscriptions",
  "method": "POST",
  "allowed": true
},
{
  "roleId": ObjectId("5ab282a4f90bee91f3dd2e46"),
  "object": "subscriptions",
  "method": "PUT",
  "allowed": true
},
{
  "roleId": ObjectId("5ab282a4f90bee91f3dd2e46"),
  "object": "subscriptions",
  "method": "GET",
  "allowed": true
},
{
  "roleId": ObjectId("5ab282a4f90bee91f3dd2e46"),
  "object": "subscriptions",
  "method": "DELETE",
  "allowed": true
}]
```

### User permissions

```json
{
  "userId": ObjectId,
  "object": String,
  "method": String, //enum: POST, GET, PUT, DELETE
  "allowed": Bool,
  "except": [ObjectId] //otional, list of ids on wich the current permission is reversed
}
```

User's permissions override role's permission.

Example: users having only a certain role have permissions on object `subscriptions`, but we want to deny these permissions
for a given user:

```json
[{
  "userId": ObjectId("5ab289a0f90bee91f3dd2e48"),
  "object": "subscriptions",
  "method": "POST",
  "allowed": false
},
{
  "userId": ObjectId("5ab289a0f90bee91f3dd2e48"),
  "object": "subscriptions",
  "method": "PUT",
  "allowed": false
},
{
  "userId": ObjectId("5ab289a0f90bee91f3dd2e48"),
  "object": "subscriptions",
  "method": "GET",
  "allowed": false
},
{
  "userId": ObjectId("5ab289a0f90bee91f3dd2e48"),
  "object": "subscriptions",
  "method": "DELETE",
  "allowed": false
}]
```

It also makes possible to give user permissions on determined objects, designed by their id.

Example, users having only a certain role do not have any permissions on object `users`. But they need to have
permissions `PUT` and `GET` on themselves.

To do that:

```json
[{
  "userId": ObjectId("5ab289a0f90bee91f3dd2e48"),
  "object": "users",
  "method": "PUT", //enum: POST, GET, PUT, DELETE
  "allowed": false,
  "except": [ObjectId("5ab289a0f90bee91f3dd2e48")] //otional, list of ids on wich the current permission is reversed
},
{
  "userId": ObjectId("5ab289a0f90bee91f3dd2e48"),
  "object": "users",
  "method": "GET", //enum: POST, GET, PUT, DELETE
  "allowed": false,
  "except": [ObjectId("5ab289a0f90bee91f3dd2e48")] //otional, list of ids on wich the current permission is reversed
}]
```

This document confirms that this user does not have the given permissions on objects `users`, except the ones having the
id `ObjectId("5ab289a0f90bee91f3dd2e48")`, i.e. the user themselves.

## Routes

### GET /permissions/role/:roleId

Returns all permissions for this role, stored in an json object indexed by the object names the permissions are granted on:

Example:

Call: `/permissions/role/5ab282a4f90bee91f3dd2e46`

```json
{
  "subscriptions": ["POST", "PUT", "GET"],
  "users": ["GET"],
  "credits": ["GET"],
  "usercredits": ["GET", "POST"]
}
```

This route accepts a query param `objectName` that allows to return only the permissions for the specified object name:

Call: `/permissions/role/5ab282a4f90bee91f3dd2e46?object=users`

```json
{ "users": ["GET"] }
```

### GET /permissions/user/:userId

Returns all permissions for this user, according to their role and private granted permissions, stored in an json object
indexed by the object names the permissions are granted on:

Example:

Call: `/permissions/user/5ab289a0f90bee91f3dd2e48`

```json
{
  "subscriptions": ["POST", "PUT", "GET"],
  "users": ["GET"],
  "credits": ["GET"],
  "usercredits": ["GET", "POST"]
}
```

This route accepts a query param `objectName` that allows to return only the permissions for the specified object name:

Call: `/permissions/user/5ab289a0f90bee91f3dd2e48?objectName=subscriptions`

```json
{ "subscriptions": ["POST", "PUT", "GET"] }
```

### GET /permissions/user/:iserId/:objectName/:objectId

Returns all permissions granted this user on this object instance, according to their role and private granted permissions.

Example:

Call: `/permissions/user/5ab282a4f90bee91f3dd2e48/users/5ab282a4f90bee91f3dd2e48`

```json
["PUT", "GET"]
```

## Tests

### 1. Build networks

```bash
docker network create db && \
docker network create cache && \
docker network create services
```

### 2. Launch dependencies

```bash
docker-compose -f compose/dev-dependencies.yml up -d
```

### 3. Build the Docker image

 ```bash
 docker build -t local/permissions-service:test .
 ```

 ### 4. Run tests

 ```bash
 docker-compose -f compose/dev-test.yml
 ```