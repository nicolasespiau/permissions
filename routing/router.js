'use strict';
const router = module.exports = require('koa-router')();
const permissionsCtrl = require('../controllers/permissions');

/** GET ROUTES **/

/* ROLES */
router.get(
  '/permissions/role/:roleId',
  permissionsCtrl.getRolePermissions
);

/* USERS */
router.get(
  '/permissions/user/:userId',
  permissionsCtrl.getUserPermissions
);
router.get(
  '/permissions/user/:userId/:objectName/:objectId',
  permissionsCtrl.getUserPermissionsOn
);


/** POST ROUTES **/

/* ROLES */
router.post(
  '/permissions/role/:roleId',
  permissionsCtrl.createRolePermissions
);

/* USERS */
router.post(
  '/permissions/user/:userId',
  permissionsCtrl.createUserPermissions
);

router.post(
  '/permissions/user/:userId/:objectName/:objectId',
  permissionsCtrl.createUserPermissionException
);


/** DELETE ROUTES **/
router.delete(
  '/permissions/:verbs/role/:roleId/object/:objectName',
  permissionsCtrl.removeRolePermissions
);
router.delete(
  '/permissions/:verbs/user/:userId/object/:objectName',
  permissionsCtrl.removeUserPermissions
);
router.delete(
  '/permissions/:verbs/user/:userId/object/:objectName/:objectId',
  permissionsCtrl.removeUserPermissionsOnObject
);