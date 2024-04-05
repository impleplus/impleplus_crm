
/*! 
* Builded by Impleplus application builder (https://builder.impleplus.com) 
* Version 2.0.0 
* Link https://www.impleplus.com 
* Copyright impleplus.com 
* Licensed under MIT (https://mit-license.org) 
*/ 

module.exports = function(sequelize, DataTypes) {
  var purchase_order = sequelize.define('purchase_order', {
		id: { type: DataTypes.STRING(36), allowNull: false, primaryKey: true },
		doc_no: {type: DataTypes.STRING(20), allowNull: true },
		doc_date: {type: DataTypes.DATEONLY,allowNull: true},
		deliverydate: {type: DataTypes.DATEONLY,allowNull: true},
		shipvia: {type: DataTypes.STRING(100), allowNull: true },
		terms: {type: DataTypes.STRING(300), allowNull: true },
		customer: {type: DataTypes.STRING(30), allowNull: true },
		customer_address: {type: DataTypes.STRING(100), allowNull: true },
		customer_province: {type: DataTypes.STRING(30), allowNull: true },
		customer_country: {type: DataTypes.STRING(30), allowNull: true },
		customer_zipcode: {type: DataTypes.STRING(10), allowNull: true },
		customer_phone: {type: DataTypes.STRING(30), allowNull: true },
		customer_email: {type: DataTypes.STRING(30), allowNull: true },
		vendor: {type: DataTypes.STRING(30), allowNull: true },
		vendor_address: {type: DataTypes.STRING(100), allowNull: true },
		vendor_province: {type: DataTypes.STRING(30), allowNull: true },
		vendor_country: {type: DataTypes.STRING(30), allowNull: true },
		vendor_zipcode: {type: DataTypes.STRING(10), allowNull: true },
		vendor_phone: {type: DataTypes.STRING(30), allowNull: true },
		vendor_email: {type: DataTypes.STRING(30), allowNull: true },
		shipto: {type: DataTypes.STRING(30), allowNull: true },
		shipto_address: {type: DataTypes.STRING(100), allowNull: true },
		shipto_province: {type: DataTypes.STRING(30), allowNull: true },
		shipto_country: {type: DataTypes.STRING(30), allowNull: true },
		shipto_zipcode: {type: DataTypes.STRING(10), allowNull: true },
		shipto_phone: {type: DataTypes.STRING(30), allowNull: true },
		shipto_email: {type: DataTypes.STRING(30), allowNull: true },
		createby: {type: DataTypes.STRING(36), allowNull: true },
		createdate: {type: DataTypes.DATE,allowNull: true},
		approveby: {type: DataTypes.STRING(36), allowNull: true },
		approvedate: {type: DataTypes.DATE,allowNull: true},
		owner_id: {type: DataTypes.STRING(36), allowNull: true },
		assign: {type: DataTypes.TEXT('medium'),allowNull: true},
		create_by: {type: DataTypes.STRING(36), allowNull: true },
		create_date: {type: DataTypes.DATE,allowNull: true},
		update_by: {type: DataTypes.STRING(36), allowNull: true },
		update_date: {type: DataTypes.DATE,allowNull: true}
  },{
    sequelize, tableName: 'purchase_order', timestamps: false, indexes: [{name: "PRIMARY",unique: true,using: "BTREE",fields: [{ name: "id" }]}]
  });
  return purchase_order;
};