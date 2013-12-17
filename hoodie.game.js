/*
 * Copyright 2013 Xiatron LLC
 */

Hoodie.extend(function(hoodie) {
    hoodie.game = function() {};
    
    //Get game achievements
    hoodie.game.getAchievements = function() {
        var defer = hoodie.defer();
        var promise = _getGameData('game_achievements');
        promise.done(function(data){ defer.resolve(data); });
        promise.fail(function(data){ defer.reject(); });
        return defer.promise();
    };
    
    //Get single game achievement
    hoodie.game.getAchievement = function(achId) {
        var defer = hoodie.defer();
        var promise = _getGameData('game_achievements', achId);
        promise.done(function(data){ defer.resolve(data); });
        promise.fail(function(data){ defer.reject(); });
        return defer.promise();
    };
    
    //Get game levels
    hoodie.game.getLevels = function() {
        var defer = hoodie.defer();
        var promise = _getGameData('game_levels');
        promise.done(function(data){ defer.resolve(data); });
        promise.fail(function(data){ defer.reject(); });
        return defer.promise();
    };
    
    //Get single game level
    hoodie.game.getLevel = function(levelId) {
        var defer = hoodie.defer();
        var promise = _getGameData('game_levels', levelId);
        promise.done(function(data){ defer.resolve(data); });
        promise.fail(function(data){ defer.reject(); });
        return defer.promise();
    };
    
    //Get game leaderboard
    hoodie.game.getLeaderboard = function() {
        var defer = hoodie.defer();
        var promise = hoodie.request('GET', '/hoodie-plugin-game/_design/leaderboard/_view/points?descending=true');
        promise.done(function(data){ defer.resolve(data); });
        promise.fail(function(data){ defer.reject(); });
        return defer.promise();
    };
    
    //Get player info
    hoodie.game.getPlayerCard = function(ownerHash) {
        var defer = hoodie.defer();
        var promise = hoodie.request('GET', '/hoodie-plugin-game/'+encodeURIComponent('card/'+ownerHash));
        promise.done(function(data){ defer.resolve(data); });
        promise.fail(function(data){ defer.reject(); });
        return defer.promise();
    };
    
    //Update the player's card (stats)
    hoodie.game.addPoints = function(points) {
        var attrs = { card: {points:points} };
        attrs['card']['ownerHash'] = hoodie.account.ownerHash;
        var defer = hoodie.defer();
        var promise = hoodie.task.start('addpoints', attrs);
        promise.then(function(data){ defer.resolve(data); });
        promise.fail(function(data){ defer.reject(); });
        return defer.promise();
    };
    
    //Update the player's card (stats)
    hoodie.game.addAction = function(acheivement, units) {
        var attrs = { card: {achievement:acheivement, units:units} };
        attrs['card']['ownerHash'] = hoodie.account.ownerHash;
        var defer = hoodie.defer();
        var promise = hoodie.task.start('addaction', attrs);
        promise.then(function(data){ defer.resolve(data); });
        promise.fail(function(data){ defer.reject(); });
        return defer.promise();
    };
    
    //Update the player's card (stats)
    hoodie.game.updateCard = function(values) {
        var attrs = { card: values };
        attrs['card']['ownerHash'] = hoodie.account.ownerHash;
        var defer = hoodie.defer();
        var promise = hoodie.task.start('updcard', attrs);
        promise.then(function(data){ defer.resolve(data); });
        promise.fail(function(data){ defer.reject(); });
        return defer.promise();
    };
    
    //listen for user game events (levelup, acheivement, request etc)
    hoodie.game.on = function(item, callback) {
        hoodie.store.on('add:'+item, function(object) {
            //run the callback
            var returnData = (object.data != undefined) ? object.data : object;
            callback(returnData);
            
            //remove the item (timeout seems to fixed missed calls)
            setTimeout(function(){hoodie.store.remove(object.type, object.id);},2000);
        });
    };
    
    //Internal get config category (achievements or levels)
    function _getGameData(cat, /*optional*/itemId) {
        var defer = hoodie.defer();
        var promise = hoodie.request('GET', '/hoodie-plugin-game/'+encodeURIComponent('config/game'));
        promise.done(function(data){
            if (typeof itemId != 'undefined') {
                if (typeof data[cat][itemId] != 'undefined') {
                    defer.resolve(data[cat][itemId]);
                } else {
                    defer.reject(new Error('missing'));
                }
            } else {
                defer.resolve(data[cat]);
            }
        });
        promise.fail(function(data){
            defer.reject(new Error('ajax'));
        });
        return defer.promise();
    };
    
});