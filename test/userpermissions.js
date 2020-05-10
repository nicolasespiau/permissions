'use strict';

const ObjectId = require('mongodb').ObjectId;
const request = require('supertest');
const test = require("unit.js");
const ObjectUtils = require("@bonjourjohn/utils").Objects;
const commonIds = require("./fixtures/commonIds");

const fixtureLoaderClass = require('@bonjourjohn/fixture-manager');
let fixtureLoader;

const mongoConnection = require('../lib/mongoClient');

const PermissionsCol = require('../model/Permissions.class');
let Permissions;

let cacheClient;
let server;

describe("GET permissions", () => {
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
              fixtureLoader.load(__dirname + "/fixtures/", ["permissions", "users", "roles"])
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

  describe("GET user's permissions", () => {
    let permissions;
    const objects = ["schools", "degrees", "subjects", "degreesubjects", "subscriptions"];
    const correctPerms = {
      "schools": ["GET"],
      "degrees": ["GET"],
      "subjects": ["GET"],
      "degreesubjects": ["GET"],
      "subscriptions": ["POST"]
    };
    it("should respond 200", (done) => {
      request(server)
        .get(
          "/permissions/user/" + fixtureLoader.get("users", 0)._id.toString()
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
    it("should have returned a non empty object", () => {
      test.object(permissions).isNotEmpty();
    });
    it("should have returned permissions on concerned objects", () => {
      test.object(permissions).hasProperties(objects);
    });
    it("should have return array of permissions on each object", () => {
      for (const it in permissions) {
        if (permissions.hasOwnProperty(it))
          test.array(permissions[it]).isNotEmpty();
      }
    });
    it("should have return correct permissions on each object", () => {
      for (const it in permissions) {
        if (permissions.hasOwnProperty(it)) {
          test.array(permissions[it]).hasValues(correctPerms[it]);
          test.array(correctPerms[it]).hasValues(permissions[it]);
        }
      }
    });
  });

  describe("GET user's permissions on object", () => {
    let permissions;
    const object = "subscriptions";
    let correctPerms = ["POST"];
    it("should respond 200", (done) => {
      request(server)
        .get(
          "/permissions/user/" + fixtureLoader.get("users", 0)._id.toString() + "?objectName=" + object
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
    it("should have returned a non empty object with a unique key", () => {
      test.object(permissions).hasKeys([object]);
    });
    it("should have return array of correct permissions on unique object", () => {
      test.array(permissions[object]).hasValues(correctPerms);
    });
  });

  describe("GET user's permissions on user having permissions overriden", () => {
    let permissions;
    const objects = ["schools", "degrees", "subjects", "degreesubjects"];
    const correctPerms = {
      "schools": ["GET", "PUT", "DELETE"],
      "degrees": ["GET"],
      "subjects": ["GET"],
      "degreesubjects": ["GET"]
    };
    it("should respond 200", (done) => {
      request(server)
        .get(
          "/permissions/user/" + fixtureLoader.get("users", 1)._id.toString()
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
    it("should have returned a non empty object", () => {
      test.object(permissions).isNotEmpty();
    });
    it("should have returned permissions on concerned objects", () => {
      test.object(permissions).hasProperties(objects);
    });
    it("should have return array of premissions on each object", () => {
      for (const it in permissions) {
        if (permissions.hasOwnProperty(it))
          test.array(permissions[it]).isNotEmpty();
      }
    });
    it("should have return correct premissions on each object", () => {
      for (const it in permissions) {
        if (permissions.hasOwnProperty(it))
          test.array(permissions[it]).hasValues(correctPerms[it]);
      }
    });
  });

  describe("GET user's permissions on object for user having permissions overriden for this object", () => {
    let permissions;
    let object = "subscriptions";
    let correctPerms = {
      "subscriptions": ["GET"]
    };
    it("should respond 200", (done) => {
      request(server)
        .get(
          "/permissions/user/" + fixtureLoader.get("users", 2)._id.toString() + "?objectName=" + object
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
    it("should have returned a non empty object", () => {
      test.object(permissions).isNotEmpty();
    });
    it("should have returned permissions on 1 object", () => {
      test.object(permissions).hasProperties([object]);
    });
    it("should have return array of premissions on object", () => {
      test.array(permissions[object]).isNotEmpty();
    });
    it("should have return correct premissions on each object", () => {
      test.array(permissions[object]).hasValues(correctPerms[object]);
    });
  });

  describe("GET user's permissions on object for user having permissions overriden for this object", () => {
    let permissions, correctPerms;
    before("load correct perms for user", () => {
      correctPerms = [fixtureLoader.get("permissions", 4).method];
    });
    it("should respond 200", (done) => {
      request(server)
        .get(
          "/permissions/user/" + fixtureLoader.get("users", 0)._id.toString()
          + "/" + fixtureLoader.get("permissions", 4).object
          + "/" + fixtureLoader.get("permissions", 4).except[0]
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
    it("should have returned an array with correct perms", () => {
      test.array(permissions).contains(correctPerms);
    });
  });

  describe("POST /permissions/user/:userId", () => {
    describe("POST new permissions", () => {
      const permsBatch = {
        "goo": ["POST"],
        "gooz": ["GET"]
      };
      let newVerbs;
      it("should respond 201", (done) => {
        request(server)
          .post(
            '/permissions/user/' + fixtureLoader.get("users", 3)._id.toString()
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
      });
      it("should give permission to user on given objects to user", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 3), "goo", "POST")).isTrue();
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 3), "gooz", "GET")).isTrue();
      });
    });

    describe("Revoke exceptions", () => {
      const permsBatch = {
        "degrees": ["PUT", "GET"]
      };
      let newVerbs;
      it("should respond 201", (done) => {
        request(server)
          .post(
            '/permissions/user/' + fixtureLoader.get("users", 3)._id.toString()
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
      });
      it("should give permission PUT to user on given objects to user", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 3), "degrees", "PUT")).isTrue();
      });
      it("should give permission GET to user on given objects to user", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 3), "degrees", "GET")).isTrue();
      });
      it("should not move other permissions", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 3), "degrees", "DELETE")).isFalse();
      });
    });

    describe("Revoke denials", () => {
      const permsBatch = {
        "degrees": ["PUT", "GET"]
      };
      let newVerbs;
      it("should respond 201", (done) => {
        request(server)
          .post(
            '/permissions/user/' + fixtureLoader.get("users", 3)._id.toString()
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
      });
      it("should give permission PUT to user on given objects to user", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 3), "degrees", "PUT")).isTrue();
      });
      it("should give permission GET to user on given objects to user", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 3), "degrees", "GET")).isTrue();
      });
      it("should not move other permissions", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 3), "degrees", "DELETE")).isFalse();
      });
    });
  });

  describe("POST /permissions/user/:userId/:objectName/:objectId", () => {
    describe("Add exceptions to not granted permissions", () => {
      const perms = ["PUT", "DELETE"];
      let newVerbs;
      const objectId = ObjectId();
      before("user must not have permission on test object", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 4), "fooz", "PUT", objectId)).isFalse();
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 4), "fooz", "DELETE", objectId)).isFalse();
      });
      it("should respond 201", (done) => {
        request(server)
          .post(
            "/permissions/user/" + fixtureLoader.get("users", 4)._id.toString()
            + "/fooz/"
            + objectId
          )
          .send(perms)
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
        test.object(newVerbs).contains({"fooz": perms});
      });
      it("should give permission to user on given objects to user", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 4), "fooz", "PUT", objectId)).isTrue();
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 4), "fooz", "DELETE", objectId)).isTrue();
      });
    });
    describe("Add exceptions to existing denials", () => {
      const perms = ["PUT", "DELETE"];
      let newVerbs;
      before("user must not have permission on test object", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 4), "degrees", "PUT", commonIds.degrees[1])).isFalse();
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 4), "degrees", "DELETE", commonIds.degrees[1])).isFalse();
      });
      it("should respond 201", (done) => {
        request(server)
          .post(
            "/permissions/user/" + fixtureLoader.get("users", 4)._id.toString()
            + "/degrees/"
            + commonIds.degrees[1].toString()
          )
          .send(perms)
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
        test.object(newVerbs).contains({"degrees": perms});
      });
      it("should give permission to user on given objects to user", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 4), "degrees", "PUT", commonIds.degrees[1])).isTrue();
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 4), "degrees", "DELETE", commonIds.degrees[1])).isTrue();
      });
      it("should not move other permissions", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 4), "degrees", "GET")).isFalse();
      });
    });
    describe("Remove exceptions on existing approvals", () => {
      const perms = ["GET"];
      let newVerbs;
      before("user must not have permission on test object", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 4), "schools", "GET", commonIds.schools[0])).isFalse();
      });
      it("should respond 201", (done) => {
        request(server)
          .post(
            "/permissions/user/" + fixtureLoader.get("users", 4)._id.toString()
            + "/schools/"
            + commonIds.schools[0].toString()
          )
          .send(perms)
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
        test.object(newVerbs).contains({"schools": perms});
      });
      it("should give permission to user on given objects to user", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 4), "schools", "GET", commonIds.schools[0])).isTrue();
      });
    });
  });

  describe("DELETE /permissions/:verbs/user/:userId/object/:objectName", () => {
    describe("Revoke perms granted to user individually", () => {
      let removedVerbs;
      const verbsToRemove = ["PUT", "DELETE"];
      const object = "schools";
      it("should respond 200", (done) => {
        request(server)
          .delete(
            '/permissions/' + verbsToRemove.join(',') + '/user/' + fixtureLoader.get("users", 1)._id.toString() + '/object/' + object
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
      it("should remove permissions", async () => {
        test.array((await Permissions.compileUserPermissions(fixtureLoader.get("users", 1), object))[object]).notContains(verbsToRemove);
      });
      it("should not remove other permissions", async () => {
        test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 1), object, "GET")).isTrue();
      });
    });
    describe("Revoke perms granted to user by their roles", () => {
      let removedVerbs;
      const verbsToRemove = ["GET"];
      const object = "degrees";
      it("should respond 200", (done) => {
        request(server)
          .delete(
            '/permissions/' + verbsToRemove.join(',') + '/user/' + fixtureLoader.get("users", 1)._id.toString() + '/object/' + object
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
      it("should remove permissions", async () => {
        test.value((await Permissions.compileUserPermissions(fixtureLoader.get("users", 1), object))[object]).isUndefined();
      });
    });
  });

  describe("DELETE /permissions/:verbs/user/:userId/object/:objectName/:objectId", () => {
    describe("Revoke perms granted to user individually", () => {
      let removedVerbs, userPermissions;
      const verbsToRemove = ["PUT", "DELETE"];
      const object = "schools";
      const objectId = ObjectId();
      before("compile user permissions", async () => {
        userPermissions = await Permissions.compileUserPermissions(fixtureLoader.get("users", 4));
      });
      it("should respond 200", (done) => {
        request(server)
          .delete(
            '/permissions/' + verbsToRemove.join(',') + '/user/' + fixtureLoader.get("users", 4)._id.toString() + '/object/' + object
            + "/" + objectId
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
      it("should not change permissions", async () => {
        const newPerms = await Permissions.compileUserPermissions(fixtureLoader.get("users", 4));
        test.object(newPerms).contains(userPermissions);
        test.object(userPermissions).contains(newPerms);
      });
      it("should remove permissions on specified object", async () => {
        for (const method of verbsToRemove) {
          test.bool(await Permissions.userHasPermission(fixtureLoader.get("users", 4), object, method, objectId)).isFalse();
        }
      });
    });
  });
});
