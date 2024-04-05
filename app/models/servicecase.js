
/*! 
* Builded by Impleplus application builder (https://builder.impleplus.com) 
* Version 2.0.0 
* Link https://www.impleplus.com 
* Copyright impleplus.com 
* Licensed under MIT (https://mit-license.org) 
*/ 

module.exports = function(sequelize, DataTypes) {
  var servicecase = sequelize.define('servicecase', {
		id: { type: DataTypes.STRING(36), allowNull: false, primaryKey: true },
		subject: {type: DataTypes.STRING(200), allowNull: true },
		detail: {type: DataTypes.TEXT('medium'),allowNull: true},
		note: {type: DataTypes.TEXT('medium'),allowNull: true},
		owner_id: {type: DataTypes.STRING(36), allowNull: true },
		casestatus_id: {type: DataTypes.STRING(36), allowNull: true },
		createby: {type: DataTypes.STRING(36), allowNull: true },
		createdate: {type: DataTypes.DATE,allowNull: true},
		assign: {type: DataTypes.TEXT('medium'),allowNull: true},
		create_by: {type: DataTypes.STRING(36), allowNull: true },
		create_date: {type: DataTypes.DATE,allowNull: true},
		update_by: {type: DataTypes.STRING(36), allowNull: true },
		update_date: {type: DataTypes.DATE,allowNull: true}
  },{
    sequelize, tableName: 'servicecase', timestamps: false, indexes: [{name: "PRIMARY",unique: true,using: "BTREE",fields: [{ name: "id" }]}]
  });
  return servicecase;
};