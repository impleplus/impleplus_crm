/*!
* Builded by Impleplus application builder (https://builder.impleplus.com)
* Version 2.0.0
* Link https://www.impleplus.com
* Copyright impleplus.com
* Licensed under MIT (https://mit-license.org)
*/
var _ = require("lodash");
const common = require('../lib/common');
const moment = require('moment');
var fs = require("fs");
const path = require('path');
const Excel = require('exceljs');
const extract = require('extract-zip');
var mv = require('mv');
var impleplusHelper = require('../helper/impleplus-helper');
const { v4: uuidv4 } = require('uuid');
const store = require('store2');
const db  = require('../models/init-models');
const sequelize = require('../helper/db-connect');
var dbHelper = new (require('../helper/db'))(db(sequelize));

var exports = module.exports = {};
exports.index = async function (req, res, next) {
	try 
	{
		var redirectUrl = req.user.default_url??"";
		if(redirectUrl != "/" && redirectUrl!="." && redirectUrl!="") {
            res.redirect(redirectUrl);
		}
		else {
			res.render('index', { title: "impleplus's Application Builder"});
		}
	}
	catch (err) {
		next(err);
	}
}
exports.error404 = async function (req, res, next) {
	try {
		res.render('error/404', { title: 'Error 404', layout: false });
	}
	catch (err) {
		next(err);
	}
}
exports.error500 = async function (req, res, next) {
	try {
		res.render('error/500', { title: 'Error 500', layout: false });
	}
	catch (err) {
		next(err);
	}
}
exports.error503 = async function (req, res, next) {
	try {
		res.render('error/503', { title: 'Error 503', layout: false });
	}
	catch (err) {
		next(err);
	}
}
exports.error505 = async function (req, res, next) {
	try {
		res.render('error/505', { title: 'Error 505', layout: false });
	}
	catch (err) {
		next(err);
	}
}
exports.assignSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req,"save");
        const tableName = req.body.tableName;
        const [entityData] = await Promise.all([
        	dbHelper.findOne(tableName,{'id':param.id})
        ]);
        var oriAssignsValue = [];
        if(entityData.assign) {
            oriAssignsValue = JSON.parse(entityData.assign);
        }
        var assignsValue = oriAssignsValue;
        var assign_to_id = "";
        if(req.body.assign_to_cat == "department"){
            assign_to_id = req.body.department_id;
        }
        else if(req.body.assign_to_cat == "team"){
            assign_to_id = req.body.team_id;
        }
        else if(req.body.assign_to_cat == "user"){
            assign_to_id = req.body.user_id;
        }
        var fileName = "";
        if (req.files != undefined) {
			if (req.files.file != undefined ) {
				fileName = req.files.file.name;
			}
		}	
        var newId = uuidv4();
        if(req.body.action == "open") {            
            assignsValue.push({
                id:newId,
                date:common.toMySqlDateTimeFormat(new Date()),
                assign_by_id:req.user.id,
                assign_by_name:req.user.user_name,
                assign_to_id:assign_to_id,
                action:req.body.action,
                assign_to_cat:req.body.assign_to_cat,
                reason:req.body.reason,     
                file:fileName
            });
        }
        else if(req.body.action == "cancel") {
            var assignsValue = oriAssignsValue;
            _.remove(assignsValue,{id: req.body.id});
        }
        else if(req.body.action == "accept" || req.body.action == "reject") {
            var index = _.findIndex(assignsValue, {id: req.body.id});
            
            if(index != -1) {
                var updateDate = assignsValue[index];
                updateDate.action = "close";
                assignsValue.splice(index, 1, updateDate);                 
            }
            assignsValue.push({
                id:newId,
                date:common.toMySqlDateTimeFormat(new Date()),
                assign_by_id:req.user.id,
                assign_by_name:req.user.user_name,
                assign_to_id:assign_to_id,
                action:req.body.action,
                assign_to_cat:req.body.assign_to_cat,
                reason:req.body.reason,     
                file:fileName
            });
            if(req.body.action == "accept"){
                await dbHelper.update(tableName,{owner_id:assign_to_id}, {'id':param.id})
            }
        }
        const uploadPath = __config.uploadPath;
		if (req.files != undefined) {
			await common.uploadFile(req.files.file, path.join(uploadPath,newId));
		}
        await dbHelper.update(tableName,{assign:JSON.stringify(assignsValue)},{'id':param.id});
        return res.status(200).json({ success: true, message: 'Assign complete', refresh:true });
    }
    catch (err) {
        next(err);
    }
}
exports.locations = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];                
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }
  
        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [org_locations] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from org_location ${sqlWhere}) totalcount from org_location ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (org_locations.length > 0) { totalcount = org_locations[0].totalcount; } 
		let org_locationsPagination = common.pagination(req, totalcount, paginationNum, page);
		res.render('organization/location/index', { title: 'locations', org_locations, org_locationsPagination,param});
	}
	catch (err) {
		next(err);
	}
}

exports.locationPage = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"page");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];                
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }
         
        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [org_locations] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from org_location ${sqlWhere}) totalcount from org_location ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (org_locations.length > 0) { totalcount = org_locations[0].totalcount; } 
		let org_locationsPagination = common.pagination(req, totalcount, paginationNum, page);
        return res.status(200).json({ success: true, message: '' ,org_locations, org_locationsPagination,param });
	}
	catch (err) {
		next(err);
	}
}
exports.locationEdit = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
        const [org_location] = await Promise.all([
        	param.location!=undefined?dbHelper.findOne("org_location",{'id':param.location}):{}
        ]);
		
		res.render('organization/location/edit', { title: 'location: '+org_location.id,  org_location,param});
	}
	catch (err) {
		next(err);
	}
}
exports.locationDelete = async function (req, res, next) {
    try
    {
        var param = impleplusHelper.getFunctionParams(req,"delete");
        await Promise.all([
			dbHelper.delete("org_department",{'location_id':param.deleteId}),
			dbHelper.delete("org_team",{'location_id':param.deleteId}),
            dbHelper.delete("org_location",{'id':param.deleteId})
        ]);
        return res.status(200).json({ success: true });
    }
    catch (err) {
        next(err);
    }
}
exports.locationSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		var saveData = {
			name: req.body.name,
			address: req.body.address,
			remark: req.body.remark
		}
		var redirect = "";
		if (param.location == undefined) { saveData.id = uuidv4(); redirect = `/organization/location/edit?location=${saveData.id}` }                
        await param.location!=undefined?dbHelper.update("org_location",saveData,{'id':param.location}):dbHelper.create("org_location",saveData);
		return res.status(200).json({ success: true, message: 'Save complete.', param, redirect:redirect });
	}
	catch (err) {
		next(err);
	}
}
exports.departments = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];                
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }

		arrWhere.push(`location_id = '${param.location??""}'`);
		
        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [org_departments] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from org_department ${sqlWhere}) totalcount  from org_department ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (org_departments.length > 0) { totalcount = org_departments[0].totalcount; } 
		let org_departmentsPagination = common.pagination(req, totalcount, paginationNum, page);
		res.render('organization/department/index', { title: 'departments', org_departments:org_departments, org_departmentsPagination:org_departmentsPagination,param});
	}
	catch (err) {
		next(err);
	}
}
exports.departmentPage = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"page");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];                
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }   

		arrWhere.push(`location_id = '${param.location??""}'`);

        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [org_departments] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from org_department ${sqlWhere}) totalcount from org_department ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);

        if (org_departments.length > 0) { totalcount = org_departments[0].totalcount; } 
		let org_departmentsPagination = common.pagination(req, totalcount, paginationNum, page);
        return res.status(200).json({ success: true, message: '' ,org_departments, org_departmentsPagination,param });
	}
	catch (err) {
		next(err);
	}
}
exports.departmentEdit = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
        const [org_department] = await Promise.all([
        	param.id!=undefined?dbHelper.findOne("org_department",{'id':param.id}):{}
        ]);
		res.render('organization/department/edit', { title: 'department: '+org_department.id, param, org_department  });
	}
	catch (err) {
		next(err);
	}
}
exports.departmentSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		var saveData = {
			location_id: param.location,
			name: req.body.name,
			address: req.body.address,
			remark: req.body.remark
		}
		var redirect = "";
		if (param.id == undefined) { saveData.id = uuidv4(); redirect = `/organization/department/edit?location=${param.location}&id=${saveData.id}` }                
        await param.id!=undefined?dbHelper.update("org_department",saveData,{'id':param.id}):dbHelper.create("org_department",saveData);
		return res.status(200).json({ success: true, message: 'Save complete.', param, redirect:redirect });
	}
	catch (err) {
		next(err);
	}
}
exports.departmentDelete = async function (req, res, next) {
    try
    {
        var param = impleplusHelper.getFunctionParams(req,"delete");
        await Promise.all([
            dbHelper.delete("org_department",{'id':param.deleteId})
        ]);
        return res.status(200).json({ success: true });
    }
    catch (err) {
        next(err);
    }
}
exports.teams = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];      
		arrWhere.push(`location_id = '${param.location??""}'`);

        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }

        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }
		
        const [org_teams] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from org_team ${sqlWhere}) totalcount from org_team ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);

        if (org_teams.length > 0) { totalcount = org_teams[0].totalcount; } 
		let org_teamsPagination = common.pagination(req, totalcount, paginationNum, page);
		res.render('organization/team/index', { title: 'teams', org_teams, org_teamsPagination,param});
	}
	catch (err) {
		next(err);
	}
}
exports.teamPage = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"page");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];       
		arrWhere.push(`location_id = '${param.location??""}'`);         
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }
         
        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [org_teams] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from org_team ${sqlWhere}) totalcount from org_team ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);

        if (org_teams.length > 0) { totalcount = org_teams[0].totalcount; } 
		let org_teamsPagination = common.pagination(req, totalcount, paginationNum, page);

        return res.status(200).json({ success: true, message: '' ,org_teams, org_teamsPagination,param});
	}
	catch (err) {
		next(err);
	}
}
exports.teamEdit = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");              
        const [org_team] = await Promise.all([
        	param.id!=undefined?dbHelper.findOne("org_team",{'id':param.id}):{}
        ]);
		res.render('organization/team/edit', { title: 'team: '+org_team.id, param, org_team});
	}
	catch (err) {
		next(err);
	}
}
exports.teamSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		var saveData = {
			location_id: param.location,
			name: req.body.name,
			address: req.body.address,
			remark: req.body.remark
		}
		var redirect = "";
		if (param.id == undefined) { saveData.id = uuidv4(); redirect = `/organization/team/edit?location=${param.location}&id=${saveData.id}` }                
        await param.id!=undefined?dbHelper.update("org_team",saveData,{'id':param.id}):dbHelper.create("org_team",saveData);
		return res.status(200).json({ success: true, message: 'Save complete.', param, redirect:redirect });
	}
	catch (err) {
		next(err);
	}
}

