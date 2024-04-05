
/*! 
* Builded by Impleplus application builder (https://builder.impleplus.com) 
* Version 2.0.0 
* Link https://www.impleplus.com 
* Copyright impleplus.com 
* Licensed under MIT (https://mit-license.org) 
*/ 

module.exports = function(sequelize, DataTypes) {
  var receipt = sequelize.define('receipt', {
		id: { type: DataTypes.STRING(36), allowNull: false, primaryKey: true },
		billto: {type: DataTypes.STRING(30), allowNull: true },
		billto_address: {type: DataTypes.STRING(100), allowNull: true },
		billto_province: {type: DataTypes.STRING(30), allowNull: true },
		billto_country: {type: DataTypes.STRING(30), allowNull: true },
		billto_zipcode: {type: DataTypes.STRING(10), allowNull: true },
		billto_phone: {type: DataTypes.STRING(30), allowNull: true },
		billto_email: {type: DataTypes.STRING(30), allowNull: true },
		shipto: {type: DataTypes.STRING(30), allowNull: true },
		shipto_address: {type: DataTypes.STRING(30), allowNull: true },
		shipto_province: {type: DataTypes.STRING(30), allowNull: true },
		shipto_country: {type: DataTypes.STRING(30), allowNull: true },
		shipto_zipcode: {type: DataTypes.STRING(30), allowNull: true },
		shipto_phone: {type: DataTypes.STRING(30), allowNull: true },
		shipto_email: {type: DataTypes.STRING(30), allowNull: true },
		doc_no: {type: DataTypes.STRING(20), allowNull: true },
		doc_date: {type: DataTypes.DATEONLY,allowNull: true},
		taxid: {type: DataTypes.STRING(20), allowNull: true },
		tax_rate: {type: DataTypes.INTEGER,allowNull: true},
		discount: {type: DataTypes.INTEGER,allowNull: true},
		invoice_id: {type: DataTypes.STRING(36), allowNull: true },
		note: {type: DataTypes.TEXT('medium'),allowNull: true},
		createby: {type: DataTypes.STRING(36), allowNull: true },
		createdate: {type: DataTypes.DATE,allowNull: true},
		approveby: {type: DataTypes.STRING(36), allowNull: true },
		approvedate: {type: DataTypes.DATE,allowNull: true},
		payer: {type: DataTypes.STRING(36), allowNull: true },
		payee: {type: DataTypes.STRING(36), allowNull: true },
		owner_id: {type: DataTypes.STRING(36), allowNull: true },
		assign: {type: DataTypes.TEXT('medium'),allowNull: true},
		create_by: {type: DataTypes.STRING(36), allowNull: true },
		create_date: {type: DataTypes.DATE,allowNull: true},
		update_by: {type: DataTypes.STRING(36), allowNull: true },
		update_date: {type: DataTypes.DATE,allowNull: true}
  },{
    sequelize, tableName: 'receipt', timestamps: false, indexes: [{name: "PRIMARY",unique: true,using: "BTREE",fields: [{ name: "id" }]}]
  });
  return receipt;
};