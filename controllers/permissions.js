'use strict';

const _Users = require('../model/Users.class');
const _Roles = require('../model/Roles.class');
const _Permissions = require('../model/Permissions.class');
const ObjectId = require('mongodb').ObjectId;
const AppError = require('@bonjourjohn/app-error');
const ObjectUtils = require('@bonjourjohn/utils').Objects;
const sprintf = require("util").format;

module.exports = {
  async createUserPermissions(ctx, next) {
    if (ObjectUtils.isEmpty(ctx.request.body)) {
      throw new AppError(400, "Missing permissions to add");
    }

    const Users = new _Users(ctx.DB, ctx.cacheClient);
    const Permissions = new _Permissions(ctx.DB, ctx.cacheClient);

    await Promise.all([
      Users.init(),
      Permissions.init()
    ]);

    const user = await Users.findOne({_id: ObjectId(ctx.params.userId)});

    if (ObjectUtils.isEmpty(user) || ObjectUtils.deepEqual(Users.emptyDocument, user)) {
      throw new AppError(404, "User not found");
    }

    for (const objectName of Object.keys(ctx.request.body)) {
      for (const method of ctx.request.body[objectName]) {
        //revoke granted exceptions
        await Permissions.remove(
          {
            "userId": ObjectId(user._id.toString()),
            "object": objectName,
            "method": method,
            "allowed": true,
            "except": {$exists: true}
          }
        );

        let userHasPerm = await Permissions.userHasPermission(user, objectName, method);
        if (!userHasPerm) {
          //revoke denials to user on given object (including revocation of exceptions)
          await Permissions.remove(
            {
              "userId": ObjectId(user._id.toString()),
              "object": objectName,
              "method": method,
              "allowed": false
            }
          );
        }

        userHasPerm = await Permissions.userHasPermission(user, objectName, method);
        if (!userHasPerm) {
          //grant permission to user on given object
          await Permissions.insertOne(
            {
              "userId": ObjectId(user._id.toString()),
              "object": objectName,
              "method": method,
              "allowed": true
            }
          )
        }
      }
    }

    ctx.status = 201;
    ctx.body = (await Permissions.compileUserPermissions(user) || {});

    await next();
  },
  async createUserPermissionException(ctx, next) {
    const methods = ctx.request.body;
    if (ObjectUtils.isEmpty(methods)) {
      throw new AppError(400, "Missing permissions to add");
    }

    const Users = new _Users(ctx.DB, ctx.cacheClient);
    const Permissions = new _Permissions(ctx.DB, ctx.cacheClient);

    await Promise.all([
      Users.init(),
      Permissions.init()
    ]);

    const user = await Users.findOne({_id: ObjectId(ctx.params.userId)});

    if (ObjectUtils.isEmpty(user) || ObjectUtils.deepEqual(user, Users.emptyDocument)) {
      throw new AppError(404, "User not found");
    }

    for (const method of methods) {
      let userHasPerm = await Permissions.userHasPermission(user, ctx.params.objectName, method, ctx.params.objectId);
      if (!userHasPerm) {
        //revoke denials to user on given object (including revocation of exceptions)
        await Permissions.findOneAndUpdate(
          {
            "userId": ObjectId(user._id.toString()),
            "object": ctx.params.objectName,
            "method": method,
            "allowed": true
          },
          {
            $pull: {"except": ObjectId(ctx.params.objectId)}
          }
        );
      }
      userHasPerm = await Permissions.userHasPermission(user, ctx.params.objectName, method, ctx.params.objectId);
      //if user still hasn't perm
      if (!userHasPerm) {
        await Permissions.findOneAndUpdate(
          {
            "userId": ObjectId(user._id.toString()),
            "object": ctx.params.objectName,
            "method": method,
            "allowed": false
          },
          {
            $addToSet: {
              "except": ObjectId(ctx.params.objectId)
            }
          },
          {
            upsert: true
          }
        );
      }
    }

    ctx.status = 201;
    ctx.body = (await Permissions.compileUserPermissions(user, ctx.params.objectName, ctx.params.objectId) || []);

    await next();
  },

  /**
   * Returns granted permissions for given role indexed by object name if no object name provided,
   * returns an array of granted permissions if object name provided
   * @param ctx
   * @param next
   * @returns {Promise<void>}
   */
  async getRolePermissions(ctx, next) {
    const Roles = new _Roles(ctx.DB, ctx.cacheClient);
    const Permissions = new _Permissions(ctx.DB, ctx.cacheClient);

    await Promise.all([
      Roles.init(),
      Permissions.init()
    ]);

    const role = await Roles.findOne({_id: ObjectId(ctx.params.roleId)});

    if (ObjectUtils.isEmpty(role) || ObjectUtils.deepEqual(role, Roles.emptyDocument)) {
      throw new AppError(404, 'Role not found');
    }

    ctx.status = 200;
    ctx.body = (await Permissions.compileRolesPermissions(role._id, ctx.query.objectName) || {});

    await next();
  },

  /**
   * Return list of permissions by object for given user.
   * @example
   *
   * {
   *    "subscriptions": ["POST"],
   *    "degrees": ["GET"],
   *    "schools": ["GET"],
   *    "subjects": ["GET"],
   *    "degreesubjects": ["GET"],
   *    "chapterindexes": ["GET"],
   *    "chapters": ["GET"],
   *    "sheets": ["GET"],
   *    ...
   * }
   *
   * @param ctx
   * @param next
   * @returns {Promise<void>}
   */
  async getUserPermissions(ctx, next) {
    const Users = new _Users(ctx.DB, ctx.cacheClient);
    const Permissions = new _Permissions(ctx.DB, ctx.cacheClient);

    await Promise.all([
      Users.init(),
      Permissions.init()
    ]);

    const user = await Users.findOne({"_id": ObjectId(ctx.params.userId)});
    
    if (ObjectUtils.isEmpty(user) || ObjectUtils.deepEqual(user, Users.emptyDocument)) {
      throw new AppError(404, "User not found");
    }

    ctx.status = 200;
    ctx.body = (await Permissions.compileUserPermissions(user, ctx.query.objectName) || {});

    await next();
  },

  /**
   * Returns permissions on given objects for given user. Specify permissions for the given object if objectId provided.
   *
   * @examples
   *
   * /permissions/user/USERID/subscriptions/SUBSCRIPTIONID
   * ["POST"]
   *
   * @param ctx
   * @param next
   * @returns {Promise<void>}
   */
  async getUserPermissionsOn(ctx, next) {
    const Users = new _Users(ctx.DB, ctx.cacheClient);
    const Permissions = new _Permissions(ctx.DB, ctx.cacheClient);

    await Promise.all([
      Users.init(),
      Permissions.init()
    ]);

    const user = await Users.findOne({"_id": ObjectId(ctx.params.userId)});

    if (ObjectUtils.isEmpty(user) || ObjectUtils.deepEqual(user, Users.emptyDocument)) {
      throw new AppError(404, "User not found");
    }

    ctx.status = 200;
    ctx.body = (await Permissions.compileUserPermissions(user, ctx.params.objectName, ctx.params.objectId))[ctx.params.objectName] || [];

    await next();
  },

  /**
   * Add sent permissions to specified couple role/object and returns the list of granted verbs for this role on this object.
   *
   * @example
   *
   * /permissions/role/ROLEID - { "objectName": ["POST"] }
   *
   * ["POST", "GET"]
   *
   * @param ctx
   * @param next
   * @returns {Promise<void>}
   */
  async createRolePermissions(ctx, next) {
    const methods = ctx.request.body;
    if (ObjectUtils.isEmpty(methods)) {
      throw new AppError(400, "Missing permissions to add");
    }

    const Roles = new _Roles(ctx.DB, ctx.cacheClient);
    const Permissions = new _Permissions(ctx.DB, ctx.cacheClient);

    await Promise.all([
      Roles.init(),
      Permissions.init()
    ]);

    const role = await Roles.findOne({_id: ObjectId(ctx.params.roleId)});
    if (ObjectUtils.isEmpty(role) || ObjectUtils.deepEqual(role, Roles.emptyDocument)) {
      throw new AppError(404, "Role not found");
    }

    for (const objectName of Object.keys(ctx.request.body)) {
      for (const method of ctx.request.body[objectName]) {
        await Permissions.findOneAndUpdate(
          {
            "roleId": ObjectId(role._id.toString()),
            "object": objectName,
            "method": method
          },
          {
            $set: {
              "allowed": true
            }
          },
          {upsert: true}
        );
      }
    }

    ctx.status = 201;
    ctx.body = (await Permissions.compileRolesPermissions(role._id) || {});

    await next();
  },

  async removeRolePermissions(ctx, next) {
    const methods = ctx.params.verbs.split(',');
    if (ObjectUtils.isEmpty(methods)) {
      throw new AppError(400, "Missing permissions to remove");
    }

    const Roles = new _Roles(ctx.DB, ctx.cacheClient);
    const Permissions = new _Permissions(ctx.DB, ctx.cacheClient);

    await Promise.all([
      Roles.init(),
      Permissions.init()
    ]);

    const role = await Roles.findOne({_id: ObjectId(ctx.params.roleId)});
    if (ObjectUtils.isEmpty(role) || ObjectUtils.deepEqual(role, Roles.emptyDocument)) {
      throw new AppError(404, "Role not found");
    }

    //remove approvals from permission
    await Permissions.deleteMany(
      {
        "roleId": ObjectId(role._id.toString()),
        "object": ctx.params.objectName,
        "allowed": true,
        "method": {$in: methods}
      }
    );

    ctx.status = 200;
    ctx.body = methods;

    await next();
  },

  async removeUserPermissions(ctx, next) {
    const methods = ctx.params.verbs.split(',');
    if (ObjectUtils.isEmpty(methods)) {
      throw new AppError(400, "Missing permissions to remove");
    }

    const Users = new _Users(ctx.DB, ctx.cacheClient);
    const Permissions = new _Permissions(ctx.DB, ctx.cacheClient);

    await Promise.all([
      Users.init(),
      Permissions.init()
    ]);

    const user = await Users.findOne({_id: ObjectId(ctx.params.userId)});
    if (ObjectUtils.isEmpty(user) || ObjectUtils.deepEqual(user, Users.emptyDocument)) {
      throw new AppError(404, "User not found");
    }

    for (const method of methods) {
      let userHasPermission = await Permissions.userHasPermission(user, ctx.params.objectName, method);
      //if user has permission then maybe it's because we granted it to them, so try to remove this granted perm
      if (userHasPermission) {
        await Permissions.remove(
          {
            "userId": ObjectId(user._id.toString()),
            "object": ctx.params.objectName,
            "allowed": true,
            "method": method
          }
        );
      }

      userHasPermission = await Permissions.userHasPermission(user, ctx.params.objectName, method);
      //if user still has permission, then it has to be because of their role, so add an individual revocation
      if (userHasPermission) {
        await Permissions.findOneAndUpdate(
          {
            "userId": ObjectId(user._id.toString()),
            "object": ctx.params.objectName,
            "method": method
          },
          {
            $set: {
              "allowed": false
            },
            $unset: {
              "except": ""
            }
          },
          {
            upsert: true
          }
        )
      }
    }

    ctx.status = 200;
    ctx.body = methods;

    await next();
  },

  async removeUserPermissionsOnObject(ctx, next) {
    const methods = ctx.params.verbs.split(',');
    if (ObjectUtils.isEmpty(methods)) {
      throw new AppError(400, "Missing permissions to remove");
    }

    const Users = new _Users(ctx.DB, ctx.cacheClient);
    const Permissions = new _Permissions(ctx.DB, ctx.cacheClient);

    await Promise.all([
      Users.init(),
      Permissions.init()
    ]);

    const user = await Users.findOne({_id: ObjectId(ctx.params.userId)});
    if (ObjectUtils.isEmpty(user) || ObjectUtils.deepEqual(user, Users.emptyDocument)) {
      throw new AppError(404, "User not found");
    }

    for (const method of methods) {
      let userHasPermission = await Permissions.userHasPermission(user, ctx.params.objectName, method, ctx.params.objectId);
      //if user has permission on this precise object, maybe it's because we add an individual permission, try to remove it
      if (userHasPermission) {
        await Permissions.findOneAndUpdate(
          {
            "userId": ObjectId(user._id.toString()),
            "object": ctx.params.objectName,
            "allowed": false,
            "method": method,
            "except": ObjectId(ctx.params.objectId)
          },
          {
            $pull: {
              "except": ObjectId(ctx.params.objectId)
            }
          }
        );
      }

      userHasPermission = await Permissions.userHasPermission(user, ctx.params.objectName, method, ctx.params.objectId);
      //if user still has permission then it's because of their roles, so add an individual revocation
      if (userHasPermission) {
        await Permissions.findOneAndUpdate(
          {
            "userId": ObjectId(user._id.toString()),
            "object": ctx.params.objectName,
            "method": method,
            "allowed": true
          },
          {
            $push: {
              "except": ObjectId(ctx.params.objectId)
            }
          },
          {
            upsert: true
          }
        )
      }
    }

    ctx.status = 200;
    ctx.body = methods;

    await next();
  }
};
