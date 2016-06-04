"use strict";
const config  = require("$custom/config");
const control = require("$custom/touno-git").control;
const auth 		= require("$custom/touno-git").auth;
const Q 				= require('q');
const mongo 		= require("$custom/schema");
const db 				= require("$custom/mysql").connect();
const moment		= require("moment");
const chalk 		= require('chalk');
const path 			= require('path');

module.exports = function(push) {
  push.accept(function(){
  	var infoTime = moment().format(' HH:mm:ss');
    var dirRepository = config.source+'/'+push.repo;
    var sinceFormat = 'ddd, D MMM YYYY HH:mm:ss ZZ';
    var access = {};
  //   var _option = { to: [] }
		// var _ejs = { 
		//   commit_index: 22,
		//   repository: push.repo,
		//   commit_id: push.commit,
		//   commit_branch: push.branch,
		//   commit_name: '',
		//   commit_date: '',
		//   comment_subject: '',
		//   comment_full: '',
		//   commit_btn: "Go to commit id '" + push.commit.substr(0, 7) + "'",
		//   commit_link: "http://pgm.ns.co.th/"+push.repo+'/info/'+push.commit,
		//   domain_name: 'pgm.ns.co.th',
		//   limit_rows: 50,
		//   static: '//'+config.domain+':'+config.api+'/',
		//   files: [],
		//   width_icon: 0,
		//   width_detail: 680,
		//   graph: []
		// }
		
    var getTotalList = [ 'rev-list', '--all', '--count' ];
    var RegexCommit = 0;
    // var getHead = [ '--no-pager','show', push.commit,'--pretty=medium','--date=iso','--name-status' ]; 

		auth.username(push.headers).then(function(user){
  		console.log(chalk.green(infoTime), "logs", user.fullname, "push",chalk.green(push.repo, ':', push.branch));
			access.user_id = user.user_id;
			return db.query('SELECT repository_id FROM repositories WHERE dir_name = :name', { name: push.repo })
		}).then(function(repo){
			access.repository_id = repo[0].repository_id;
	    var def = Q.defer();
			var findCommits = mongo.Commit.findOne({ 'repository_id': access.repository_id }).sort({since : -1});
			findCommits.exec(function(err, result){
		    if (err) { def.reject(); }
		    def.resolve(result);
			});
	    return def.promise;
		}).then(function(commit){


	 //    getHead = getHead.map(function(arg){ return arg === '0000000000000000000000000000000000000000' ? '-n 1' : arg; });

  // 		var repo = push.repo.replace(/\//g, ' -> ').replace(/\.git/g, ' project.');


		// 	console.log(chalk.yellow('git', getTotalList.join(' ')));
  //   	return control.cmd('git', getTotalList, dirRepository)
		// }).then(function(index){
	 //    	var commit_index = index.replace(/[\n|\r]/g,'');


  		var logFormat = [ '--no-pager', 'log', '--all', `--format=[]%ci%n[]%H%n[]%P%n[]%ae%n'%B'` ]; 
  		if(commit) {
  			console.log('since_date', commit.since);
  			since_date = moment(commit.since).add(1, 'seconds').format(sinceFormat);
  			logFormat.push(`--since="${since_date}"`);
			}
			console.log(chalk.yellow('git', logFormat.join(' ')));
    	return control.cmd('git', logFormat, dirRepository);
    }).then(function(logs){

    	let regexLogs = logs.match(/\[\][\W\w]*?'[\W\w]*?'/ig).map(function(item){
    		let commit_log = /\[\](.+?)\n\[\]([a-f0-9]{40})\n\[\]([a-f0-9 ]{81}|[a-f0-9]{40}|)\n\[\](.+)\n'([\W\w]+?)'/g.exec(item);
    		return (function(){
    			let def = Q.defer();
					let log = new mongo.Commit({
	    			since: new Date(commit_log[1]),
	    			commit_id: commit_log[2],
	    			parent_id: commit_log[3], 
	    			repository_id: access.repository_id,
	    			email: commit_log[4], 
	    			comment: commit_log[5].trim(), 
	    		});
					log.save(function (err, log) { if (err) def.reject(err); else def.resolve(log);	}); 
	    		return def.promise;
    		})() 
    	});
    	RegexCommit = regexLogs.length;
	    return Q.all(regexLogs);
    }).then(function(logs){
    	console.log(`git log ${RegexCommit} items saved.`);

// 

	 //    	// CHANGE PEATURN HEAD
	 //   //  	var logHead = /From:.(.*?)\nDate:.(.*)\nSubject:.\[PATCH\].([\S|\s]*)?\n\n/g.exec(logs);
	 //   //  	var email = /(.*)\<(.*)\>/g.exec(logHead[1]);

	 //   //  	_option.to.push(user.email);
	 //   //  	if(email[2] !== user.email) _option.to.push(email[2]);

	 //   //  	var dateAt = moment(logHead[2], sinceFormat);
	 //   //  	console.log(dateAt.format('dddd, DD MMMM YYYY')); // Sat, 9 Apr 2016 14:33:47 +0700
	 //   //  	console.log(dateAt.format('HH:mm:ss')); // Sat, 9 Apr 2016 14:33:47 +0700

	 //   //  	var logLimit = 0;
	 //   //  	var logChange = /\n\n([AMD]\s[\S\s]+)/g.exec(logs) || [];
	 //   //  	var comment_text = logHead[3];
	 //   //  	console.log('comment', comment_text);
	 //   //  	_ejs.comment_full = comment_text;
		// 		// _ejs.comment_subject = ((/(.*)\n\n/g.exec(comment_text) || ['', comment_text])[1]).substr(0, 36)
	 //   //  	_ejs.commit_date = dateAt.format('dddd, DD MMMM YYYY HH:mm:ss');
		// 		// _ejs.commit_name = email[0];
	 //   //  	_ejs.files = (logChange[1] || '').split(/\n/).map(function(file){
	 //   //  		file = /([AMD])\s+(.*)/g.exec(file);
	 //   //  		if(file) {
		// 		//   	var name = path.basename(file[2]) || '';
		// 		//   	if(_ejs.limit_rows > logLimit) {
		// 		//   		logLimit++;
		// 	 //    		return { 
		// 	 //    			class: 'item-one',
		// 	 //    			filename: name.substr(0, 30)+(name.length > 30 ? '...'+path.extname(file[2]) : ''), 
		// 	 //    			status: file[1]=='A'?'+':file[1]=='D'?'-':'', 
		// 	 //    			filepath: path.dirname('/'+file[2])
		// 	 //    		}
		// 		//   	} else {
		// 		//   		return;
		// 		//   	}
	 //   //  		}
	 //   //  	}).filter(function(list){ if(list) { return list; } });

	 //    	var commiter = {
	 //    		user_id: user.user_id,
	 //    		repository: push.repo
	 //    	}

	 //    	return mongo.commiter.select(commiter.user_id, commiter.repository).then(function(commit){
	 //      	var since_date = "-n 1";
	 //    		if(commit) {
	 //    			var since = moment(commit.since, sinceFormat).add(1, 'seconds').format(sinceFormat);
	 //    			since_date = '--since="'+since+'"';
	 //    		}
	 //    		var getLogs = [ '--no-pager','log','--graph','--abbrev-commit','--pretty=oneline','--all','--author='+email[0].trim(), since_date ];
  //   			console.log(chalk.yellow('git', getLogs.join(' ')));
  //   			// return mongo.commiter.update(commiter.user_id, commiter.repository, logHead[2]).then(function(){
  //   				return control.cmd('git', getLogs, dirRepository);
  //   			// });
	 //    	});
	 //    });


  //   	logs = logs.match(/[0-9a-f]+..*/g);
  //   	console.log('---');
  //   	console.log(logs);
  //   	console.log('---');
	 //  	if(push.commit === '0000000000000000000000000000000000000000') {
	 //  		_option.subject = 'branch delete';
	 //   		return control.email('changeset-branch', _option, _ejs, push);
	 //    } else if(logs.length > 1) {

	 //    	var getGraph = [ '--no-pager','log','--graph','--all','--format=%H[--]%ae[--]%s[--]%ai','-n '+logs.length ];
	 //    	return control.cmd('git', getGraph, dirRepository).then(function(logs){
	 //    		var maxImg = 0, logHistory = logs.split(/\n/g);
	 //    		logHistory.forEach(function(log){
	 //    			var graph = /([*\/\\| ]{2,100})/g.exec(log);
	 //    			var commit = /([0-9a-f]{40})\[--\](.*)\[--\](.*)\[--\](.*)/g.exec(log);
	 //    			var td_object = { icon: [], detail: '' };
	 //    			if(commit) {
	 //    				td_object.detail = commit[3];
		//     			console.log('graph', graph[1]);
		//     			console.log('comit_id', commit[1]);
		//     			console.log('email', commit[2]);
		//     			console.log('comment', commit[3]);
		//     			console.log('date', commit[4]);
		//     			for (var i = 0; i < graph[1].length; i++) {
		//     				var icon = 'space';
		//     				switch(graph[1][i])
		//     				{
		//     					case '*': icon = 'point'; break;
		//     					case '|': icon = 'center'; break;
		//     					case '\\': icon = 'left'; break;
		//     					case '/': icon = 'right'; break;
		//     				}
		//     				td_object.icon.push('http://dev.ns.co.th:810/graph/' + icon + '.jpg');
		//     			}
		//     			maxImg = graph[1].length > maxImg ? graph[1].length : maxImg;
		//     			_ejs.width_icon = maxImg*9;
	 //    			}
	 //    			_ejs.graph.push(td_object)
	 //    		});
	 //    		_ejs.commit_index = (parseInt(_ejs.commit_index) - logHistory.length) + ' - ' + _ejs.commit_index
  //   			_ejs.width_detail = _ejs.width_detail - _ejs.width_icon;
	 //  			_option.subject = 'history logs';
	 //   			return control.email('changeset-logs', _option, _ejs, push);
	 //    	});
	 //  	} else {
	 //   		return control.email('changeset-email', _option, _ejs, push);
	 //  	}
    }).catch(function(ex){
    	console.log(chalk.red(infoTime), chalk.red('catch--push'), ex);
    });

  });
}
