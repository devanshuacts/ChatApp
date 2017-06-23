const redis = require('redis')
const redisClient = redis.createClient()
const _groupExtn = '_grp'
const _userExtn = '_users'
const _messages = '_msgs'
const _groupAdminSet = 'groupAdminSet'
redisClient.on('connect', function () {
  console.log('connected')
})
redisClient.on('error', function (err) {
  throw new Error(err)
})
class Rooms {
  // static saveGroupDetailList (obj, cb) {
  //   redisClient.hmset('groupDetailObj', {
  //     'groupName': obj.groupName,
  //     'admin': obj.admin,
  //     'users': JSON.stringify(obj.users)
  //   })
  //   Rooms.saveUserDetailList(obj)
  //   redisClient.hgetall('groupDetailObj', (err, groupDetailObj) => {
  //     if (err) throw new Error(err)
  //     redisClient.rpush('groupDetailList', JSON.stringify(groupDetailObj), (err, reply) => {
  //       if (err) throw new Error(err)
  //       console.log('number Of rooms = ', reply)
  //       cb(reply)
  //     })
  //   })
  // }
  static saveGroupDetail (obj, cb) {
    Rooms.saveUserDetailList(obj)
    Rooms.saveGroupAdminSet(obj)
    Rooms.saveGroupUserList(obj)
    if (typeof (cb) === typeof (Function)) {
      console.log('<chat_server.js saveGroupDetail > type of cb is callback')
      cb()
    }
  }
  static saveGroupAdminSet (obj) {
    redisClient.hmset(_groupAdminSet, obj.groupName, obj.admin)
  }
  static saveGroupUserList (obj, cb) {
    obj.users.forEach(user => {
      redisClient.rpush(obj.groupName.concat(_userExtn), user)
    })
    if (typeof (cb) === typeof (Function)) {
      console.log('<chat_server.js saveGroupUserList > type of cb is callback')
      cb()
    }
  }
  // static getGroupDetailObj (groupIndex, cb) {
  //   redisClient.lindex('groupDetailList', groupIndex, (err, obj) => {
  //     if (err) throw new Error(err)
  //     console.log('obj from lindex --> ', obj)
  //     console.log('parsed obj-> ', JSON.parse(obj))
  //     cb(JSON.parse(obj))
  //   })
  // }
  static getGroupDetailList (groupName, cb) {
    console.log('<roomdb.js getGroupDetailList > Entry groupName = ', groupName)
    redisClient.lrange(groupName.concat(_userExtn), 0, -1, (err, list) => {
      if(err) throw new Error(err)
      console.log('<roomdb.js getGroupDetailList > users in group = ', list)
      cb(list)
    })
  }
  static getGroupAdminName (groupName, cb) {
    console.log('<roomdb.js getGroupAdminName > Entry groupName = ', groupName)
    redisClient.hmget(_groupAdminSet, groupName, (err, list) => {
      if(err) throw new Error(err)
      console.log('<roomdb.js getGroupAdminName >result from DB adminName -> ', list)
      cb(list)
    })
  }
  static deleteUserFromGroup (userName, groupName, cb) {
    console.log('<roomdb.js deleteUserFromGroup > Entry userName = ', userName, ' groupName = ', groupName)
    redisClient.lrem(groupName.concat(_userExtn), 0, userName, (err, reply) => {
      if(err) throw new Error(err)
      cb(reply)
    })
  }
  static saveUserDetailList (obj, cb) {
    console.log('<roomdb.js saveUserDetailList> obj -> ', obj)
    let groupName = obj.groupName
    let users = obj.users
    if(obj.admin && (users.indexOf(obj.admin) === -1))
      users.push(obj.admin)
    for (let user of users) {
      redisClient.rpush(user.concat(_groupExtn), groupName)
    }
    if (typeof (cb) === typeof (Function)) {
      console.log('<roomdb.js saveUserDetailList> type of cb is callback')
      cb()
    }
  }
  static getUserDetailList (userName, cb) {
    redisClient.lrange(userName.concat(_groupExtn), 0, -1, (err, list) => {
      console.log('<roomdb.js, getUserDetailList > userList ', list)
      if (err) throw new Error(err)
      cb(list)
    })
  }
  static deleteGroupFromUserList (userName, groupName, cb) {
    console.log('<roomdb.js deleteGroupFromUserList > Entry userName = ', userName, ' groupName = ', groupName)
    redisClient.lrem(userName.concat(_groupExtn), 0, groupName, (err, reply) => {
      if(err) throw new Error(err)
      cb(reply)
    })
  }
  static saveGroupMessage (msg, sender, cb) {
    redisClient.hmset('messageSenderObj', {
      'sender': sender,
      'text': msg.text
    })
    redisClient.hgetall('messageSenderObj', (err, messageSenderObj) => {
      if (err) throw new Error(err)
      redisClient.rpush(msg.groupName.concat(_messages), JSON.stringify(messageSenderObj), (err, reply) => {
        if (err) throw new Error(err)
        console.log('total message count in ', msg.groupName, ' ', reply)
        cb(reply)
      })
    })
  }
  static getGroupMessages (groupName, cb) {
    console.log('<roomdb.js getGroupMessages > groupName -> ', groupName)
    redisClient.lrange(groupName.concat(_messages), 0, -1, (err, messagesList) => {
      if (err) throw new Error(err)
      console.log('<roomdb.js getGroupMessages > messagesList = ', messagesList)
      console.log('<roomdb.js getGroupMessages > messages = ', messagesList)
      cb(messagesList)
    })
  }
}

module.exports.Rooms = Rooms