exports.teamDelete = async function (req, res, next) {
    try
    {
        var param = impleplusHelper.getFunctionParams(req,"delete");
        await Promise.all([
            dbHelper.delete("org_team",{'id':param.deleteId})
        ]);
        return res.status(200).json({ success: true});
    }
    catch (err) {
        next(err);
    }
}
exports.login = async function (req, res, next) {
	try
	{
		if(req.user) {
        	return res.redirect('/');
        }
		else {res.render('user/auth/login', { layout : false, title: 'login' });}	
	}
	catch (err) {
		next(err);
	}
}

exports.logout = function (req, res) {	
    res.clearCookie(__config.cookie.name, {domain: __config.cookie.domain});
    store.remove(req.user.id);
	res.redirect('/login');
  };

exports.authInfo = async function (req, res, next) {
	try 
	{
		res.render('user/auth', { title: 'user info'  });
	}
	catch (err) {
		next(err);
	}
}
exports.authInfoSave = async function (req, res, next) {
	try 
	{
		return res.status(200).json({ success: true, message: 'Save complete.' });
	}
	catch (err) {
		next(err);
	}
}
exports.authChangePassword = async function (req, res, next) {
	try 
	{
		res.render('user/password', { title: 'change password' });
	}
	catch (err) {
		next(err);
	}
}
exports.authChangePasswordSave = async function (req, res, next) {
	try 
	{
		return res.status(200).json({ success: true, message: 'Save complete.' })
	}
	catch (err) {
		next(err);
	}
}
exports.users = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];              
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }
   
        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [users] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from user ${sqlWhere}) totalcount  from user ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);

        if (users.length > 0) { totalcount = users[0].totalcount; } 
		let usersPagination = common.pagination(req, totalcount, paginationNum, page);
		res.render('user/user/index', { title: 'Users',	users, usersPagination, param});
	}
	catch (err) {
		next(err);
	}
}
exports.userPage = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"page");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];       
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }

        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [users] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from user ${sqlWhere}) totalcount from user ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (users.length > 0) { totalcount = users[0].totalcount; } 
		let usersPagination = common.pagination(req, totalcount, paginationNum, page);
        return res.status(200).json({ success: true, message: '' ,users, usersPagination, param });
	}
	catch (err) {
		next(err);
	}
}
exports.userEdit = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
        const [user, org_locations, org_departments, org_teams, user_teams] = await Promise.all([
        	param.user!=undefined?dbHelper.findOne("user",{'id':param.user}):{},
			dbHelper.findAll("org_location"),
			dbHelper.findAll("org_department"),
			dbHelper.findAll("org_team"),
			dbHelper.queryAll(`select user_team.*, org_team.name from user_team, org_team where user_team.team_id = org_team.id and user_id = '${param.user}'`)
        ]);
		let uploadPath = __config.uploadPath.concat(req.user.id);
		res.render('user/user/edit', { title: 'user: '+user.id, uploadPath, user, org_locations, org_departments, org_teams, user_teams, param });
	}
	catch (err) {
		next(err);
	}
}
exports.userDelete = async function (req, res, next) {
    try
    {
        var param = impleplusHelper.getFunctionParams(req,"delete");
        await Promise.all([
            dbHelper.delete("user",{'id':param.deleteId})
        ]);
        return res.status(200).json({ success: true});
    }
    catch (err) {
        next(err);
    }
}
exports.userSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		if(req.body.password != undefined && req.body.confirmpassword != undefined ){
			if(req.body.password != req.body.confirmpassword){
				return res.status(200).json({ success: false, message: 'Passwords are not the same !!!' })
			}
		}
		var saveData = {			
			user_code: req.body.user_code,
			user_name: req.body.user_name,
			address: req.body.address,
			email: req.body.email,
			location_id: req.body.location_id,
			department_id: req.body.department_id,
			status_id: req.body.status_id,
			remark: req.body.remark
		}
		if (req.files != undefined) {
			if (req.files.picture != undefined ) {
				saveData.picture = req.files.picture.name;
			}			
		}		
		if (param.user != undefined) {
			await Promise.all([
				dbHelper.delete("user_team",{user_id:param.user})
			]);		
			if(req.body.teams_id != '') {
				var teams_id = JSON.parse(req.body.teams_id);
				for(team_id of teams_id){
					let data = {
						id:uuidv4(),
						user_id:param.user,
						team_id:team_id.data_id
					}
					await dbHelper.create("user_team",data);
				}
			}		
		}	
		var redirect = "";
		if (param.user == undefined) { 
			saveData.id = uuidv4(); 
			saveData.password = impleplusHelper.generateHash(req.body.password);
			redirect = `/user/edit?user=${saveData.id}`;
		}                
        param.user!=undefined? await dbHelper.update("user",saveData,{'id':param.user}):await dbHelper.create("user",saveData);
		const uploadPath = __config.uploadPath;
		if (req.files != undefined) {
			await common.uploadFile(req.files.picture, path.join(uploadPath,saveData.id));	
		}			
		return res.status(200).json({ success: true, message: 'Save complete.', param, redirect:redirect })
	}
	catch (err) {
		next(err);
	}
}
exports.roles = async function (req, res, next) {
	try
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
        const [user_roles, user_role_bases] = await Promise.all([
			dbHelper.queryAll(`select * from user_role where user_id = '${param.user}'`),
			dbHelper.queryAll(`select * from user_role_base`)
        ]);
		for(user_role_base of user_role_bases){
			user_role_base.checked = "";
			if(_.find(user_roles,{role_base_id:user_role_base.id}) != undefined) {
				user_role_base.checked = "checked";
			}
		}
		res.render('user/userrole/index', { title: 'roles', user_roles, user_role_bases, param });
	}
	catch (err) {
		next(err);
	}
}
exports.roleSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		await dbHelper.delete("user_role",{user_id:param.user});
		for(let i=0; i<Object.keys(req.body).length; i++){
			let data = {
				id:uuidv4(),
				user_id:param.user,
				role_base_id:Object.keys(req.body)[i]
			};			
			await dbHelper.create("user_role",data);
		}
		return res.status(200).json({ success: true, message: 'Save complete.' })
	}
	catch (err) {
		next(err);
	}
}
exports.password = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
		res.render('user/user/password', { title: 'password', param  });
	}
	catch (err) {
		next(err);
	}
}
exports.passwordSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		if(req.body.password != undefined && req.body.confirmpassword != undefined ){
			if(req.body.password != req.body.confirmpassword){
				return res.status(200).json({ success: false, message: 'Passwords are not the same !!!' })
			}
		}
		await dbHelper.update("user",{password:impleplusHelper.generateHash(req.body.password)},{'id':param.user});
		return res.status(200).json({ success: true, message: 'Save complete.' })
	}
	catch (err) {
		next(err);
	}
}
exports.rolebases = async function (req, res, next) {
	try
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];                
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }
        
        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [user_role_bases] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from user_role_base ${sqlWhere}) totalcount from user_role_base ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (user_role_bases.length > 0) { totalcount = user_role_bases[0].totalcount; } 
		let user_role_basesPagination = common.pagination(req, totalcount, paginationNum, page);

		res.render('user/rolebase/index', { title: 'user role bases', user_role_bases, user_role_basesPagination, param});
	}
	catch (err) {
		next(err);
	}
}
exports.rolebasePage = async function (req, res, next) {
	try
	{	
        var param = impleplusHelper.getFunctionParams(req,"page");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];                
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }
        
        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [user_role_bases] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from user_role_base ${sqlWhere}) totalcount from user_role_base ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (user_role_bases.length > 0) { totalcount = user_role_bases[0].totalcount; } 
		let user_role_basesPagination = common.pagination(req, totalcount, paginationNum, page);
		return res.status(200).json({ success: true, user_role_bases, user_role_basesPagination, param });
	}
	catch (err) {
		next(err);
	}
}
exports.rolebaseEdit = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
        const [user_role_base] = await Promise.all([
        	param.role!=undefined?dbHelper.findOne("user_role_base",{'id':param.role}):{}
        ]);
		res.render('user/rolebase/edit', { title: 'rolebase: '+user_role_base.id, user_role_base, param });
	}
	catch (err) {
		next(err);
	}
}
exports.rolebaseDelete = async function (req, res, next) {
    try
    {		
        var param = impleplusHelper.getFunctionParams(req,"delete");

		const [user_roles] = await Promise.all([
        	dbHelper.findAll("user_role",{'role_base_id':param.deleteId})
        ]);
		if(user_roles.length > 0){
			return res.status(200).json({ success: false, message:"Can't delete because have someone user uses this role base !!! "});			
		}
		else {
			await Promise.all([
				dbHelper.delete("user_role_base_access",{'role_base_id':param.deleteId}),
				dbHelper.delete("user_role_base_department",{'role_base_id':param.deleteId}),
				dbHelper.delete("user_role_base_location",{'role_base_id':param.deleteId}),
				dbHelper.delete("user_role_base_team",{'role_base_id':param.deleteId}),
				dbHelper.delete("user_role_base",{'id':param.deleteId})
			]);
			return res.status(200).json({ success: true});
		}

    }
    catch (err) {
        next(err);
    }
}
exports.rolebaseSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");  
		var saveData = {
			name: req.body.name,
			default_url: req.body.default_url,
			remark: req.body.remark
		}
		var redirect = "";
		if (param.role == undefined) { saveData.id = uuidv4(); redirect = `/user/rolebase/edit?role=${saveData.id}` }                
        param.role!=undefined? await dbHelper.update("user_role_base",saveData,{'id':param.role}):await dbHelper.create("user_role_base",saveData);
		return res.status(200).json({ success: true, message: 'Save complete.', param, redirect:redirect })
	}
	catch (err) {
		next(err);
	}
}
exports.rolebaseAccess = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
        var [user_access_bases, user_role_base_accesss] = await Promise.all([
            dbHelper.findAll("user_access_base"),
			dbHelper.findAll("user_role_base_access",{"role_base_id":param.role})
        ]);
		res.render('user/rolebaseaccess/index', { title: 'Users', user_access_bases, user_role_base_accesss, param,_:_});
	}
	catch (err) {
		next(err);
	}
}
exports.rolebaseAccessSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		await dbHelper.delete("user_role_base_access",{role_base_id:param.role});
		for(let i=0; i<Object.keys(req.body).length; i++){			
			var keyVals = Object.keys(req.body)[i].split(":");

			let data = {
				id:uuidv4(),
				role_base_id:param.role,
				nav_id:keyVals[0],
				access_base_id:keyVals[1]						
			};					
			await dbHelper.create("user_role_base_access",data);
		}

		return res.status(200).json({ success: true, message: 'Save complete.' })
	}
	catch (err) {
		next(err);
	}
}
exports.rolebaseOrganization = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
        var [org_teams, org_locations, org_departments, user_role_base_departments, user_role_base_locations, user_role_base_teams] = await Promise.all([
			dbHelper.queryAll("select org_team.*, (select name from org_location where org_location.id = org_team.location_id) locationName from org_team"),
			dbHelper.findAll("org_location"),			
			dbHelper.queryAll("select org_department.*, (select name from org_location where org_location.id = org_department.location_id) locationName from org_department"),			
			dbHelper.queryAll(`select user_role_base_department.*, 
			(select name from org_department where org_department.id = user_role_base_department.department_id) departmentName,
			(select name from org_location where org_location.id = org_department.location_id) locationName
			from user_role_base_department, org_department
			where user_role_base_department.department_id = org_department.id and role_base_id = '${param.role}'`),
			dbHelper.queryAll(`select user_role_base_location.*, (select name from org_location where org_location.id = user_role_base_location.location_id) locationName 
			from user_role_base_location where role_base_id = '${param.role}'`),
			dbHelper.queryAll(`select user_role_base_team.*, 
			(select name from org_team where org_team.id = user_role_base_team.team_id) teamName,
			(select name from org_location where org_location.id = org_team.location_id) locationName
			from user_role_base_team, org_team
			where user_role_base_team.team_id = org_team.id and role_base_id = '${param.role}'`)
        ]);
		res.render('user/rolebaseorganization/edit', { title: 'user role bases', org_teams, org_locations, org_departments,user_role_base_departments,user_role_base_locations,user_role_base_teams, param});
	}
	catch (err) {
		next(err);
	}
}
exports.rolebaseOrganizationSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		await Promise.all([
			dbHelper.delete("user_role_base_location",{role_base_id:param.role}),
			dbHelper.delete("user_role_base_department",{role_base_id:param.role}),
			dbHelper.delete("user_role_base_team",{role_base_id:param.role}),
		]);
		if(req.body.locations_id != '') {
			var locations_id = JSON.parse(req.body.locations_id);
			for(location_id of locations_id){
				let data = {
					id:uuidv4(),
					role_base_id:param.role,
					location_id:location_id.data_id
				}
				await dbHelper.create("user_role_base_location",data);
			}
		}
		if(req.body.departments_id != ''){
			var departments_id = JSON.parse(req.body.departments_id);
			for(department_id of departments_id){
				let data = {
					id:uuidv4(),
					role_base_id:param.role,
					department_id:department_id.data_id
				}
				await dbHelper.create("user_role_base_department",data);
			}		
		}
		if(req.body.teams_id != '') {
			var teams_id = JSON.parse(req.body.teams_id);
			for(team_id of teams_id){
				let data = {
					id:uuidv4(),
					role_base_id:param.role,
					team_id:team_id.data_id
				}
				await dbHelper.create("user_role_base_team",data);
			}
		}
		return res.status(200).json({ success: true, message: 'Save complete.', param })
	}
	catch (err) {
		next(err);
	}
}
exports.import_dataPage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req,"page");
		let paginationNum = __config.paginationNum;
		let page = Number(req.body.page) || 1;
		let totalcount = 0;
        const [import_datas] = await Promise.all([
			dbHelper.queryAll(`select *, (select user.user_name from user where user.id = import_by) import_by_name, (select count(id) from import_data where table_name like '%${param.qimport_datas??""}%' ) totalcount  from import_data where table_name like '%${param.qimport_datas??""}%'  limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (import_datas.length > 0) { totalcount = import_datas[0].totalcount; }
		let import_datasPagination = common.pagination(req, totalcount, paginationNum, page);
        return res.status(200).json({ success: true, message:'', param , import_datas, import_datasPagination });
    }
    catch (err) {
        next(err);
    }
}
exports.import_datas = async function (req, res, next) {
    try 
    {
		const uploadPath = __config.uploadPath;
		
        var param = impleplusHelper.getFunctionParams(req,"get");
		let paginationNum = __config.paginationNum;
		let page = Number(req.body.page) || 1;
		let totalcount = 0;
        const [import_datas] = await Promise.all([
			dbHelper.queryAll(`select *, (select user.user_name from user where user.id = import_by) import_by_name, (select count(id) from import_data where table_name like '%${param.qimport_datas??""}%' ) totalcount  from import_data where table_name like '%${param.qimport_datas??""}%'  limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (import_datas.length > 0) { totalcount = import_datas[0].totalcount; }
		let import_datasPagination = common.pagination(req, totalcount, paginationNum, page);
        res.render('import_data/list', { title: 'Imports', uploadPath:uploadPath, param, import_datas, import_datasPagination } );
    }
    catch (err) {
        next(err);
    }
}
exports.import_dataEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req,"get");
        const importTables = __config.importTables;
        var sqlWhere = importTables.map(item => `table_name='${item}'`).join(" or ");
        const [table_columns] = await Promise.all([
			dbHelper.queryAll(`select table_name, column_name from information_schema.columns where table_schema = '${__config.database.database}' and (${sqlWhere}) `)
        ]);       
        const uploadPath = __config.uploadPath;
        res.render('import_data/edit', { title: 'Imports', uploadPath, param, importTables, table_columns} );
    }
    catch (err) {
        next(err);
    }
}
exports.import_dataTemplate = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req,"get");
        var sql = `select * from #grave#${param.tableName}#grave# limit ${__config.exportRecord}`.replace(/#grave#/ig,"`");
        var [dataTemplates] = await Promise.all([
            dbHelper.queryAll(sql)
        ]);
        res.writeHead(200, {
            'Content-Disposition': `attachment; filename="import-tempate-${param.tableName}.xlsx"`,
            'Transfer-Encoding': 'chunked',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const workbook = new Excel.stream.xlsx.WorkbookWriter({ stream: res });
        const worksheet = workbook.addWorksheet(param.tableName);
        let worksheet_header = [];
        if (dataTemplates.length > 0) {
            let record = dataTemplates[0];
            for(let i=0; i< Object.keys(record).length; i++){
                var findIngoreColumn = __config.ignore.exportColumns.find((el) => el == Object.keys(record)[i]);
                if(findIngoreColumn == undefined ) {
                    worksheet_header.push({ header: Object.keys(record)[i], key: Object.keys(record)[i] });                
                }
            }
        }
        worksheet.columns = worksheet_header;
        dataTemplates.forEach(record => {
            let row = {};
            for(let i=0; i< Object.keys(record).length; i++){
                var findIngoreColumn = __config.ignore.exportColumns.find((el) => el == Object.keys(record)[i]);
                if(findIngoreColumn == undefined ) {
                    row[Object.keys(record)[i]] = Object.values(record)[i];             
                }
            }
            worksheet.addRow(row).commit();
        });
        worksheet.commit();
        workbook.commit();	     
		
    }
    catch (err) {
        next(err);
    }
}
exports.import_dataSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req,"save");
        var tableName = req.body.importTable;
        var tempTableName = common.randomText();
        const [columns] = await Promise.all([
			dbHelper.queryAll(`SHOW COLUMNS FROM ${tableName}`)
        ]);   
        if (req.files != undefined && req.body.importTable != "") {
            const uploadPath = __config.uploadPath;
            if (req.files != undefined) {
				await common.uploadFile(req.files.fileupload, path.join(uploadPath,req.user.id));
            }            
			const fileName = `${__basedir}/app/public/${uploadPath.concat("/",req.user.id,"/",req.files.fileupload.name)}`;
            const wb = new Excel.Workbook();
            var fieldNames = [];            
            var fieldRowValues = [];
            await wb.xlsx.readFile(fileName).then(() => {
                var sheet = wb.getWorksheet(wb.worksheets[0].name);
                rowTotal = sheet.actualRowCount-1;
                for (var i = 1; i <= sheet.actualRowCount; i++) {
                    var fieldValues = [];
                    for (var j = 1; j <= sheet.actualColumnCount; j++) {
                        data = sheet.getRow(i).getCell(j).toString();
                        if(i==1) {
                            fieldNames.push(data);
                        }
                        else {
                            const findColumn = _.find(columns, {Field:fieldNames[j-1].toLowerCase()});
                            if(findColumn!= undefined){
                                if(findColumn.Type.includes("varchar(36)")){
                                    if(data == "UUID()"){
                                        fieldValues.push(`${data}`);
                                    }
                                    else {
                                        fieldValues.push(`'${data}'`);
                                    }                                    
                                }
                                else if(findColumn.Type.includes("varchar")){
                                    fieldValues.push(`'${data}'`);
                                }
                                else if(findColumn.Type.includes("text")){
                                    fieldValues.push(`'${data}'`);
                                }                                
                                else if(findColumn.Type.includes("datetime")){
                                    if(moment(data).isValid())
                                    {                                        
                                        var dateValue = moment(data).format('YYYY-MM-DD');
                                        fieldValues.push(`'${dateValue}'`);
                                    }
                                    else {
                                        fieldValues.push(`null`);
                                    }
                                }
                                else if(findColumn.Type.includes("int")){
                                    fieldValues.push(`${data}`);
                                }
                                else {
                                    fieldValues.push(`null`);
                                }
                            }
                        }
                    }
                    if(i!= 1){
                        fieldValues.push("UUID()");
                        fieldValues.push(`'${req.user.id}'`);
                        fieldValues.push(`'${req.user.id}'`);
                        fieldValues.push(`'${moment(new Date()).format('YYYY-MM-DD')}'`);
                    }


                    if(fieldValues.length != 0){
                        fieldRowValues.push("("+fieldValues.join(",")+")");
                    }
                }
            });
            fieldNames.push("id");
            fieldNames.push("owner_id");
            fieldNames.push("create_by");
            fieldNames.push("create_date");
            var sqlNameInsertTemp = `(${fieldNames.join(",")})`;
            var sqlValueInsertTemp = `${fieldRowValues.join(",")}`;
            var checkDupColumns = "";
            if(req.body.checkDupColumns != ""){
                checkDupColumns = JSON.parse(req.body.checkDupColumns).map(item=>item.value).join(",");
            }
            var sqlcheckDup = "";
            if(checkDupColumns != ""){
                sqlcheckDup = ` where (${checkDupColumns}) not in (select ${checkDupColumns} from ${tableName})`;
            }
            await dbHelper.execute(`CREATE TEMPORARY TABLE IF NOT EXISTS ${tempTableName} select * from ${tableName} limit 0`);
            await dbHelper.execute(`insert into ${tempTableName} ${sqlNameInsertTemp} values ${sqlValueInsertTemp}`); 
            await dbHelper.execute(`insert into ${tableName} select * from ${tempTableName} ${sqlcheckDup}`);
            await dbHelper.execute(`DROP TEMPORARY TABLE IF EXISTS ${tempTableName}`);
            var importData = {
                id:uuidv4(),
                table_name:tableName,
                import_by:req.user.id,
                import_date:new Date(),
                import_status:0,
                message:"Sucess"
            };
            await dbHelper.create("import_data",importData);
            fs.unlinkSync(fileName);
        }
        return res.status(200).json({ success: true, refresh:true, message:'Save complete.', param });
    }
    catch (err) {
            var importData = {
				id:uuidv4(),
                table_name:tableName,
                import_by:req.user.id,
                import_date:new Date(),
                import_status:1,
                message:err.message
            };
            await dbHelper.create("import_data",importData);        
        next(err);
    }
}

