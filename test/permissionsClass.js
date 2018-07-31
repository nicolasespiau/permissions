'use strict';

const request = require('supertest');
const test = require("unit.js");

const fixtureLoaderClass = require('@bonjourjohn/fixture-manager');
let fixtureLoader;

const mongoConnection = require('../lib/mongoClient');

const PermissionsCol = require('../model/Permissions.class');
let Permissions;

let cacheClient;

describe("Testing Permissions.class", () => {
  let db;

  let cacheClient;

  before("Create db connection", function (done) {
    delete require.cache[require.resolve('../lib/mongoClient')];
    delete require.cache[require.resolve('../lib/cacheClient')];

    cacheClient = require('../lib/cacheClient');
    cacheClient.once('ready', () => {
      mongoConnection.init()
        .then((dbAndClient) => {
          db = dbAndClient[0];
          Permissions = new PermissionsCol(db, cacheClient);
          fixtureLoader = new fixtureLoaderClass(db);

          Promise.all([
            Permissions.init(),
            fixtureLoader.load(__dirname + "/fixtures/", ["permissionsclassroles", "permissionsclasspermissions", "permissionsclassusers"])
          ])
            .then(() => {
              done();
            })
            .catch(done);
        })
        .catch(done);
    });
  });

  after("close connection", function (done) {
    if (cacheClient.status !== "ready") {
      cacheClient.connect();
    }
    cacheClient.flushall()
      .then(() => {
        fixtureLoader.restore()
          .then(() => {
            Promise.all(
              [mongoConnection.close(), cacheClient.end()]
            )
              .then(() => {
                delete require.cache[require.resolve('../lib/mongoClient')];
                delete require.cache[require.resolve('../lib/cacheClient')];
                done();
              })
              .catch(done);
          })
          .catch(done);
      })
      .catch(done)
  });

  describe("getByRoles(roleId)", () => {
    let permissions;
    before("do getByRoles", async () => {
      permissions = await Permissions.getByRoles(fixtureLoader.get("roles", 0)._id);
    });
    it("should return permissions for 3 objects", () => {
      test.array(permissions).hasLength(3);
    });
    it("should return all permissions for these objects", () => {
      test.array(permissions).contains([
        {"verbs": ["DELETE", "PUT", "POST", "GET"], "objectName": "foo"},
        {"verbs": ["GET"], "objectName": "baz"},
        {"verbs": ["POST", "GET"], "objectName": "bar"}
      ]);
    });
  });

  describe("getByRoles(roleId, objecName)", () => {
    let permissions;
    before("do getByRoles", async () => {
      permissions = await Permissions.getByRoles(fixtureLoader.get("roles", 0)._id, "foo");
    });
    it("should return an array with all permissions for given object", () => {
      test.array(permissions).hasLength(1);
    });
    it("should return an object with the name and the verbs", () => {
      test.object(permissions[0]).hasProperties(["objectName", "verbs"]);
    });
    it("should return the proper verbs for object", () => {
      test.array(permissions[0].verbs).contains(["GET", "POST", "PUT", "DELETE"]);
    });
  });

  describe("compileRolesPermissions(roleId)", () => {
    let permissions;
    const objects = ["foo", "bar", "baz"];
    const correctPerms = {
      "foo": ["DELETE", "PUT", "POST", "GET"],
      "baz": ["GET"],
      "bar": ["POST", "GET"]
    };
    before("do compileRolesPermissions", async () => {
      permissions = await Permissions.compileRolesPermissions(fixtureLoader.get("permissions", 0).roleId);
    });
    it("should return all permissions for given objects", () => {
      test.object(permissions).hasProperties(objects);
    });
    it("should return correct permissions", () => {
      for (const it in permissions) {
        if (permissions.hasOwnProperty(it))
          test.array(permissions[it]).hasValues(correctPerms[it]);
      }
    });
  });

  describe("compileRolesPermissions(roleId, objectName)", () => {
    let permissions;
    const correctPerms = ["DELETE", "PUT", "POST", "GET"];
    before("do compileRolesPermissions", async () => {
      permissions = await Permissions.compileRolesPermissions(fixtureLoader.get("permissions", 0).roleId, "foo");
    });
    it("should return JSON with 1 element", () => {
      test.array(Object.keys(permissions)).hasLength(1);
    });
    it("should return JSON with the right property", () => {
      test.object(permissions).hasProperty("foo");
    });
    it("should return correct permissions on object", () => {
      test.array(permissions.foo).hasValues(correctPerms);
    });
  });

  describe("roleHasPermissionOn", () => {
    let hasPermission;
    before("do roleHasPermissionOn", async () => {
      hasPermission = await Permissions.roleHasPermissionOn(fixtureLoader.get("permissions", 0).roleId, "DELETE", "foo");
    });
    it("should return true", () => {
      test.bool(hasPermission).isTrue();
    });
  });

  describe("getGrantedByUser(userId)", () => {
    let permissions;
    before("do getGrantedByUser", async () => {
      permissions = await Permissions.getGrantedByUser(fixtureLoader.get("users", 0)._id);
    });
    it("should return permissions for 1 objects", () => {
      test.array(permissions).hasLength(1).contains([{"verbs": ["GET"], "objectName": "boz"}]);
    });
  });

  describe("getDeniedByUser(userId)", () => {
    let permissions;
    before("do getDeniedByUser", async () => {
      permissions = await Permissions.getDeniedByUser(fixtureLoader.get("users", 0)._id);
    });
    it("should return permissions for 1 objects", () => {
      test.array(permissions).hasLength(1).contains([{"verbs": ["GET"], "objectName": "baz"}]);
    });
  });

  describe("getGrantedByUser(userId, objectName)", () => {
    let permissions;
    before("do getGrantedByUser", async () => {
      permissions = await Permissions.getGrantedByUser(fixtureLoader.get("users", 0)._id, "boz");
    });
    it("should return permissions for 1 objects", () => {
      test.array(permissions).hasLength(1).contains([{"verbs": ["GET"], "objectName": "boz"}]);
    });
  });

  describe("getDeniedByUser(userId, objectName)", () => {
    let permissions;
    before("do getDeniedUserVerbsOn", async () => {
      permissions = await Permissions.getDeniedByUser(fixtureLoader.get("users", 0)._id, "baz");
    });
    it("should return permissions for 1 objects", () => {
      test.array(permissions).hasLength(1).contains([{"verbs": ["GET"], "objectName": "baz"}]);
    });
  });

  describe("userHasPermission(user, object, verb)", () => {
    describe("when user has no role perm on object but granted individualy", () => {
      it("should return true", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 0), "boz", "GET")).isTrue();
      });
    });
    describe("when user has role perm", () => {
      it("should return true", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 0), "foo", "GET")).isTrue();
      });
    });
    describe("when user has role perm on object but denied individualy", () => {
      it("should return true", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 0), "baz", "GET")).isFalse();
      });
    });
    describe("when user has no perm on object", () => {
      it("should return true", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 0), "baz", "POST")).isFalse();
      });
    });
  });
});
