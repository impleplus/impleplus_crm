/*! 
* Builded by Impleplus application builder (https://builder.impleplus.com) 
* Version 2.0.0 
* Link https://www.impleplus.com 
* Copyright impleplus.com 
* Licensed under MIT (https://mit-license.org) 
*/ 
var Sequelize = require("sequelize");
var DataTypes = require("sequelize").DataTypes;
var _activity = require("./activity");
var _activitystatus = require("./activitystatus");
var _activitytype = require("./activitytype");
var _casestatus = require("./casestatus");
var _customer = require("./customer");
var _import_data = require("./import_data");
var _invoice = require("./invoice");
var _invoice_item = require("./invoice_item");
var _leads = require("./leads");
var _leadsource = require("./leadsource");
var _opportunity = require("./opportunity");
var _org_department = require("./org_department");
var _org_location = require("./org_location");
var _org_team = require("./org_team");
var _product = require("./product");
var _productgroup = require("./productgroup");
var _purchase_order = require("./purchase_order");
var _purchase_order_item = require("./purchase_order_item");
var _quotation = require("./quotation");
var _quotation_item = require("./quotation_item");
var _receipt = require("./receipt");
var _receipt_item = require("./receipt_item");
var _servicecase = require("./servicecase");
var _tax = require("./tax");
var _tax_item = require("./tax_item");
var _user = require("./user");
var _user_access_base = require("./user_access_base");
var _user_role = require("./user_role");
var _user_role_base = require("./user_role_base");
var _user_role_base_access = require("./user_role_base_access");
var _user_role_base_department = require("./user_role_base_department");
var _user_role_base_location = require("./user_role_base_location");
var _user_role_base_team = require("./user_role_base_team");
var _user_team = require("./user_team");
var _vendor = require("./vendor");


function db(sequelize) {
	var activity = _activity(sequelize, DataTypes);
	var activitystatus = _activitystatus(sequelize, DataTypes);
	var activitytype = _activitytype(sequelize, DataTypes);
	var casestatus = _casestatus(sequelize, DataTypes);
	var customer = _customer(sequelize, DataTypes);
	var import_data = _import_data(sequelize, DataTypes);
	var invoice = _invoice(sequelize, DataTypes);
	var invoice_item = _invoice_item(sequelize, DataTypes);
	var leads = _leads(sequelize, DataTypes);
	var leadsource = _leadsource(sequelize, DataTypes);
	var opportunity = _opportunity(sequelize, DataTypes);
	var org_department = _org_department(sequelize, DataTypes);
	var org_location = _org_location(sequelize, DataTypes);
	var org_team = _org_team(sequelize, DataTypes);
	var product = _product(sequelize, DataTypes);
	var productgroup = _productgroup(sequelize, DataTypes);
	var purchase_order = _purchase_order(sequelize, DataTypes);
	var purchase_order_item = _purchase_order_item(sequelize, DataTypes);
	var quotation = _quotation(sequelize, DataTypes);
	var quotation_item = _quotation_item(sequelize, DataTypes);
	var receipt = _receipt(sequelize, DataTypes);
	var receipt_item = _receipt_item(sequelize, DataTypes);
	var servicecase = _servicecase(sequelize, DataTypes);
	var tax = _tax(sequelize, DataTypes);
	var tax_item = _tax_item(sequelize, DataTypes);
	var user = _user(sequelize, DataTypes);
	var user_access_base = _user_access_base(sequelize, DataTypes);
	var user_role = _user_role(sequelize, DataTypes);
	var user_role_base = _user_role_base(sequelize, DataTypes);
	var user_role_base_access = _user_role_base_access(sequelize, DataTypes);
	var user_role_base_department = _user_role_base_department(sequelize, DataTypes);
	var user_role_base_location = _user_role_base_location(sequelize, DataTypes);
	var user_role_base_team = _user_role_base_team(sequelize, DataTypes);
	var user_team = _user_team(sequelize, DataTypes);
	var vendor = _vendor(sequelize, DataTypes);

    return {
        sequelize,activity,activitystatus,activitytype,casestatus,customer,import_data,invoice,invoice_item,leads,leadsource,opportunity,org_department,org_location,org_team,product,productgroup,purchase_order,purchase_order_item,quotation,quotation_item,receipt,receipt_item,servicecase,tax,tax_item,user,user_access_base,user_role,user_role_base,user_role_base_access,user_role_base_department,user_role_base_location,user_role_base_team,user_team,vendor
    };
}

module.exports = db;