exports.import_dataExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req,"get");
        const [import_datas] = await Promise.all([
			dbHelper.queryAll(`select * from import_data where table_name like '%${param.qimport_datas}%' `)
        ]);
        res.writeHead(200, {
            'Content-Disposition': 'attachment; filename="import_datas-'+common.stampTime+'.xlsx"',
            'Transfer-Encoding': 'chunked',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const workbook = new Excel.stream.xlsx.WorkbookWriter({ stream: res });
        const worksheet = workbook.addWorksheet('Sheet1');
        let worksheet_header = [];			
        if (import_datas.length > 0) {
            let record = import_datas[0];
            for(let i=0; i< Object.keys(record).length; i++){
                worksheet_header.push({ header: Object.keys(record)[i], key: Object.keys(record)[i] });
            }
        }
        worksheet.columns = worksheet_header;
        import_datas.forEach(record => {
            let row = {};
            for(let i=0; i< Object.keys(record).length; i++){
                row[Object.keys(record)[i]] = Object.values(record)[i];
            }            
            worksheet.addRow(row).commit();
        });
        worksheet.commit();
        workbook.commit();	        
    }
    catch (err) {
        next(err);
    }
}


exports.activityDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [activityRecord] = await Promise.all([
			dbHelper.delete("activity",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.activityExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereactivityRecords = [];                
        
        if(sqlParam != ""){
            arrWhereactivityRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereactivityRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereactivityRecords = "";
        if(arrWhereactivityRecords.length>0){
            sqlWhereactivityRecords = `  where  ${arrWhereactivityRecords.join(" and ")??""}`;
        }
    

		var [activityRecords] = await Promise.all([
			dbHelper.queryAll(`select * from activity ${sqlWhereactivityRecords}`) 
		]);

        common.exportXls(res, "activityRecords-"+common.stampTime, "Sheet1", activityRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.activityPage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereactivityRecords = [];                
        
        if(sqlParam != ""){
            arrWhereactivityRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereactivityRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereactivityRecords = "";
        if(arrWhereactivityRecords.length>0){
            sqlWhereactivityRecords = `  where  ${arrWhereactivityRecords.join(" and ")??""}`;
        }
    

		var [activityRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from activity ${sqlWhereactivityRecords}) totalcount  from activity ${sqlWhereactivityRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (activityRecords.length > 0) { totalcount = activityRecords[0].totalcount; }
        let activityRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,activityRecords,activityRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.activityAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereactivityRecords = [];                
        
        if(sqlParam != ""){
            arrWhereactivityRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereactivityRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereactivityRecords = "";
        if(arrWhereactivityRecords.length>0){
            sqlWhereactivityRecords = `  where  ${arrWhereactivityRecords.join(" and ")??""}`;
        }
    

		var [activityRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from activity ${sqlWhereactivityRecords}) totalcount  from activity ${sqlWhereactivityRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (activityRecords.length > 0) { totalcount = activityRecords[0].totalcount; }
        let activityRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('activity/list', { title: `Activities`, param ,activityRecords,activityRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}

exports.invoiceEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [invoiceRecord,invoice_itemRecords] = await Promise.all([
			param.id!=undefined?dbHelper.findOne("invoice",{"id":param.id??""},[]):{},
			dbHelper.findAll("invoice_item",{"invoice_id":param.id??""},[]) 
		]);

        res.render('invoice/edit', { title: `Invoice: ${invoiceRecord.id??""}`, param ,invoiceRecord,invoice_itemRecords });
    }
    catch (err) {
        next(err);
    }
}

exports.invoiceSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var invoiceData = {
			billto: req.body.billto||null,
			billto_address: req.body.billto_address||null,
			billto_province: req.body.billto_province||null,
			billto_country: req.body.billto_country||null,
			billto_zipcode: req.body.billto_zipcode||null,
			billto_phone: req.body.billto_phone||null,
			billto_email: req.body.billto_email||null,
			shipto: req.body.shipto||null,
			shipto_address: req.body.shipto_address||null,
			shipto_province: req.body.shipto_province||null,
			shipto_country: req.body.shipto_country||null,
			shipto_zipcode: req.body.shipto_zipcode||null,
			shipto_phone: req.body.shipto_phone||null,
			shipto_email: req.body.shipto_email||null,
			doc_no: req.body.doc_no||null,
			doc_date: common.toDateFormat(req.body.doc_date,'DD/MM/YYYY','YYYY-MM-DD'),
			taxid: req.body.taxid||null,
			tax_rate: req.body.tax_rate||0,
			discount: req.body.discount||0,
			duedate: common.toDateFormat(req.body.duedate,'DD/MM/YYYY','YYYY-MM-DD'),
			note: req.body.note||null 
		};
                
		var newinvoiceId = uuidv4(); 
        if (param.id == undefined) {
            invoiceData.id = newinvoiceId;
            invoiceData.owner_id = req.user.id;
            invoiceData.create_by = req.user.id;
            invoiceData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            invoiceData.update_by = req.user.id;
            invoiceData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		if(req.body["datasheet_HejFfS"] != undefined && req.body["datasheet_HejFfS"] != ""){
            var datasheet_HejFfSItems = JSON.parse(req.body["datasheet_HejFfS"]);
            var datasheet_HejFfSData = {};
            if (param.id == undefined) {
                datasheet_HejFfSData.invoice_id = newinvoiceId;
            }
            else {
                datasheet_HejFfSData.invoice_id = param.id;
            };
            await dbHelper.delete("invoice_item",{invoice_id:datasheet_HejFfSData.invoice_id});
            for(let datasheet_HejFfSItem of datasheet_HejFfSItems){
                datasheet_HejFfSData.id = uuidv4();
				datasheet_HejFfSData.product_id = datasheet_HejFfSItem.product_id||null;
				datasheet_HejFfSData.product_name = datasheet_HejFfSItem.product_name||null;
				datasheet_HejFfSData.quantity = datasheet_HejFfSItem.quantity||0;
				datasheet_HejFfSData.unitprice = datasheet_HejFfSItem.unitprice||0;
				datasheet_HejFfSData.total = datasheet_HejFfSItem.total||0;
                if (param.id == undefined) {
                    datasheet_HejFfSData.owner_id = req.user.id;
                    datasheet_HejFfSData.create_by = req.user.id;
                    datasheet_HejFfSData.create_date = common.toMySqlDateTimeFormat(new Date());                                
                }
                else {
                    datasheet_HejFfSData.update_by = req.user.id;
                    datasheet_HejFfSData.update_date = common.toMySqlDateTimeFormat(new Date());   
                }
                await dbHelper.create("invoice_item",datasheet_HejFfSData);
            } 
        }

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/invoice/edit?id=${newinvoiceId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [invoiceRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("invoice",invoiceData,{"id":param.id??""}):dbHelper.create("invoice",invoiceData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.customerDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [customerRecord] = await Promise.all([
			dbHelper.delete("customer",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.customerExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWherecustomerRecords = [];                
        
        if(sqlParam != ""){
            arrWherecustomerRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWherecustomerRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWherecustomerRecords = "";
        if(arrWherecustomerRecords.length>0){
            sqlWherecustomerRecords = `  where  ${arrWherecustomerRecords.join(" and ")??""}`;
        }
    

		var [customerRecords] = await Promise.all([
			dbHelper.queryAll(`select * from customer ${sqlWherecustomerRecords}`) 
		]);

        common.exportXls(res, "customerRecords-"+common.stampTime, "Sheet1", customerRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.customerPage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWherecustomerRecords = [];                
        
        if(sqlParam != ""){
            arrWherecustomerRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWherecustomerRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWherecustomerRecords = "";
        if(arrWherecustomerRecords.length>0){
            sqlWherecustomerRecords = `  where  ${arrWherecustomerRecords.join(" and ")??""}`;
        }
    

		var [customerRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from customer ${sqlWherecustomerRecords}) totalcount  from customer ${sqlWherecustomerRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (customerRecords.length > 0) { totalcount = customerRecords[0].totalcount; }
        let customerRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,customerRecords,customerRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.customerAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWherecustomerRecords = [];                
        
        if(sqlParam != ""){
            arrWherecustomerRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWherecustomerRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWherecustomerRecords = "";
        if(arrWherecustomerRecords.length>0){
            sqlWherecustomerRecords = `  where  ${arrWherecustomerRecords.join(" and ")??""}`;
        }
    

		var [customerRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from customer ${sqlWherecustomerRecords}) totalcount  from customer ${sqlWherecustomerRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (customerRecords.length > 0) { totalcount = customerRecords[0].totalcount; }
        let customerRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('customer/list', { title: `Customer`, param ,customerRecords,customerRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}

exports.productEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [productRecord] = await Promise.all([
			param.id!=undefined?dbHelper.queryOne(`select product.*, (select name from productgroup where productgroup.id = productgroup_id) productgroup_text from product where id = "${param.id??""}"`,{},{}):{} 
		]);

        res.render('product/edit', { title: `Product: ${productRecord.id??""}`, param ,productRecord });
    }
    catch (err) {
        next(err);
    }
}

exports.productSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var productData = {
			productgroup_id: req.body.productgroup_id||null,
			code: req.body.code||null,
			name: req.body.name||null,
			vendor: req.body.vendor||null,
			price_manufactory: req.body.price_manufactory||0,
			price_sale: req.body.price_sale||0,
			note: req.body.note||null 
		};
                
		var newproductId = uuidv4(); 
        if (param.id == undefined) {
            productData.id = newproductId;
            productData.owner_id = req.user.id;
            productData.create_by = req.user.id;
            productData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            productData.update_by = req.user.id;
            productData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/product/edit?id=${newproductId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [productRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("product",productData,{"id":param.id??""}):dbHelper.create("product",productData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.customerEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        
        var arrWhereactivityRecords = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereactivityRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereactivityRecords = "";
        if(arrWhereactivityRecords.length>0){
            sqlWhereactivityRecords = `  and  ${arrWhereactivityRecords.join(" and ")??""}`;
        }
    

		var [customerRecord,activityRecords] = await Promise.all([
			param.id!=undefined?dbHelper.findOne("customer",{"id":param.id??""},[]):{},
			dbHelper.queryAll(`select activity.*, (select name from activitystatus where activitystatus.id = activitystatus_id) activitystatus_text from activity where customer_id = "${param.id??""}" ${sqlWhereactivityRecords}`) 
		]);

        res.render('customer/edit', { title: `Customer: ${customerRecord.id??""}`, param ,customerRecord,activityRecords });
    }
    catch (err) {
        next(err);
    }
}

exports.customerSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var customerData = {
			customer_type: req.body.customer_type||0,
			taxid: req.body.taxid||null,
			gender: req.body.gender||null,
			firstname: req.body.firstname||null,
			lastname: req.body.lastname||null,
			dateofbirth: common.toDateFormat(req.body.dateofbirth,'DD/MM/YYYY','YYYY-MM-DD'),
			address: req.body.address||null,
			province: req.body.province||null,
			country: req.body.country||null,
			zipcode: req.body.zipcode||null,
			contact: req.body.contact||null,
			phone: req.body.phone||null,
			email: req.body.email||null,
			interest: req.body.interest||null,
			note: req.body.note||null,
			bankaccount: req.body.bankaccount||null 
		};
                
		var newcustomerId = uuidv4(); 
        if (param.id == undefined) {
            customerData.id = newcustomerId;
            customerData.owner_id = req.user.id;
            customerData.create_by = req.user.id;
            customerData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            customerData.update_by = req.user.id;
            customerData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/customer/edit?id=${newcustomerId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [customerRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("customer",customerData,{"id":param.id??""}):dbHelper.create("customer",customerData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.activityEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [activityRecord,objectRecord] = await Promise.all([
			dbHelper.queryOne(`select *,  (select name from activitytype where activitytype.id = activitytype_id) activitytype_text,  (select name from activitystatus where activitystatus.id = activitystatus_id) activitystatus_text   from activity where id = '${param.id??""}'`,{},{}),
			dbHelper.queryOne(`select ${param.object=="leads"?'concat(COALESCE(firstname,"")," ",COALESCE(lastname,""))':param.object=="opportunity"?'concat(COALESCE(firstname,"")," ",COALESCE(lastname,""))':param.object=="customer"?'concat(COALESCE(companyname,"")," ",COALESCE(firstname,"")," ",COALESCE(lastname,""))':'subject'} object_name from ${param.object} where id = '${param.objectid}'`,{},{}) 
		]);

        res.render('activity/edit', { title: `Activity: ${activityRecord.id??""}`, param ,activityRecord,objectRecord });
    }
    catch (err) {
        next(err);
    }
}

exports.activitySave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var activityData = {
			lead_id: param.object=="leads"?param.objectid:null,
			opportunity_id: param.object=="opportunity"?param.objectid:null,
			customer_id: param.object=="customer"?param.objectid:null,
			case_id: param.object=="servicecase"?param.objectid:null,
			activitytype_id: req.body.activitytype_id||null,
			duedate: common.toDateFormat(req.body.duedate,'DD/MM/YYYY','YYYY-MM-DD'),
			activitystatus_id: req.body.activitystatus_id||null,
			detail: req.body.detail||null,
			note: req.body.note||null 
		};
                
		var newactivityId = uuidv4(); 
        if (param.id == undefined) {
            activityData.id = newactivityId;
            activityData.owner_id = req.user.id;
            activityData.create_by = req.user.id;
            activityData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            activityData.update_by = req.user.id;
            activityData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/activity/edit?id=${newactivityId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [activityRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("activity",activityData,{"id":param.id??""}):dbHelper.create("activity",activityData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.opportunityDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [opportunityRecord] = await Promise.all([
			dbHelper.delete("opportunity",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.opportunityExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereopportunityRecords = [];                
        
        if(sqlParam != ""){
            arrWhereopportunityRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereopportunityRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereopportunityRecords = "";
        if(arrWhereopportunityRecords.length>0){
            sqlWhereopportunityRecords = `  where  ${arrWhereopportunityRecords.join(" and ")??""}`;
        }
    

		var [opportunityRecords] = await Promise.all([
			dbHelper.queryAll(`select * from opportunity ${sqlWhereopportunityRecords}`) 
		]);

        common.exportXls(res, "opportunityRecords-"+common.stampTime, "Sheet1", opportunityRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.opportunityPage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereopportunityRecords = [];                
        
        if(sqlParam != ""){
            arrWhereopportunityRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereopportunityRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereopportunityRecords = "";
        if(arrWhereopportunityRecords.length>0){
            sqlWhereopportunityRecords = `  where  ${arrWhereopportunityRecords.join(" and ")??""}`;
        }
    

		var [opportunityRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from opportunity ${sqlWhereopportunityRecords}) totalcount  from opportunity ${sqlWhereopportunityRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (opportunityRecords.length > 0) { totalcount = opportunityRecords[0].totalcount; }
        let opportunityRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,opportunityRecords,opportunityRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.opportunityAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereopportunityRecords = [];                
        
        if(sqlParam != ""){
            arrWhereopportunityRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereopportunityRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereopportunityRecords = "";
        if(arrWhereopportunityRecords.length>0){
            sqlWhereopportunityRecords = `  where  ${arrWhereopportunityRecords.join(" and ")??""}`;
        }
    

		var [opportunityRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from opportunity ${sqlWhereopportunityRecords}) totalcount  from opportunity ${sqlWhereopportunityRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (opportunityRecords.length > 0) { totalcount = opportunityRecords[0].totalcount; }
        let opportunityRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('opportunity/list', { title: `Opportunity`, param ,opportunityRecords,opportunityRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}

exports.opportunityEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        
        var arrWhereactivityRecords = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereactivityRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereactivityRecords = "";
        if(arrWhereactivityRecords.length>0){
            sqlWhereactivityRecords = `  and  ${arrWhereactivityRecords.join(" and ")??""}`;
        }
    

		var [opportunityRecord,activityRecords] = await Promise.all([
			param.id!=undefined?dbHelper.queryOne(`select opportunity.*, (select concat(firstname,lastname) from leads where leads.id = lead_id) lead_text from opportunity where id = "${param.id??""}"`,{},{}):{},
			dbHelper.queryAll(`select activity.*, (select name from activitystatus where activitystatus.id = activitystatus_id) activitystatus_text from activity where opportunity_id = "${param.id??""}" ${sqlWhereactivityRecords}`) 
		]);

        res.render('opportunity/edit', { title: `Opportunity: ${opportunityRecord.id??""}`, param ,opportunityRecord,activityRecords });
    }
    catch (err) {
        next(err);
    }
}

exports.opportunitySave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var opportunityData = {
			gender: req.body.gender||null,
			firstname: req.body.firstname||null,
			lastname: req.body.lastname||null,
			dateofbirth: common.toDateFormat(req.body.dateofbirth,'DD/MM/YYYY','YYYY-MM-DD'),
			address: req.body.address||null,
			province: req.body.province||null,
			country: req.body.country||null,
			zipcode: req.body.zipcode||null,
			contact: req.body.contact||null,
			phone: req.body.phone||null,
			email: req.body.email||null,
			interest: req.body.interest||null,
			note: req.body.note||null,
			lead_id: req.body.lead_id||null 
		};
                
		var newopportunityId = uuidv4(); 
        if (param.id == undefined) {
            opportunityData.id = newopportunityId;
            opportunityData.owner_id = req.user.id;
            opportunityData.create_by = req.user.id;
            opportunityData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            opportunityData.update_by = req.user.id;
            opportunityData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/opportunity/edit?id=${newopportunityId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [opportunityRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("opportunity",opportunityData,{"id":param.id??""}):dbHelper.create("opportunity",opportunityData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.printTax = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        
        var arrWhereitems = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereitems.push(sqlWhereDataPrivilege);
        }
        var sqlWhereitems = "";
        if(arrWhereitems.length>0){
            sqlWhereitems = `  and  ${arrWhereitems.join(" and ")??""}`;
        }
    

		var [data,items,summaryItem] = await Promise.all([
			param.id!=undefined?dbHelper.queryOne(`select tax.* from tax where tax.id = '${param.id}'`,{},{}):{},
			dbHelper.queryAll(`select * from tax_item where tax_id = "${param.id}" ${sqlWhereitems}`),
			param.id!=undefined?dbHelper.queryOne(`select sum(total) subtotal, tax_rate, (sum(total)*tax_rate/100) taxtotal, ( sum(total) + (sum(total)*tax_rate/100)  ) total from tax_item,tax where tax.id = tax_item.tax_id and tax.id = '${param.id}'`,{},{}):{} 
		]);

        res.render('printform/tax/print', { title: `Print Tax`, param ,data,items,summaryItem });
    }
    catch (err) {
        next(err);
    }
}

exports.printQuotation = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        
        var arrWhereitems = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereitems.push(sqlWhereDataPrivilege);
        }
        var sqlWhereitems = "";
        if(arrWhereitems.length>0){
            sqlWhereitems = `  and  ${arrWhereitems.join(" and ")??""}`;
        }
    

		var [data,items,summaryItem] = await Promise.all([
			param.id!=undefined?dbHelper.queryOne(`select quotation.*, concat(COALESCE(firstname,"")," ",COALESCE(lastname,"")) customer_name from quotation, customer where quotation.customer_id = customer.id and quotation.id = '${param.id}'`,{},{}):{},
			dbHelper.queryAll(`select * from quotation_item where quotation_id = "${param.id}" ${sqlWhereitems}`),
			param.id!=undefined?dbHelper.queryOne(`select sum(total) subtotal, tax_rate, (sum(total)*tax_rate/100) taxtotal, ( sum(total) + (sum(total)*tax_rate/100)  ) total from quotation_item,quotation where quotation.id = quotation_item.quotation_id and quotation.id = '${param.id}'`,{},{}):{} 
		]);

        res.render('printform/quotation/print', { title: `Print Quotation`, param ,data,items,summaryItem });
    }
    catch (err) {
        next(err);
    }
}

exports.invoiceDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [invoiceRecord] = await Promise.all([
			dbHelper.delete("invoice",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.invoiceExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereinvoiceRecords = [];                
        
        if(sqlParam != ""){
            arrWhereinvoiceRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereinvoiceRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereinvoiceRecords = "";
        if(arrWhereinvoiceRecords.length>0){
            sqlWhereinvoiceRecords = `  where  ${arrWhereinvoiceRecords.join(" and ")??""}`;
        }
    

		var [invoiceRecords] = await Promise.all([
			dbHelper.queryAll(`select * from invoice ${sqlWhereinvoiceRecords}`) 
		]);

        common.exportXls(res, "invoiceRecords-"+common.stampTime, "Sheet1", invoiceRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.invoicePage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereinvoiceRecords = [];                
        
        if(sqlParam != ""){
            arrWhereinvoiceRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereinvoiceRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereinvoiceRecords = "";
        if(arrWhereinvoiceRecords.length>0){
            sqlWhereinvoiceRecords = `  where  ${arrWhereinvoiceRecords.join(" and ")??""}`;
        }
    

		var [invoiceRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from invoice ${sqlWhereinvoiceRecords}) totalcount  from invoice ${sqlWhereinvoiceRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (invoiceRecords.length > 0) { totalcount = invoiceRecords[0].totalcount; }
        let invoiceRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,invoiceRecords,invoiceRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.invoiceAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereinvoiceRecords = [];                
        
        if(sqlParam != ""){
            arrWhereinvoiceRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereinvoiceRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereinvoiceRecords = "";
        if(arrWhereinvoiceRecords.length>0){
            sqlWhereinvoiceRecords = `  where  ${arrWhereinvoiceRecords.join(" and ")??""}`;
        }
    

		var [invoiceRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from invoice ${sqlWhereinvoiceRecords}) totalcount  from invoice ${sqlWhereinvoiceRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (invoiceRecords.length > 0) { totalcount = invoiceRecords[0].totalcount; }
        let invoiceRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('invoice/list', { title: `Invoice`, param ,invoiceRecords,invoiceRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}

exports.printInvoice = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        
        var arrWhereitems = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereitems.push(sqlWhereDataPrivilege);
        }
        var sqlWhereitems = "";
        if(arrWhereitems.length>0){
            sqlWhereitems = `  and  ${arrWhereitems.join(" and ")??""}`;
        }
    

		var [data,items,summaryItem] = await Promise.all([
			param.id!=undefined?dbHelper.queryOne(`select invoice.* from invoice where invoice.id = '${param.id}'`,{},{}):{},
			dbHelper.queryAll(`select * from invoice_item where invoice_id = "${param.id}" ${sqlWhereitems}`),
			param.id!=undefined?dbHelper.queryOne(`select sum(total) subtotal, tax_rate, (sum(total)*tax_rate/100) taxtotal, ( sum(total) + (sum(total)*tax_rate/100)  ) total from invoice_item,invoice where invoice.id = invoice_item.invoice_id and invoice.id = '${param.id}'`,{},{}):{} 
		]);

        res.render('printform/invoice/print', { title: `Print Invoice`, param ,data,items,summaryItem });
    }
    catch (err) {
        next(err);
    }
}

exports.taxEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [taxRecord,tax_itemRecords] = await Promise.all([
			param.id!=undefined?dbHelper.findOne("tax",{"id":param.id??""},[]):{},
			dbHelper.findAll("tax_item",{"tax_id":param.id??""},[]) 
		]);

        res.render('tax/edit', { title: `Tax: ${taxRecord.id??""}`, param ,taxRecord,tax_itemRecords });
    }
    catch (err) {
        next(err);
    }
}

exports.taxSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var taxData = {
			billto: req.body.billto||null,
			billto_address: req.body.billto_address||null,
			billto_province: req.body.billto_province||null,
			billto_country: req.body.billto_country||null,
			billto_zipcode: req.body.billto_zipcode||null,
			billto_phone: req.body.billto_phone||null,
			billto_email: req.body.billto_email||null,
			shipto: req.body.shipto||null,
			shipto_address: req.body.shipto_address||null,
			shipto_province: req.body.shipto_province||null,
			shipto_country: req.body.shipto_country||null,
			shipto_zipcode: req.body.shipto_zipcode||null,
			shipto_phone: req.body.shipto_phone||null,
			shipto_email: req.body.shipto_email||null,
			doc_no: req.body.doc_no||null,
			doc_date: common.toDateFormat(req.body.doc_date,'DD/MM/YYYY','YYYY-MM-DD'),
			taxid: req.body.taxid||null,
			tax_rate: req.body.tax_rate||0,
			discount: req.body.discount||0,
			invoice_id: req.body.invoice_id||null,
			note: req.body.note||null,
			payer: req.body.payer||null,
			payee: req.body.payee||null 
		};
                
		var newtaxId = uuidv4(); 
        if (param.id == undefined) {
            taxData.id = newtaxId;
            taxData.owner_id = req.user.id;
            taxData.create_by = req.user.id;
            taxData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            taxData.update_by = req.user.id;
            taxData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		if(req.body["datasheet_ZxjafN"] != undefined && req.body["datasheet_ZxjafN"] != ""){
            var datasheet_ZxjafNItems = JSON.parse(req.body["datasheet_ZxjafN"]);
            var datasheet_ZxjafNData = {};
            if (param.id == undefined) {
                datasheet_ZxjafNData.tax_id = newtaxId;
            }
            else {
                datasheet_ZxjafNData.tax_id = param.id;
            };
            await dbHelper.delete("tax_item",{tax_id:datasheet_ZxjafNData.tax_id});
            for(let datasheet_ZxjafNItem of datasheet_ZxjafNItems){
                datasheet_ZxjafNData.id = uuidv4();
				datasheet_ZxjafNData.product_id = datasheet_ZxjafNItem.product_id||null;
				datasheet_ZxjafNData.product_name = datasheet_ZxjafNItem.product_name||null;
				datasheet_ZxjafNData.quantity = datasheet_ZxjafNItem.quantity||0;
				datasheet_ZxjafNData.unitprice = datasheet_ZxjafNItem.unitprice||0;
				datasheet_ZxjafNData.total = datasheet_ZxjafNItem.total||0;
                if (param.id == undefined) {
                    datasheet_ZxjafNData.owner_id = req.user.id;
                    datasheet_ZxjafNData.create_by = req.user.id;
                    datasheet_ZxjafNData.create_date = common.toMySqlDateTimeFormat(new Date());                                
                }
                else {
                    datasheet_ZxjafNData.update_by = req.user.id;
                    datasheet_ZxjafNData.update_date = common.toMySqlDateTimeFormat(new Date());   
                }
                await dbHelper.create("tax_item",datasheet_ZxjafNData);
            } 
        }

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/tax/edit?id=${newtaxId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [taxRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("tax",taxData,{"id":param.id??""}):dbHelper.create("tax",taxData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.activitystatusDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [activitystatusRecord] = await Promise.all([
			dbHelper.delete("activitystatus",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.activitystatusExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereactivitystatusRecords = [];                
        
        if(sqlParam != ""){
            arrWhereactivitystatusRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereactivitystatusRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereactivitystatusRecords = "";
        if(arrWhereactivitystatusRecords.length>0){
            sqlWhereactivitystatusRecords = `  where  ${arrWhereactivitystatusRecords.join(" and ")??""}`;
        }
    

		var [activitystatusRecords] = await Promise.all([
			dbHelper.queryAll(`select * from activitystatus ${sqlWhereactivitystatusRecords}`) 
		]);

        common.exportXls(res, "activitystatusRecords-"+common.stampTime, "Sheet1", activitystatusRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.activitystatusPage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereactivitystatusRecords = [];                
        
        if(sqlParam != ""){
            arrWhereactivitystatusRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereactivitystatusRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereactivitystatusRecords = "";
        if(arrWhereactivitystatusRecords.length>0){
            sqlWhereactivitystatusRecords = `  where  ${arrWhereactivitystatusRecords.join(" and ")??""}`;
        }
    

		var [activitystatusRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from activitystatus ${sqlWhereactivitystatusRecords}) totalcount  from activitystatus ${sqlWhereactivitystatusRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (activitystatusRecords.length > 0) { totalcount = activitystatusRecords[0].totalcount; }
        let activitystatusRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,activitystatusRecords,activitystatusRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.activitystatusAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereactivitystatusRecords = [];                
        
        if(sqlParam != ""){
            arrWhereactivitystatusRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereactivitystatusRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereactivitystatusRecords = "";
        if(arrWhereactivitystatusRecords.length>0){
            sqlWhereactivitystatusRecords = `  where  ${arrWhereactivitystatusRecords.join(" and ")??""}`;
        }
    

		var [activitystatusRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from activitystatus ${sqlWhereactivitystatusRecords}) totalcount  from activitystatus ${sqlWhereactivitystatusRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (activitystatusRecords.length > 0) { totalcount = activitystatusRecords[0].totalcount; }
        let activitystatusRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('setting/activitystatus/list', { title: `Activity status`, param ,activitystatusRecords,activitystatusRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}

exports.quotationDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [quotationRecord] = await Promise.all([
			dbHelper.delete("quotation",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.quotationExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWherequotationRecords = [];                
        
        if(sqlParam != ""){
            arrWherequotationRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWherequotationRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWherequotationRecords = "";
        if(arrWherequotationRecords.length>0){
            sqlWherequotationRecords = `  where  ${arrWherequotationRecords.join(" and ")??""}`;
        }
    

		var [quotationRecords] = await Promise.all([
			dbHelper.queryAll(`select * from quotation ${sqlWherequotationRecords}`) 
		]);

        common.exportXls(res, "quotationRecords-"+common.stampTime, "Sheet1", quotationRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.quotationPage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWherequotationRecords = [];                
        
        if(sqlParam != ""){
            arrWherequotationRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWherequotationRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWherequotationRecords = "";
        if(arrWherequotationRecords.length>0){
            sqlWherequotationRecords = `  where  ${arrWherequotationRecords.join(" and ")??""}`;
        }
    

		var [quotationRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from quotation ${sqlWherequotationRecords}) totalcount  from quotation ${sqlWherequotationRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (quotationRecords.length > 0) { totalcount = quotationRecords[0].totalcount; }
        let quotationRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,quotationRecords,quotationRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.quotationAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWherequotationRecords = [];                
        
        if(sqlParam != ""){
            arrWherequotationRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWherequotationRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWherequotationRecords = "";
        if(arrWherequotationRecords.length>0){
            sqlWherequotationRecords = `  where  ${arrWherequotationRecords.join(" and ")??""}`;
        }
    

		var [quotationRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from quotation ${sqlWherequotationRecords}) totalcount  from quotation ${sqlWherequotationRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (quotationRecords.length > 0) { totalcount = quotationRecords[0].totalcount; }
        let quotationRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('quotation/list', { title: `Quotation`, param ,quotationRecords,quotationRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}

exports.productgroupDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [productgroupRecord] = await Promise.all([
			dbHelper.delete("productgroup",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.productgroupExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereproductgroupRecords = [];                
        
        if(sqlParam != ""){
            arrWhereproductgroupRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereproductgroupRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereproductgroupRecords = "";
        if(arrWhereproductgroupRecords.length>0){
            sqlWhereproductgroupRecords = `  where  ${arrWhereproductgroupRecords.join(" and ")??""}`;
        }
    

		var [productgroupRecords] = await Promise.all([
			dbHelper.queryAll(`select * from productgroup ${sqlWhereproductgroupRecords}`) 
		]);

        common.exportXls(res, "productgroupRecords-"+common.stampTime, "Sheet1", productgroupRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.productgroupPage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereproductgroupRecords = [];                
        
        if(sqlParam != ""){
            arrWhereproductgroupRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereproductgroupRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereproductgroupRecords = "";
        if(arrWhereproductgroupRecords.length>0){
            sqlWhereproductgroupRecords = `  where  ${arrWhereproductgroupRecords.join(" and ")??""}`;
        }
    

		var [productgroupRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from productgroup ${sqlWhereproductgroupRecords}) totalcount  from productgroup ${sqlWhereproductgroupRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (productgroupRecords.length > 0) { totalcount = productgroupRecords[0].totalcount; }
        let productgroupRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,productgroupRecords,productgroupRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.productgroupAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereproductgroupRecords = [];                
        
        if(sqlParam != ""){
            arrWhereproductgroupRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereproductgroupRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereproductgroupRecords = "";
        if(arrWhereproductgroupRecords.length>0){
            sqlWhereproductgroupRecords = `  where  ${arrWhereproductgroupRecords.join(" and ")??""}`;
        }
    

		var [productgroupRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from productgroup ${sqlWhereproductgroupRecords}) totalcount  from productgroup ${sqlWhereproductgroupRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (productgroupRecords.length > 0) { totalcount = productgroupRecords[0].totalcount; }
        let productgroupRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('productgroup/list', { title: `Product Group`, param ,productgroupRecords,productgroupRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}

exports.taxDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [taxRecord] = await Promise.all([
			dbHelper.delete("tax",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.taxExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWheretaxRecords = [];                
        
        if(sqlParam != ""){
            arrWheretaxRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWheretaxRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWheretaxRecords = "";
        if(arrWheretaxRecords.length>0){
            sqlWheretaxRecords = `  where  ${arrWheretaxRecords.join(" and ")??""}`;
        }
    

		var [taxRecords] = await Promise.all([
			dbHelper.queryAll(`select * from tax ${sqlWheretaxRecords}`) 
		]);

        common.exportXls(res, "taxRecords-"+common.stampTime, "Sheet1", taxRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.taxPage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWheretaxRecords = [];                
        
        if(sqlParam != ""){
            arrWheretaxRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWheretaxRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWheretaxRecords = "";
        if(arrWheretaxRecords.length>0){
            sqlWheretaxRecords = `  where  ${arrWheretaxRecords.join(" and ")??""}`;
        }
    

		var [taxRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from tax ${sqlWheretaxRecords}) totalcount  from tax ${sqlWheretaxRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (taxRecords.length > 0) { totalcount = taxRecords[0].totalcount; }
        let taxRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,taxRecords,taxRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.taxAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWheretaxRecords = [];                
        
        if(sqlParam != ""){
            arrWheretaxRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWheretaxRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWheretaxRecords = "";
        if(arrWheretaxRecords.length>0){
            sqlWheretaxRecords = `  where  ${arrWheretaxRecords.join(" and ")??""}`;
        }
    

		var [taxRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from tax ${sqlWheretaxRecords}) totalcount  from tax ${sqlWheretaxRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (taxRecords.length > 0) { totalcount = taxRecords[0].totalcount; }
        let taxRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('tax/list', { title: `Tax`, param ,taxRecords,taxRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}

exports.leadsourceDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [leadsourceRecord] = await Promise.all([
			dbHelper.delete("leadsource",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.leadsourceExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereleadsourceRecords = [];                
        
        if(sqlParam != ""){
            arrWhereleadsourceRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereleadsourceRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereleadsourceRecords = "";
        if(arrWhereleadsourceRecords.length>0){
            sqlWhereleadsourceRecords = `  where  ${arrWhereleadsourceRecords.join(" and ")??""}`;
        }
    

		var [leadsourceRecords] = await Promise.all([
			dbHelper.queryAll(`select * from leadsource ${sqlWhereleadsourceRecords}`) 
		]);

        common.exportXls(res, "leadsourceRecords-"+common.stampTime, "Sheet1", leadsourceRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.leadsourcePage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereleadsourceRecords = [];                
        
        if(sqlParam != ""){
            arrWhereleadsourceRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereleadsourceRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereleadsourceRecords = "";
        if(arrWhereleadsourceRecords.length>0){
            sqlWhereleadsourceRecords = `  where  ${arrWhereleadsourceRecords.join(" and ")??""}`;
        }
    

		var [leadsourceRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from leadsource ${sqlWhereleadsourceRecords}) totalcount  from leadsource ${sqlWhereleadsourceRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (leadsourceRecords.length > 0) { totalcount = leadsourceRecords[0].totalcount; }
        let leadsourceRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,leadsourceRecords,leadsourceRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.leadsourceAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereleadsourceRecords = [];                
        
        if(sqlParam != ""){
            arrWhereleadsourceRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereleadsourceRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereleadsourceRecords = "";
        if(arrWhereleadsourceRecords.length>0){
            sqlWhereleadsourceRecords = `  where  ${arrWhereleadsourceRecords.join(" and ")??""}`;
        }
    

		var [leadsourceRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from leadsource ${sqlWhereleadsourceRecords}) totalcount  from leadsource ${sqlWhereleadsourceRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (leadsourceRecords.length > 0) { totalcount = leadsourceRecords[0].totalcount; }
        let leadsourceRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('setting/leadsource/list', { title: `Leadsource`, param ,leadsourceRecords,leadsourceRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}

exports.activitytypeEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [activitytypeRecord] = await Promise.all([
			param.id!=undefined?dbHelper.findOne("activitytype",{"id":param.id??""},[]):{} 
		]);

        res.render('setting/activitytype/edit', { title: `Activity type: ${activitytypeRecord.id??""}`, param ,activitytypeRecord });
    }
    catch (err) {
        next(err);
    }
}

exports.activitytypeSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var activitytypeData = {
			name: req.body.name||null,
			note: req.body.note||null 
		};
                
		var newactivitytypeId = uuidv4(); 
        if (param.id == undefined) {
            activitytypeData.id = newactivitytypeId;
            activitytypeData.owner_id = req.user.id;
            activitytypeData.create_by = req.user.id;
            activitytypeData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            activitytypeData.update_by = req.user.id;
            activitytypeData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/setting/activitytype/edit?id=${newactivitytypeId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [activitytypeRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("activitytype",activitytypeData,{"id":param.id??""}):dbHelper.create("activitytype",activitytypeData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.convertToOpportunity = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [opportunityRecord] = await Promise.all([
			dbHelper.execute(`insert into opportunity (id,gender, firstname, lastname, dateofbirth, address, province, country, zipcode, contact, phone, email, interest, note)  select uuid(),gender, firstname, lastname, dateofbirth, address, province, country, zipcode, contact, phone, email, interest, note FROM leads WHERE id = '${param.id??""}'`) 
		]);

        res.status(200).json({ success: true, message:'Convert Lead to Opportunity complete', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.leadsEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        
        var arrWhereactivityRecords = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereactivityRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereactivityRecords = "";
        if(arrWhereactivityRecords.length>0){
            sqlWhereactivityRecords = `  and  ${arrWhereactivityRecords.join(" and ")??""}`;
        }
    

		var [leadsRecord,activityRecords] = await Promise.all([
			param.id!=undefined?dbHelper.queryOne(`select leads.*, (select name from leadsource where leadsource.id = leadsource_id) leadsource_text from leads where id = "${param.id??""}"`,{},{}):{},
			dbHelper.queryAll(`select activity.*, (select name from activitystatus where activitystatus.id = activitystatus_id) activitystatus_text from activity where lead_id = "${param.id??""}" ${sqlWhereactivityRecords}`) 
		]);

        res.render('leads/edit', { title: `Lead: ${leadsRecord.id??""}`, param ,leadsRecord,activityRecords });
    }
    catch (err) {
        next(err);
    }
}

exports.leadsSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var leadsData = {
			gender: req.body.gender||null,
			firstname: req.body.firstname||null,
			lastname: req.body.lastname||null,
			dateofbirth: common.toDateFormat(req.body.dateofbirth,'DD/MM/YYYY','YYYY-MM-DD'),
			leadsource_id: req.body.leadsource_id||null,
			address: req.body.address||null,
			province: req.body.province||null,
			country: req.body.country||null,
			zipcode: req.body.zipcode||null,
			contact: req.body.contact||null,
			phone: req.body.phone||null,
			email: req.body.email||null,
			interest: req.body.interest||null,
			note: req.body.note||null 
		};
                
		var newleadsId = uuidv4(); 
        if (param.id == undefined) {
            leadsData.id = newleadsId;
            leadsData.owner_id = req.user.id;
            leadsData.create_by = req.user.id;
            leadsData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            leadsData.update_by = req.user.id;
            leadsData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/leads/edit?id=${newleadsId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [leadsRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("leads",leadsData,{"id":param.id??""}):dbHelper.create("leads",leadsData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.productgroupEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [productgroupRecord] = await Promise.all([
			param.id!=undefined?dbHelper.findOne("productgroup",{"id":param.id??""},[]):{} 
		]);

        res.render('productgroup/edit', { title: `Product Group: ${productgroupRecord.id??""}`, param ,productgroupRecord });
    }
    catch (err) {
        next(err);
    }
}

exports.productgroupSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var productgroupData = {
			name: req.body.name||null 
		};
                
		var newproductgroupId = uuidv4(); 
        if (param.id == undefined) {
            productgroupData.id = newproductgroupId;
            productgroupData.owner_id = req.user.id;
            productgroupData.create_by = req.user.id;
            productgroupData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            productgroupData.update_by = req.user.id;
            productgroupData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/productgroup/edit?id=${newproductgroupId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [productgroupRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("productgroup",productgroupData,{"id":param.id??""}):dbHelper.create("productgroup",productgroupData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.leadsAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        
        var arrWhereleadsRecords = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereleadsRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereleadsRecords = "";
        if(arrWhereleadsRecords.length>0){
            sqlWhereleadsRecords = `  and  ${arrWhereleadsRecords.join(" and ")??""}`;
        }
    

		var [leadsRecords] = await Promise.all([
			dbHelper.queryAll(`select leads.* ,
(select name from leadsource where leadsource.id = leadsource_id) leadsource_text ,(select count(id) 
from leads
where  
firstname like '%${param.q??""}%' or lastname like '%${param.q??""}%' ) totalcount  
from leads
where  
firstname like '%${param.q??""}%' or lastname like '%${param.q??""}%' ${sqlWhereleadsRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (leadsRecords.length > 0) { totalcount = leadsRecords[0].totalcount; }
        let leadsRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('leads/list', { title: `Lead`, param ,leadsRecords,leadsRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}

exports.leadsDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [leadsRecord] = await Promise.all([
			dbHelper.delete("leads",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.leadsExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        
        var arrWhereleadsRecords = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereleadsRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereleadsRecords = "";
        if(arrWhereleadsRecords.length>0){
            sqlWhereleadsRecords = `  and  ${arrWhereleadsRecords.join(" and ")??""}`;
        }
    

		var [leadsRecords] = await Promise.all([
			dbHelper.queryAll(`select leads.* ,
(select name from leadsource where leadsource.id = leadsource_id) leadsource_text  
from leads
where  
firstname like '%${param.q??""}%' or lastname like '%${param.q??""}%' ${sqlWhereleadsRecords}`) 
		]);

        common.exportXls(res, "leadsRecords-"+common.stampTime, "Sheet1", leadsRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.leadsPage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        
        var arrWhereleadsRecords = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereleadsRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereleadsRecords = "";
        if(arrWhereleadsRecords.length>0){
            sqlWhereleadsRecords = `  and  ${arrWhereleadsRecords.join(" and ")??""}`;
        }
    

		var [leadsRecords] = await Promise.all([
			dbHelper.queryAll(`select leads.* ,
(select name from leadsource where leadsource.id = leadsource_id) leadsource_text ,(select count(id) 
from leads
where  
firstname like '%${param.q??""}%' or lastname like '%${param.q??""}%' ) totalcount  
from leads
where  
firstname like '%${param.q??""}%' or lastname like '%${param.q??""}%' ${sqlWhereleadsRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (leadsRecords.length > 0) { totalcount = leadsRecords[0].totalcount; }
        let leadsRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,leadsRecords,leadsRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.activitystatusEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [activitystatusRecord] = await Promise.all([
			param.id!=undefined?dbHelper.findOne("activitystatus",{"id":param.id??""},[]):{} 
		]);

        res.render('setting/activitystatus/edit', { title: `Activity status: ${activitystatusRecord.id??""}`, param ,activitystatusRecord });
    }
    catch (err) {
        next(err);
    }
}

exports.activitystatusSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var activitystatusData = {
			name: req.body.name||null,
			note: req.body.note||null 
		};
                
		var newactivitystatusId = uuidv4(); 
        if (param.id == undefined) {
            activitystatusData.id = newactivitystatusId;
            activitystatusData.owner_id = req.user.id;
            activitystatusData.create_by = req.user.id;
            activitystatusData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            activitystatusData.update_by = req.user.id;
            activitystatusData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/setting/activitystatus/edit?id=${newactivitystatusId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [activitystatusRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("activitystatus",activitystatusData,{"id":param.id??""}):dbHelper.create("activitystatus",activitystatusData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.leadsourceEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [leadsourceRecord] = await Promise.all([
			param.id!=undefined?dbHelper.findOne("leadsource",{"id":param.id??""},[]):{} 
		]);

        res.render('setting/leadsource/edit', { title: `Leadsource: ${leadsourceRecord.id??""}`, param ,leadsourceRecord });
    }
    catch (err) {
        next(err);
    }
}

exports.leadsourceSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var leadsourceData = {
			name: req.body.name||null,
			note: req.body.note||null 
		};
                
		var newleadsourceId = uuidv4(); 
        if (param.id == undefined) {
            leadsourceData.id = newleadsourceId;
            leadsourceData.owner_id = req.user.id;
            leadsourceData.create_by = req.user.id;
            leadsourceData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            leadsourceData.update_by = req.user.id;
            leadsourceData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/setting/leadsource/edit?id=${newleadsourceId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [leadsourceRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("leadsource",leadsourceData,{"id":param.id??""}):dbHelper.create("leadsource",leadsourceData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.activitytypeDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [activitytypeRecord] = await Promise.all([
			dbHelper.delete("activitytype",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.activitytypeExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereactivitytypeRecords = [];                
        
        if(sqlParam != ""){
            arrWhereactivitytypeRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereactivitytypeRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereactivitytypeRecords = "";
        if(arrWhereactivitytypeRecords.length>0){
            sqlWhereactivitytypeRecords = `  where  ${arrWhereactivitytypeRecords.join(" and ")??""}`;
        }
    

		var [activitytypeRecords] = await Promise.all([
			dbHelper.queryAll(`select * from activitytype ${sqlWhereactivitytypeRecords}`) 
		]);

        common.exportXls(res, "activitytypeRecords-"+common.stampTime, "Sheet1", activitytypeRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.activitytypePage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereactivitytypeRecords = [];                
        
        if(sqlParam != ""){
            arrWhereactivitytypeRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereactivitytypeRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereactivitytypeRecords = "";
        if(arrWhereactivitytypeRecords.length>0){
            sqlWhereactivitytypeRecords = `  where  ${arrWhereactivitytypeRecords.join(" and ")??""}`;
        }
    

		var [activitytypeRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from activitytype ${sqlWhereactivitytypeRecords}) totalcount  from activitytype ${sqlWhereactivitytypeRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (activitytypeRecords.length > 0) { totalcount = activitytypeRecords[0].totalcount; }
        let activitytypeRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,activitytypeRecords,activitytypeRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.activitytypeAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereactivitytypeRecords = [];                
        
        if(sqlParam != ""){
            arrWhereactivitytypeRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereactivitytypeRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereactivitytypeRecords = "";
        if(arrWhereactivitytypeRecords.length>0){
            sqlWhereactivitytypeRecords = `  where  ${arrWhereactivitytypeRecords.join(" and ")??""}`;
        }
    

		var [activitytypeRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from activitytype ${sqlWhereactivitytypeRecords}) totalcount  from activitytype ${sqlWhereactivitytypeRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (activitytypeRecords.length > 0) { totalcount = activitytypeRecords[0].totalcount; }
        let activitytypeRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('setting/activitytype/list', { title: `Activity type`, param ,activitytypeRecords,activitytypeRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}

exports.quotationEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [quotationRecord,quotation_itemRecords] = await Promise.all([
			param.id!=undefined?dbHelper.queryOne(`select * from quotation where  id = "${param.id??""}"`,{},{}):{},
			dbHelper.findAll("quotation_item",{"quotation_id":param.id??""},[]) 
		]);

        res.render('quotation/edit', { title: `Quotation: ${quotationRecord.id??""}`, param ,quotationRecord,quotation_itemRecords });
    }
    catch (err) {
        next(err);
    }
}

exports.quotationSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var quotationData = {
			customer: req.body.customer||null,
			customer_address: req.body.customer_address||null,
			customer_province: req.body.customer_province||null,
			customer_country: req.body.customer_country||null,
			customer_zipcode: req.body.customer_zipcode||null,
			customer_phone: req.body.customer_phone||null,
			customer_email: req.body.customer_email||null,
			vendor: req.body.vendor||null,
			vendor_address: req.body.vendor_address||null,
			vendor_province: req.body.vendor_province||null,
			vendor_country: req.body.vendor_country||null,
			vendor_zipcode: req.body.vendor_zipcode||null,
			vendor_phone: req.body.vendor_phone||null,
			vendor_email: req.body.vendor_email||null,
			doc_no: req.body.doc_no||null,
			doc_date: common.toDateFormat(req.body.doc_date,'DD/MM/YYYY','YYYY-MM-DD'),
			taxid: req.body.taxid||null,
			tax_rate: req.body.tax_rate||0,
			discount: req.body.discount||0,
			customer_id: req.body.customer_id||null 
		};
                
		var newquotationId = uuidv4(); 
        if (param.id == undefined) {
            quotationData.id = newquotationId;
            quotationData.owner_id = req.user.id;
            quotationData.create_by = req.user.id;
            quotationData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            quotationData.update_by = req.user.id;
            quotationData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		if(req.body["datasheet_JiMtVR"] != undefined && req.body["datasheet_JiMtVR"] != ""){
            var datasheet_JiMtVRItems = JSON.parse(req.body["datasheet_JiMtVR"]);
            var datasheet_JiMtVRData = {};
            if (param.id == undefined) {
                datasheet_JiMtVRData.quotation_id = newquotationId;
            }
            else {
                datasheet_JiMtVRData.quotation_id = param.id;
            };
            await dbHelper.delete("quotation_item",{quotation_id:datasheet_JiMtVRData.quotation_id});
            for(let datasheet_JiMtVRItem of datasheet_JiMtVRItems){
                datasheet_JiMtVRData.id = uuidv4();
				datasheet_JiMtVRData.product_id = datasheet_JiMtVRItem.product_id||null;
				datasheet_JiMtVRData.product_name = datasheet_JiMtVRItem.product_name||null;
				datasheet_JiMtVRData.quantity = datasheet_JiMtVRItem.quantity||0;
				datasheet_JiMtVRData.unitprice = datasheet_JiMtVRItem.unitprice||0;
				datasheet_JiMtVRData.total = datasheet_JiMtVRItem.total||0;
                if (param.id == undefined) {
                    datasheet_JiMtVRData.owner_id = req.user.id;
                    datasheet_JiMtVRData.create_by = req.user.id;
                    datasheet_JiMtVRData.create_date = common.toMySqlDateTimeFormat(new Date());                                
                }
                else {
                    datasheet_JiMtVRData.update_by = req.user.id;
                    datasheet_JiMtVRData.update_date = common.toMySqlDateTimeFormat(new Date());   
                }
                await dbHelper.create("quotation_item",datasheet_JiMtVRData);
            } 
        }

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/quotation/edit?id=${newquotationId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [quotationRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("quotation",quotationData,{"id":param.id??""}):dbHelper.create("quotation",quotationData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.productDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [productRecord] = await Promise.all([
			dbHelper.delete("product",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.productExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        
        var arrWhereproductRecords = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereproductRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereproductRecords = "";
        if(arrWhereproductRecords.length>0){
            sqlWhereproductRecords = `  and  ${arrWhereproductRecords.join(" and ")??""}`;
        }
    

		var [productRecords] = await Promise.all([
			dbHelper.queryAll(`select product.* , (select name from productgroup where productgroup.id = productgroup_id) productgroup_text 
 
from product 
where code like '%${param.q??""}%' or name like '%${param.q??""}%'  or vendor like '%${param.q??""}%'  
 ${sqlWhereproductRecords}`) 
		]);

        common.exportXls(res, "productRecords-"+common.stampTime, "Sheet1", productRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.productPage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        
        var arrWhereproductRecords = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereproductRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereproductRecords = "";
        if(arrWhereproductRecords.length>0){
            sqlWhereproductRecords = `  and  ${arrWhereproductRecords.join(" and ")??""}`;
        }
    

		var [productRecords] = await Promise.all([
			dbHelper.queryAll(`select product.* , (select name from productgroup where productgroup.id = productgroup_id) productgroup_text 
,(select count(id) 
from product 
where code like '%${param.q??""}%' or name like '%${param.q??""}%'  or vendor like '%${param.q??""}%'   ) totalcount  
from product 
where code like '%${param.q??""}%' or name like '%${param.q??""}%'  or vendor like '%${param.q??""}%'  
 ${sqlWhereproductRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (productRecords.length > 0) { totalcount = productRecords[0].totalcount; }
        let productRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,productRecords,productRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.productAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        
        var arrWhereproductRecords = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereproductRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereproductRecords = "";
        if(arrWhereproductRecords.length>0){
            sqlWhereproductRecords = `  and  ${arrWhereproductRecords.join(" and ")??""}`;
        }
    

		var [productRecords] = await Promise.all([
			dbHelper.queryAll(`select product.* , (select name from productgroup where productgroup.id = productgroup_id) productgroup_text 
,(select count(id) 
from product 
where code like '%${param.q??""}%' or name like '%${param.q??""}%'  or vendor like '%${param.q??""}%'   ) totalcount  
from product 
where code like '%${param.q??""}%' or name like '%${param.q??""}%'  or vendor like '%${param.q??""}%'  
 ${sqlWhereproductRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (productRecords.length > 0) { totalcount = productRecords[0].totalcount; }
        let productRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('product/list', { title: `Product`, param ,productRecords,productRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}