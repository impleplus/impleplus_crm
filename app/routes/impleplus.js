/*!
* Builded by Impleplus application builder (https://builder.impleplus.com)
* Version 2.0.0
* Link https://www.impleplus.com
* Copyright impleplus.com
* Licensed under MIT (https://mit-license.org)
*/
var impleplusController = require('../controllers/impleplus-controller.js');
var impleplusHelper = require('../helper/impleplus-helper.js');
var common = require('../lib/common');

module.exports = function (app, passport) {
    app.get('/', impleplusHelper.requireLoggedIn, impleplusController.index);
    app.get('/404', impleplusController.error404);  
    app.get('/500', impleplusController.error500);
    app.get('/503', impleplusController.error503);
    app.get('/505', impleplusController.error505);   
	app.get('/login', impleplusController.login);
	app.post('/login', async (req, res, next) => {
		await passport.authenticate('local', {session: false}, (err, user, info) => {
			if(user){
				const userClaim = {
					id: user.id,
					department_id: user.department_id,
					location_id: user.location_id,
					status_id: user.status_id,
					user_code: user.user_code,
					user_name: user.user_name,
					picture: user.picture==null||user.picture==undefined||user.picture==""?"/static/avatars/default.jpg":user.picture,
					rememberme:req.body.rememberme
				}

				const securityKey = Buffer.from(__config.cookie.securityKey);
				const initVector = Buffer.from(__config.cookie.initVector);
				const encryptData = common.encryptData(securityKey, initVector, JSON.stringify(userClaim));	

				if(userClaim.rememberme){
					res.cookie(__config.cookie.name, encryptData, { domain:__config.cookie.domain, maxAge:  24 * 60 * 60 * 1000 * Number(__config.cookie.maxAge), httpOnly: true });
				}	
				else {
					res.cookie(__config.cookie.name, encryptData, { domain:__config.cookie.domain, httpOnly: true });
				}						

				res.status(200).json({ success: true, redirect:"/" });
			}
			else {
				res.status(200).json({ success: true, message:err})	
			}
		}) (req, res, next);
	});
	app.get('/logout', impleplusController.logout);
  	app.get('/auth', impleplusHelper.requireLoggedIn, impleplusController.authInfo);
	app.post('/auth/save', impleplusHelper.requireLoggedIn, impleplusController.authInfoSave);
	app.get('/auth/password', impleplusHelper.requireLoggedIn, impleplusController.authChangePassword);
	app.post('/auth/password/save', impleplusHelper.requireLoggedIn, impleplusController.authChangePasswordSave);    
	app.post('/assign/save', impleplusHelper.requireLoggedIn, impleplusController.assignSave);
    app.get('/import_datas', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.import_datas);
    app.post('/import_datas', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.import_dataPage);
    app.get('/import_data/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.import_dataEdit);
    app.get('/import_data/template', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.import_dataTemplate);
    app.post('/import_data/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.import_dataSave);
    app.get('/import_data/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.import_dataExport);  
	app.get('/organization/locations', impleplusHelper.requireLoggedIn, impleplusController.locations);
	app.post('/organization/locationpage', impleplusHelper.requireLoggedIn, impleplusController.locationPage);
  	app.get('/organization/location/edit', impleplusHelper.requireLoggedIn, impleplusController.locationEdit);
	app.post('/organization/location/save', impleplusHelper.requireLoggedIn, impleplusController.locationSave);
	app.post('/organization/location/delete', impleplusHelper.requireLoggedIn, impleplusController.locationDelete);
	app.get('/organization/departments', impleplusHelper.requireLoggedIn, impleplusController.departments);
	app.post('/organization/departmentpage', impleplusHelper.requireLoggedIn, impleplusController.departmentPage);
  	app.get('/organization/department/edit', impleplusHelper.requireLoggedIn, impleplusController.departmentEdit);
	app.post('/organization/department/save', impleplusHelper.requireLoggedIn, impleplusController.departmentSave);
	app.post('/organization/department/delete', impleplusHelper.requireLoggedIn, impleplusController.departmentDelete);
	app.get('/organization/teams', impleplusHelper.requireLoggedIn, impleplusController.teams);
	app.post('/organization/teampage', impleplusHelper.requireLoggedIn, impleplusController.teamPage);
  	app.get('/organization/team/edit', impleplusHelper.requireLoggedIn, impleplusController.teamEdit);
	app.post('/organization/team/save', impleplusHelper.requireLoggedIn, impleplusController.teamSave);
	app.post('/organization/team/delete', impleplusHelper.requireLoggedIn, impleplusController.teamDelete);        
	app.get('/users', impleplusHelper.requireLoggedIn, impleplusController.users);
	app.post('/userpage', impleplusHelper.requireLoggedIn, impleplusController.userPage);
	app.get('/user/edit', impleplusHelper.requireLoggedIn, impleplusController.userEdit);
	app.post('/user/delete', impleplusHelper.requireLoggedIn, impleplusController.userDelete);
	app.post('/user/save', impleplusHelper.requireLoggedIn, impleplusController.userSave);
	app.get('/user/roles', impleplusHelper.requireLoggedIn, impleplusController.roles);
	app.post('/user/role/save', impleplusHelper.requireLoggedIn, impleplusController.roleSave);
	app.get('/user/password', impleplusHelper.requireLoggedIn, impleplusController.password);
	app.post('/user/password/save', impleplusHelper.requireLoggedIn, impleplusController.passwordSave);
	app.get('/user/rolebases', impleplusHelper.requireLoggedIn, impleplusController.rolebases);
	app.post('/user/rolebasepage', impleplusHelper.requireLoggedIn, impleplusController.rolebasePage);
  	app.get('/user/rolebase/edit', impleplusHelper.requireLoggedIn, impleplusController.rolebaseEdit);
	app.post('/user/rolebase/delete', impleplusHelper.requireLoggedIn, impleplusController.rolebaseDelete);
	app.post('/user/rolebase/save', impleplusHelper.requireLoggedIn, impleplusController.rolebaseSave);
	app.get('/user/rolebase/access', impleplusHelper.requireLoggedIn, impleplusController.rolebaseAccess);
	app.post('/user/rolebase/access/save', impleplusHelper.requireLoggedIn, impleplusController.rolebaseAccessSave);
	app.get('/user/rolebase/organization', impleplusHelper.requireLoggedIn, impleplusController.rolebaseOrganization);
	app.post('/user/rolebase/organization/save', impleplusHelper.requireLoggedIn, impleplusController.rolebaseOrganizationSave);
	app.post('/activity', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.activityPage);
	app.get('/activity', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.activityAll);
	app.post('/activity/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.activityDelete);
	app.get('/activity/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.activityEdit);
	app.get('/activity/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.activityExport);
	app.post('/activity/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.activitySave);
	app.post('/customer', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.customerPage);
	app.get('/customer', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.customerAll);
	app.post('/customer/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.customerDelete);
	app.get('/customer/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.customerEdit);
	app.get('/customer/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.customerExport);
	app.post('/customer/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.customerSave);
	app.post('/invoice', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.invoicePage);
	app.get('/invoice', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.invoiceAll);
	app.post('/invoice/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.invoiceDelete);
	app.get('/invoice/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.invoiceEdit);
	app.get('/invoice/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.invoiceExport);
	app.post('/invoice/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.invoiceSave);
	app.get('/leads', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.leadsAll);
	app.post('/leads', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.leadsPage);
	app.post('/leads/converttoopportunity', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.convertToOpportunity);
	app.post('/leads/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.leadsDelete);
	app.get('/leads/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.leadsEdit);
	app.get('/leads/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.leadsExport);
	app.post('/leads/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.leadsSave);
	app.post('/opportunity', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.opportunityPage);
	app.get('/opportunity', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.opportunityAll);
	app.post('/opportunity/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.opportunityDelete);
	app.get('/opportunity/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.opportunityEdit);
	app.get('/opportunity/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.opportunityExport);
	app.post('/opportunity/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.opportunitySave);
	app.get('/printform/invoice', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.printInvoice);
	app.get('/printform/quotation', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.printQuotation);
	app.get('/printform/tax', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.printTax);
	app.post('/product', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.productPage);
	app.get('/product', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.productAll);
	app.post('/product/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.productDelete);
	app.get('/product/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.productEdit);
	app.get('/product/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.productExport);
	app.post('/product/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.productSave);
	app.post('/productgroup', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.productgroupPage);
	app.get('/productgroup', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.productgroupAll);
	app.post('/productgroup/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.productgroupDelete);
	app.get('/productgroup/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.productgroupEdit);
	app.get('/productgroup/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.productgroupExport);
	app.post('/productgroup/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.productgroupSave);
	app.post('/quotation', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.quotationPage);
	app.get('/quotation', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.quotationAll);
	app.post('/quotation/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.quotationDelete);
	app.get('/quotation/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.quotationEdit);
	app.get('/quotation/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.quotationExport);
	app.post('/quotation/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.quotationSave);
	app.post('/setting/activitystatus', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.activitystatusPage);
	app.get('/setting/activitystatus', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.activitystatusAll);
	app.post('/setting/activitystatus/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.activitystatusDelete);
	app.get('/setting/activitystatus/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.activitystatusEdit);
	app.get('/setting/activitystatus/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.activitystatusExport);
	app.post('/setting/activitystatus/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.activitystatusSave);
	app.post('/setting/activitytype', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.activitytypePage);
	app.get('/setting/activitytype', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.activitytypeAll);
	app.post('/setting/activitytype/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.activitytypeDelete);
	app.get('/setting/activitytype/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.activitytypeEdit);
	app.get('/setting/activitytype/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.activitytypeExport);
	app.post('/setting/activitytype/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.activitytypeSave);
	app.post('/setting/leadsource', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.leadsourcePage);
	app.get('/setting/leadsource', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.leadsourceAll);
	app.post('/setting/leadsource/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.leadsourceDelete);
	app.get('/setting/leadsource/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.leadsourceEdit);
	app.get('/setting/leadsource/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.leadsourceExport);
	app.post('/setting/leadsource/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.leadsourceSave);
	app.post('/tax', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.taxPage);
	app.get('/tax', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.taxAll);
	app.post('/tax/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.taxDelete);
	app.get('/tax/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.taxEdit);
	app.get('/tax/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.taxExport);
	app.post('/tax/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.taxSave)
}
