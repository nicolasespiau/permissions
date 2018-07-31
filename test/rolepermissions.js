'use strict';

const request = require('supertest');
const test = require("unit.js");
const ObjectUtils = require('@bonjourjohn/utils').Objects;

const fixtureLoaderClass = require('@bonjourjohn/fixture-manager');
let fixtureLoader;

const mongoConnection = require('../lib/mongoClient');

const PermissionsCol = require('../model/Permissions.class');
let Permissions;

let cacheClient;
let server;

describe("Role permissions", () => {
  before("Open server and load fixtures", (done) => {
    delete require.cache[require.resolve("../index")];
    server = require("../index");

    server.on("ready", () => {
      cacheClient = require("../lib/cacheClient");
      mongoConnection.init()
        .then((dbAndClient) => {
          Permissions = new PermissionsCol(dbAndClient[0], cacheClient);
          Permissions.init()
            .then(() => {
              fixtureLoader = new fixtureLoaderClass(dbAndClient[0]);
              fixtureLoader.load(__dirname + "/fixtures/", ["rolepermissions", "roles"])
                .then(() => {
                  done();
                })
                .catch(done);
            })
            .catch(done);
        })
        .catch(done);
    });
  });

  after("close connection", function (done) {
    cacheClient.on('end', async () => {
      if (mongoConnection.connectionInstance)
        await mongoConnection.close();
      delete require.cache[require.resolve('../index')];
      delete require.cache[require.resolve('../lib/cacheClient')];
      delete require.cache[require.resolve('../lib/mongoClient')];
      done();
    });
    cacheClient.flushall()
      .then(() => {
        fixtureLoader.restore()
          .then(() => {
            server.close();
          })
          .catch((err) => {
            server.close();
          });
      })
      .catch(done)
  });

  describe("GET /permissions/role/:roleId on role having no permission", () => {
    let permissions;
    it("should respond 200", (done) => {
      request(server)
        .get(
          "/permissions/role/" + fixtureLoader.get("roles", 0)._id.toString()
        )
        .set("x-app-token", "public-gateway")
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          permissions = res.body;
          done();
        })
    });
    it("should return an empty object", () => {
      test.object(permissions).isEmpty();
    })
  });

  describe("GET /permissions/role/:roleId on role having permission", () => {
    let permissions;
    let objects = ["foo", "bar", "baz"];
    let correctPerms = {
      "foo": ["GET", "POST"],
      "bar": ["GET", "POST", "PUT", "DELETE"],
      "baz": ["GET"]
    };
    it("should respond 200", (done) => {
      request(server)
        .get(
          "/permissions/role/" + fixtureLoader.get("roles", 1)._id.toString()
        )
        .set("x-app-token", "public-gateway")
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          permissions = res.body;
          done();
        })
    });
    it("should return a non empty object", () => {
      test.object(permissions).isNotEmpty();
    });
    it("should return permissions on concerned objects", () => {
      test.object(permissions).hasProperties(objects);
    });
    it("should return array of premissions on each object", () => {
      for (const it in permissions) {
        if (permissions.hasOwnProperty(it))
          test.array(permissions[it]).isNotEmpty();
      }
    });
    it("should return correct permissions on each object", () => {
      for (const it in permissions) {
        if (permissions.hasOwnProperty(it))
          test.array(permissions[it]).hasValues(correctPerms[it]);
      }
    });
  });

  describe("GET /permissions/role/:roleId?objectName=:objectName on role having permission", () => {
    let permissions;
    const object = "foo";
    const correctPerms = ["GET", "POST"];
    it("should respond 200", (done) => {
      request(server)
        .get(
          "/permissions/role/" + fixtureLoader.get("roles", 1)._id.toString() + "?objectName=" + object
        )
        .set("x-app-token", "public-gateway")
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          permissions = res.body;
          done();
        })
    });
    it("should return a non empty object", () => {
      test.object(permissions).isNotEmpty();
    });
    it("should return permissions on concerned object", () => {
      test.object(permissions).hasProperties([object]);
    });
    it("should return array of permissions", () => {
      test.array(permissions[object]).isNotEmpty().hasValues(correctPerms);
    });
  });

  describe("POST /permissions/role/:roleId/object/:objectName adding permissions to a role having no permissions yet", () => {
    const actualVerbs = [];
    let newVerbs;
    const verbsToAdd = ["POST", "GET"];
    const object = "fooz";
    const body = {"fooz": verbsToAdd};
    it("should respond 201", (done) => {
      request(server)
        .post(
          '/permissions/role/' + fixtureLoader.get("roles", 0)._id.toString()
        )
        .send(body)
        .set("x-app-token", "public-gateway")
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);

          newVerbs = res.body;
          done();
        });
    });
    it("should return a JSON with new permissions", () => {
      test.object(newVerbs).contains(body);
    });
  });

  describe("POST /permissions/role/:roleId/object/:objectName adding new permissions", () => {
    let newVerbs;
    const verbsToAdd = ["POST", "PUT"];
    const actualVerbs = ["GET"];
    const object = "baz";
    const expectedResult = ["GET", "POST"];
    const body = {"baz": verbsToAdd};
    it("should respond 201", (done) => {
      request(server)
        .post(
          '/permissions/role/' + fixtureLoader.get("permissions", 2).roleId.toString()
        )
        .send(body)
        .set("x-app-token", "public-gateway")
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);

          newVerbs = res.body;
          done();
        });
    });
    it("should return a JSON with new permissions", () => {
      test.object(newVerbs).contains(body);
    });
  });

  describe("POST /permissions/role/:roleId/object/:objectName adding already granted permissions", () => {
    let newVerbs;
    const verbsToAdd = ["POST"];
    const actualVerbs = ["GET", "POST"];
    const object = "baz";
    const body = {"baz": verbsToAdd};
    it("should respond 201", (done) => {
      request(server)
        .post(
          '/permissions/role/' + fixtureLoader.get("permissions", 2).roleId.toString()
        )
        .send(body)
        .set("x-app-token", "public-gateway")
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);

          newVerbs = res.body;
          done();
        });
    });
    it("should return array of verbs unchanged", () => {
      test.array(newVerbs[object]).hasValues(actualVerbs);
    })
  });

  describe("POST /permissions/role/:roleId", () => {
    const permsBatch = {
      "goo": ["POST"],
      "gooz": ["GET"]
    };
    let newVerbs;
    it("should respond 201", (done) => {
      request(server)
        .post(
          '/permissions/role/' + fixtureLoader.get("roles", 3)._id.toString()
        )
        .send(permsBatch)
        .set("x-app-token", "public-gateway")
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);

          newVerbs = res.body;
          done();
        });
    });
    it("should return non empty object", () => {
      test.object(newVerbs).isNotEmpty();
    });
    it("should return new perms", () => {
      Object.keys(permsBatch).forEach((objectName) => {
        const perm = ObjectUtils.keepProperties(permsBatch, [objectName]);
        test.object(newVerbs).contains(perm);
      });
    })
  });

  describe("DELETE /permissions/role/:roleId/object/:objectName", () => {
    let removedVerbs;
    const verbsToRemove = ["POST"];
    const object = "baz";
    it("should respond 200", (done) => {
      request(server)
        .delete(
          '/permissions/' + verbsToRemove.join(',') + '/role/' + fixtureLoader.get("roles", 1)._id.toString() + '/object/' + object
        )
        .set("x-app-token", "public-gateway")
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          removedVerbs = res.body;
          done();
        });
    });
    it("should return non empty array", () => {
      test.array(removedVerbs).hasValues(verbsToRemove);
    });
    it("should have removed permission", async () => {
      test.bool(await Permissions.roleHasPermissionOn(fixtureLoader.get("roles", 1)._id.toString(), "POST", object)).isFalse();
    });
    it("should still have not removed permission", async () => {
      test.bool(await Permissions.roleHasPermissionOn(fixtureLoader.get("roles", 1)._id.toString(), "GET", object)).isTrue();
    });
  });

  describe("DELETE /permissions/role/:roleId/object/:objectName", () => {
    let removedVerbs;
    const verbsToRemove = ["POST", "PUT"];
    const object = "foo";
    it("should respond 200", (done) => {
      request(server)
        .delete(
          '/permissions/' + verbsToRemove.join(',') + '/role/' + fixtureLoader.get("roles", 1)._id.toString() + '/object/' + object
        )
        .set("x-app-token", "public-gateway")
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          removedVerbs = res.body;
          done();
        });
    });
    it("should return non empty array", () => {
      test.array(removedVerbs).hasValues(verbsToRemove);
    });
    it("should have removed permission POST", async () => {
      test.bool(await Permissions.roleHasPermissionOn(fixtureLoader.get("roles", 1)._id.toString(), "POST", object)).isFalse();
    });
    it("should have removed permission PUT", async () => {
      test.bool(await Permissions.roleHasPermissionOn(fixtureLoader.get("roles", 1)._id.toString(), "PUT", object)).isFalse();
    });
    it("should not have removed other permissions", async () => {
      test.bool(await Permissions.roleHasPermissionOn(fixtureLoader.get("roles", 1)._id.toString(), "GET", object)).isTrue();
    });
  });
});
