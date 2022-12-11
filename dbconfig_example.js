const  config = {
  user:  'your_user', // sql user
  password:  'your_pwd', //sql user password
  server:  '127.0.0.1', // if it does not work try- localhost
  database:  'your_db_name',
  options: {
    trustedconnection:  true,
    enableArithAbort:  true,
    instancename:  'SQLEXPRESS'  // SQL Server instance name
  },
  port:  3306
}

module.exports = config