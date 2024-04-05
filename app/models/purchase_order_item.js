
/*! 
* Builded by Impleplus application builder (https://builder.impleplus.com) 
* Version 2.0.0 
* Link https://www.impleplus.com 
* Copyright impleplus.com 
* Licensed under MIT (https://mit-license.org) 
*/ 

module.exports = function(sequelize, DataTypes) {
  var purchase_order_item = sequelize.define('purchase_order_item', {
		id: { type: DataTypes.STRING(36), allowNull: false, primaryKey: true },
		purchase_order_id: {type: DataTypes.STRING(36), allowNull: true },
		product_id: {type: DataTypes.STRING(36), allowNull: true },
		product_name: {type: DataTypes.STRING(100), allowNull: true },
		quantity: {type: DataTypes.SMALLINT,allowNull: true},
		unitprice: {type: DataTypes.INTEGER,allowNull: true},
		total: {type: DataTypes.INTEGER,allowNull: true},
		owner_id: {type: DataTypes.STRING(36), allowNull: true },
		assign: {type: DataTypes.TEXT('medium'),allowNull: true},
		create_by: {type: DataTypes.STRING(36), allowNull: true },
		create_date: {type: DataTypes.DATE,allowNull: true},
		update_by: {type: DataTypes.STRING(36), allowNull: true },
		update_date: {type: DataTypes.DATE,allowNull: true}
  },{
    sequelize, tableName: 'purchase_order_item', timestamps: false, indexes: [{name: "PRIMARY",unique: true,using: "BTREE",fields: [{ name: "id" }]}]
  });
  return purchase_order_item;
};