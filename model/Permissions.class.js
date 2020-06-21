'use strict';

const ObjectId = require('mongodb').ObjectId;
const Collection = require('@bonjourjohn/dbhelper').Collection;
const ObjectUtils = require('@bonjourjohn/utils').Objects;

module.exports = class PermissionsCollection extends Collection {
  constructor(dbInstance, cacheClient) {
    super(dbInstance, 'permissions', cacheClient);
  }

  /**
   * Returns permissions formatted in a single json object indexed by object names.
   * @param permissions Array of json object representing permissions: `{objectname: [verbs]}`
   * @returns {Promise<{}>}
   */
  static async compilePermissions(permissions) {
    let permissionsIdexedByObjects = {};

    //store permissions into object to return
    await Promise.all(
      //loop over role objects permissions
      permissions.map((permission) => {
        //create or complete permissions for current objectName
        ObjectUtils.setValueAt(
          //set in object permissions
          permissionsIdexedByObjects,
          //define value to current object verbs concat to pre existing verbs for current objectName OR empty array
          (ObjectUtils.getValueAt(permissionsIdexedByObjects, permission.objectName) || []).concat(permission.verbs),
          //set this at path `objectName`
          permission.objectName
        );

        //remove duplicates
        permissionsIdexedByObjects[permission.objectName] = permissionsIdexedByObjects[permission.objectName].filter((verb, pos) => {
          return permissionsIdexedByObjects[permission.objectName].indexOf(verb) === pos;
        });
      })
    );

    ObjectUtils.removeEmptyProperties(permissionsIdexedByObjects);
    return permissionsIdexedByObjects;
  }

  /**
   * returns granted permissions for given roles, indexed by object names permissions are granted on
   * @param roleIds
   * @param object
   * @returns {Promise<{}>}
   */
  async compileRolesPermissions(roleIds, object = false) {
    return await PermissionsCollection.compilePermissions(await this.getByRoles(roleIds, object));
  }

  /**
   * returns permissions verbs for given role and object if object given
   * @param roleIds
   * @param object
   * @returns {Promise<*>}
   */
  async getByRoles(roleIds, object = false) {
    if (!Array.isArray(roleIds)) {
      roleIds = [roleIds];
    }
    roleIds = await Promise.all(roleIds.map((roleId) => {
      return ObjectId(roleId.toString());
    }));

    let $match = {
      "roleId": {$in: roleIds},
      "allowed": true
    };
    if (object) {
      $match.object = object;
    }

    return await this.collection.aggregate(
      [
        {
          $match: $match
        },
        {
          $group: {
            _id: "$object",
            verbs: {$addToSet: "$method"}
          }
        },
        {
          $project: {
            "_id": 0,
            "objectName": "$_id",
            verbs: 1
          }
        }
      ]
    )
      .toArray();
  }

  /**
   * Returns true if given role gives access to this verb on this object. False otherwise.
   * @param roleId
   * @param verb
   * @param objectName
   * @returns {Promise<boolean>}
   */
  async roleHasPermissionOn(roleId, verb, objectName) {
    roleId = ObjectId(roleId.toString());

    const permission = await this.findOne({roleId: roleId, object: objectName, allowed: true, method: verb});
    return !!permission;
  }

  /**
   * returns user's permissions according to their roles and personal permissions, indexed by object names permissions are granted on
   * @param user Object containing userId and user's roles ids `{_id: ObjectId, roles: [ObjectId]}`
   * @param objectName
   * @param objectId
   * @returns {Promise<{}>}
   */
  async compileUserPermissions(user, objectName = null, objectId = null) {
    //first get granted permissions by user's roles
    let granted = await PermissionsCollection.compilePermissions(await this.getByRoles(user.roles, objectName));

    const userGranted = await PermissionsCollection.compilePermissions(await this.getGrantedByUser(ObjectId(user._id.toString()), objectName, objectId));
    const userDenied = await PermissionsCollection.compilePermissions(await this.getDeniedByUser(ObjectId(user._id.toString()), objectName, objectId));

    //adding user granted permission to granted object
    //iterate through userGranted properties (object names)
    Object.keys(userGranted).forEach((objectName) => {
      //if no permissions on this object are already existing add them
      if (!granted.hasOwnProperty(objectName)) {
        granted[objectName] = userGranted[objectName];
        //if role already grants permissions on this object, add the missing ones into array
      } else {
        granted[objectName] = granted[objectName].concat(userGranted[objectName].filter((verb) => {
          return granted[objectName].indexOf(verb) === -1;
        }));
      }
    });

    //remove denied permission
    //remove permission only if it was granted
    Object.keys(granted).forEach((objectName) => {
      if (userDenied.hasOwnProperty(objectName)) {
        granted[objectName] = granted[objectName].filter((verb) => {
          return userDenied[objectName].indexOf(verb) === -1;
        })
      }
    });

    ObjectUtils.removeEmptyProperties(granted);
    return granted;
  }

  async getGrantedByUser(userId, objectName = false, objectId = null) {
    return await this.getByUser(userId, true, objectName, objectId);
  }

  async getDeniedByUser(userId, objectName = false, objectId = null) {
    return await this.getByUser(userId, false, objectName, objectId);
  }

  /**
   * returns denied or granted permissions verbs for given user and object if object given
   * @param userId
   * @param granted
   * @param object
   * @param objectId
   * @returns {Promise<*>}
   */
  async getByUser(userId, granted = true, object = false, objectId = null) {
    userId = ObjectId(userId.toString());

    let $match = {
      "userId": userId
    };
    if (object) {
      $match.object = object;
    }

    if (objectId) {
      $match.$or = [
        {"allowed": granted, "except": {$ne: ObjectId(objectId.toString())}},
        {"allowed": !granted, "except": ObjectId(objectId.toString())}
      ]
    } else {
      $match.allowed = granted;
    }

    return await this.collection.aggregate(
      [
        {
          $match: $match
        },
        {
          $group: {
            _id: "$object",
            verbs: {$addToSet: "$method"}
          }
        },
        {
          $project: {
            "_id": 0,
            "objectName": "$_id",
            verbs: 1
          }
        }
      ]
    )
      .toArray();
  }

  /**
   * returns true if user has verb granted on object, on objectId if provided, false otherwise
   * @param user
   * @param object
   * @param verb
   * @param objectId
   * @returns {Promise<boolean>}
   */
  async userHasPermission(user, object, verb, objectId = null) {
    const [rolesPerms, userGranted, userDenied] = await Promise.all(
      [
        PermissionsCollection.compilePermissions(await this.getByRoles(user.roles, object)),
        PermissionsCollection.compilePermissions(await this.getGrantedByUser(user._id, object, objectId)),
        PermissionsCollection.compilePermissions(await this.getDeniedByUser(user._id, object, objectId))
      ]
    );

    const roleHasPerm = (ObjectUtils.getValueAt(rolesPerms, object) || []).indexOf(verb) !== -1;
    const grantedForUser = (ObjectUtils.getValueAt(userGranted, object) || []).indexOf(verb) !== -1;
    const deniedForUser = (ObjectUtils.getValueAt(userDenied, object) || []).indexOf(verb) !== -1;

    return (!deniedForUser && (roleHasPerm || grantedForUser));
  }
};
