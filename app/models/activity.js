
/*! 
* Builded by Impleplus application builder (https://builder.impleplus.com) 
* Version 2.0.0 
* Link https://www.impleplus.com 
* Copyright impleplus.com 
* Licensed under MIT (https://mit-license.org) 
*/ 

module.exports = function(sequelize, DataTypes) {
  var activity = sequelize.define('activity', {
		id: { type: DataTypes.STRING(36), allowNull: false, primaryKey: true },
		activitytype_id: {type: DataTypes.STRING(36), allowNull: true },
		lead_id: {type: DataTypes.STRING(36), allowNull: true },
		opportunity_id: {type: DataTypes.STRING(36), allowNull: true },
		customer_id: {type: DataTypes.STRING(36), allowNull: true },
		case_id: {type: DataTypes.STRING(36), allowNull: true },
		duedate: {type: DataTypes.DATEONLY,allowNull: true},
		activitystatus_id: {type: DataTypes.STRING(36), allowNull: true },
		owner_id: {type: DataTypes.STRING(36), allowNull: true },
		createby: {type: DataTypes.STRING(36), allowNull: true },
		createdate: {type: DataTypes.DATE,allowNull: true},
		detail: {type: DataTypes.TEXT('medium'),allowNull: true},
		note: {type: DataTypes.TEXT('medium'),allowNull: true},
		assign: {type: DataTypes.TEXT('medium'),allowNull: true},
		create_by: {type: DataTypes.STRING(36), allowNull: true },
		create_date: {type: DataTypes.DATE,allowNull: true},
		update_by: {type: DataTypes.STRING(36), allowNull: true },
		update_date: {type: DataTypes.DATE,allowNull: true}
  },{
    sequelize, tableName: 'activity', timestamps: false, indexes: [{name: "PRIMARY",unique: true,using: "BTREE",fields: [{ name: "id" }]}]
  });
  return activity;
};