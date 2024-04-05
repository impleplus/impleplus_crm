
/*! 
* Builded by Impleplus application builder (https://builder.impleplus.com) 
* Version 2.0.0 
* Link https://www.impleplus.com 
* Copyright impleplus.com 
* Licensed under MIT (https://mit-license.org) 
*/ 

module.exports = function(sequelize, DataTypes) {
  var leads = sequelize.define('leads', {
		id: { type: DataTypes.STRING(36), allowNull: false, primaryKey: true },
		gender: {type: DataTypes.STRING(10), allowNull: true },
		firstname: {type: DataTypes.STRING(30), allowNull: true },
		lastname: {type: DataTypes.STRING(30), allowNull: true },
		dateofbirth: {type: DataTypes.DATEONLY,allowNull: true},
		leadsource_id: {type: DataTypes.STRING(36), allowNull: true },
		address: {type: DataTypes.STRING(100), allowNull: true },
		province: {type: DataTypes.STRING(30), allowNull: true },
		country: {type: DataTypes.STRING(30), allowNull: true },
		zipcode: {type: DataTypes.STRING(10), allowNull: true },
		contact: {type: DataTypes.STRING(100), allowNull: true },
		phone: {type: DataTypes.STRING(30), allowNull: true },
		email: {type: DataTypes.STRING(30), allowNull: true },
		interest: {type: DataTypes.TEXT('medium'),allowNull: true},
		note: {type: DataTypes.TEXT('medium'),allowNull: true},
		owner_id: {type: DataTypes.STRING(36), allowNull: true },
		assign: {type: DataTypes.TEXT('medium'),allowNull: true},
		create_by: {type: DataTypes.STRING(36), allowNull: true },
		create_date: {type: DataTypes.DATE,allowNull: true},
		update_by: {type: DataTypes.STRING(36), allowNull: true },
		update_date: {type: DataTypes.DATE,allowNull: true}
  },{
    sequelize, tableName: 'leads', timestamps: false, indexes: [{name: "PRIMARY",unique: true,using: "BTREE",fields: [{ name: "id" }]}]
  });
  return leads;
};