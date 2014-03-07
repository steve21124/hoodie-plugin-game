# Hoodie Game Plugin

This plugin adds basic game mechanics to a Hoodie application.

The development of this plugin is sponsored by Appback.com - the first and only Hoodie Host!  Go to [https://appback.com](https://appback.com) to get started for free today!

## Installation

Install from the Hoodie CLI

    hoodie install game

## Methods

Get game achievements

    var promise = hoodie.game.getAchievements();
    promise.done(function(achievements){ console.log(achievements); });
    promise.fail(function(){ alert('Get Achievements Failed'); });
    
Get single game achievement
    
    var achievementId = 'ach1';
    var promise = hoodie.game.getAchievement(achievementId);
    promise.done(function(achievement){ console.log(achievement); });
    promise.fail(function(){ alert('Get Achievement Failed'); });
    
Get game levels

    var promise = hoodie.game.getLevels();
    promise.done(function(levels){ console.log(levels); });
    promise.fail(function(){ alert('Get Levels Failed'); });
    
Get single game level

    var levelIndex = 1;
    var promise = hoodie.game.getLevel(levelIndex);
    promise.done(function(level){ console.log(level); });
    promise.fail(function(){ alert('Get Level Failed'); });
    
Get game leaderboard

    var promise = hoodie.game.getLeaderboard();
    promise.done(function(leaderboard){ console.log(leaderboard); });
    promise.fail(function(){ alert('Get leaderboard Failed'); });
    
Get player card (any known user)

    ownerHash = hoodie.account.ownerHash;
    var promise = hoodie.game.getPlayerCard(ownerHash);
    promise.done(function(card){ console.log(card); });
    promise.fail(function(){ alert('Get Player Card Failed'); });
    
Add points (current logged in user)
    
    var points = 3;
    var promise = hoodie.game.addPoints(points);
    promise.done(function(result){ console.log(result); });
    promise.fail(function(){ alert('Add Points Failed'); });
    
Add action (units) toward achievement (current logged in user)
    
    var achievementId = 'ach1';
    var units = 10;
    var promise = hoodie.game.addAction(achievementId, units);
    promise.done(function(result){ console.log(result); });
    promise.fail(function(){ alert('Add Action Failed'); });
    
Update Player Card (current logged in user)
    
    values = {rank: "private first class"};
    var promise = hoodie.game.updateCard(values);
    promise.done(function(result){ console.log(result); });
    promise.fail(function(){ alert('Update Card Failed'); });
    
Listen for game event
    
    var event = 'levelup'; //levelup or achievement
    var promise = hoodie.game.on(event);
    promise.done(function(eventData){ console.log(eventData); });
    promise.fail(function(){ alert('Add Points Failed'); });


## Setup

Install the plugin, start your Hoodie app, then add game levels and achievements in Pocket.  Once entered, you should be all set.

Be sure to open an issue should you have any problems.  Pull requests are welcome!

Enjoy!
    
Please note:  This plugin is under major development and we are actively experimenting to identify the best ways of integrating with Hoodie.  Use at your own risk.


## Copyright

(c) 2013 Xiatron LLC