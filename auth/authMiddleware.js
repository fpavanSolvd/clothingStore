const config = require('../config.js');
const jwt = require('./jwt.js');

let checkToken = (req, res, next) => {
  let token = req.headers['x-access-token'] || req.headers['authorization']; 
  
  if (token) {
  
    if (token.startsWith('Bearer ')) {
        
        token = token.slice(7, token.length);
    }

  
    let decoded = jwt(config.secret).decode(token);
    if (decoded) {
        req.decoded = decoded;
        next();  
    } else {
        return res.json({
          success: false,
          message: 'Token is not valid'
        }); 
    }
  } else {
    return res.json({
      success: false,
      message: 'Auth token is not supplied'
    });
  }
};

module.exports = {
  checkToken: checkToken
}