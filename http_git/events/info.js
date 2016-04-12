const auth    = require(".custom/touno-git").auth;
const chalk   = require('chalk');


module.exports = function(info) {
  auth.username(info.headers).then(function(user){
    // console.log('info check', user.level);
    // if(user.level > 0) {
    return auth.permission(info.repo, user).then(function(permission){
      if(permission.accept) {
        console.log(user.username, "("+user.fullname+")", chalk.yellow('info /'+info.repo));
        info.accept();
      } else {
        console.log(chalk.red('reject--'+info.repo+'--msg--'+permission.error));
        info.reject();//'Please check username and password is not currect'
      }
    });
    // } else {
    //   console.log(user.username, "("+user.fullname+")",'info /'+info.repo);
    //   info.accept();
    // }
  });
}