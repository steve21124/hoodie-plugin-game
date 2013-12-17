/*
 * Copyright 2013 Xiatron LLC
 */

//set some vars
moment = require('moment');
cardTasks = []; //keeps player card active tasks

//run the rest in the hoodie context
module.exports = function (hoodie, cb) {
    //try to add the game db in case  this is a first run
    hoodie.database.add('hoodie-plugin-game', function(err, data){
        if (err && err.error != 'file_exists') console.log(err);
    });
    
    //get the game db
    gameDb = hoodie.database('hoodie-plugin-game');
    
    //make sure everyone can get to it
    gameDb.grantPublicReadAccess(function(){});

    //check for the achievements doc and add it if necessary
    gameDb.find('config', 'game', function(err, doc){
        if (err && err.error == 'not_found') {
            //setup some defualts
            var defaults = {
                id:"game",
                game_achievements: {
                    "ID1": {
                        "achievement_name":"",
                        "badge_src":"",
                        "achievement_description":"",
                        "amount_needed":0,
                        "time_period":0,
                        "status":"inactive"
                    }
                },
                game_levels: {
                    "0": {
                        "level_name":"Level 0",
                        "points_needed":0
                    }
                }
            };
            
            //add the doc
            gameDb.add('config', defaults, function(err) { if (err) console.log(err); });
        }
    });
    
    //check for the leaderboard design doc and add it if necessary
    hoodie.request('GET', 'hoodie-plugin-game/_design/leaderboard', {}, function(err, data){
        if (err && err.error == 'not_found') {
            var putData = {
                language: "javascript",
                views: {
                    points: {
                        map: "function(doc) { if (doc.type == 'card') emit(doc.points, doc); }"
                    }
                }
            };
            
            //add the doc (seems the hoodie.request method will not work with design docs)
            hoodie.request('PUT', 'hoodie-plugin-game/_design/leaderboard/', {data: putData}, function(err, data){
                if (err) console.log(err);
            });
        }
    });
    
    //listen for tasks to add points
    hoodie.task.on('add:addpoints', function (db, doc) {
        var process = function() {
            if (cardTasks.indexOf(db) > -1) {
                setTimeout(process,50);
            } else  {
                //lock (to avoid the rare case concurrent conflicting writes)
                cardTasks.push(db);
                
                //process points
                if (doc.card.points) {
                    addPoints(doc.card.ownerHash, doc.card.points, function(result){
                        //clear the lock
                        cardTasks.splice(cardTasks.indexOf(db), 1);
                        
                        //mimic a 'hoodie.task.success(db, doc)' but add the doneData object - see 
                        doc['$processedAt'] = moment().format();
                        doc['_deleted'] = true;
                        doc['doneData'] = result;
                        hoodie.database(db).update(doc.type, doc.id, doc, function(err, data){ if(err) console.log(err); });
                    });
                }
            }
        }
        process();
    });
    
    //listen for tasks to add points
    hoodie.task.on('add:addaction', function (db, doc) {
        var process = function() {
            if (cardTasks.indexOf(db) > -1) {
                setTimeout(process,50);
            } else  {
                //lock (to avoid the rare case concurrent conflicting writes)
                cardTasks.push(db);
        
                //process action
                if (doc.card.achievement  && doc.card.units) {
                    addAction(doc.card.ownerHash, doc.card.achievement, doc.card.units, function(result){
                        //clear the lock
                        cardTasks.splice(cardTasks.indexOf(db), 1);
                        
                        //mimic a 'hoodie.task.success(db, doc)' but add the doneData object - see
                        doc['$processedAt'] = moment().format();
                        doc['_deleted'] = true;
                        doc['doneData'] = result;
                        hoodie.database(db).update(doc.type, doc.id, doc, function(err, data){ if(err) console.log(err); });
                    });
                }
            }
        }
        process();
    });
    
    //listen for tasks to update the card
    hoodie.task.on('add:updcard', function (db, doc) {
        var process = function() {
            if (cardTasks.indexOf(db) > -1) {
                setTimeout(process,50);
            } else  {
                //lock (to avoid the rare case concurrent conflicting writes)
                cardTasks.push(db);
        
                //process action
                if (doc.card) {
                    updateCard(doc.card.ownerHash, doc.card, function(result){
                        //clear the lock
                        cardTasks.splice(cardTasks.indexOf(db), 1);
                        
                        //mimic a 'hoodie.task.success(db, doc)' but add the doneData object - see
                        doc['$processedAt'] = moment().format();
                        doc['_deleted'] = true;
                        doc['doneData'] = result;
                        hoodie.database(db).update(doc.type, doc.id, doc, function(err, data){ if(err) console.log(err); });
                    });
                }
            }
        }
        process();
    });
    
    
    //function to add points (depends on getLevel)
    function addPoints(ownerHash, points, callback) {
        var returnData = {};
        gameDb.find('card', ownerHash, function(err, doc){
            if (err && err.error == 'not_found') {
                getLevel(points, function(level){
                    returnData['level_up'] = (level.level > 0);
                    if (level.level > 0) {
                        returnData['level_data'] = level.level_data;
                        triggerFrontendEvent(ownerHash, 'levelup');
                    }
                    var card = {id: ownerHash, points: points, level: level.level};
                    gameDb.add('card', card, function(err) { if (!err) callback(returnData); });
                });
            } else {
                getLevel(doc.points+points, function(level){
                    returnData['level_up'] = (doc.level < level.level);
                    if (doc.level < level.level) {
                        returnData['level_data'] = level.level_data;
                        triggerFrontendEvent(ownerHash, 'levelup');
                    }
                    gameDb.update('card', ownerHash, {points: doc.points+points, level: level.level}, function(err) { if (!err) callback(returnData); });
                });
            }
        });
    }
    
    //function to get level (feeds addPoints)
    function getLevel(points, callback) {
        gameDb.find('config', 'game', function(err, doc){
            var levels = doc.game_levels;
            for (var i in levels) {
                //check is above lower lower limit
                if(points >= levels[i].points_needed) {
                    //check if there are any more levels
                    if (i != Object.keys(levels).length -1) {
                        //check if we are below the next lower limit
                        if (points < levels[parseInt(i) + 1].points_needed) callback({level:i,level_data:levels[i]});
                    } else {
                        callback({level:i,level_data:levels[i]});
                    }
                }
            }
        });
    }
    
    //function to add action units
    function addAction(ownerHash, achievementId, units, callback) {
        getAchievement(achievementId, units, function(achievement){
            if (achievement) {
                //get the current player card
                gameDb.find('card', ownerHash, function(err, doc){
                    //does the card exist?
                    if (err && err.error == 'not_found') {
                        //no card so lets create one and add the achievement
                        gameDb.add('card', {id: ownerHash, achievements: [achievementId]}, function(err) { if (!err) callback({achievement: true, achievement_data: achievement}); });
                        triggerFrontendEvent(ownerHash, 'achievement', {achievement_data: achievement});
                    } else {
                        //we have a card but does it have an achievements property?
                        if (doc.achievements != undefined) {
                            //Is achievements already populated with the achievement ID?
                            if (doc.achievements.indexOf(achievementId) == -1) {
                                //its not there so lets add it
                                doc.achievements.push(achievementId);
                                gameDb.update('card', ownerHash, {achievements:doc.achievements}, function(err) { if (!err) callback({achievement: true, achievement_data: achievement}); });
                                triggerFrontendEvent(ownerHash, 'achievement', {achievement_data: achievement});
                            } else {
                                //its already there so we dont have anything to do
                                callback({achievement: false, reason: "duplicate"});
                            }
                        } else {
                            //theres not achievements property so lets add it with the sole acheievement
                            gameDb.update('card', ownerHash, {achievements: [achievementId]}, function(err) { if (!err) callback({achievement: true, achievement_data: achievement}); });
                            triggerFrontendEvent(ownerHash, 'achievement', {achievement_data: achievement});
                        }
                    }
                });
            } else {
                //no such achievement so just pass back a false
                callback({achievement: false, reason: "missing"});
            }
        });
    }
    
    //function to get achievement (feeds addPoints)
    function getAchievement(achievementId, units, callback) {
        gameDb.find('config', 'game', function(err, doc){
            var achievement = doc.game_achievements[achievementId];
            if (units > achievement.amount_needed) {
                achievement['id'] = achievementId;
                callback(achievement);
            } else {
                callback(false);
            }
        });
    }
    
    //function to uppdate card properties
    function updateCard(ownerHash, attrs, callback) {
        gameDb.update('card', ownerHash, attrs, function(err, data) {
            if (!err) callback(data);
        });
    }

    
    //function to trigger a levelup on the front end
    function triggerFrontendEvent(ownerHash, event, /*optional*/data) {
        attrs = {
            id:Math.random().toString(36).slice(2,9)
        };
        if (data) attrs['data'] = data;
        
        hoodie.database('user/'+ownerHash).add(event, attrs, function(err, data){
            if (err) console.log(err);
        });
    }
    
    
    //Hoodie Callback
    cb();
}