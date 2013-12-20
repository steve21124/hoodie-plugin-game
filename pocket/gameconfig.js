/*
 * Some portions adapted from https://github.com/hoodiehq/hoodie-plugin-appconfig
 * Other remaining work Copyright 2013 Xiatron LLC
 */
 
$(function () {
    //set some vars
    var getConfig = _.partial(couchr.get, '/_api/hoodie-plugin-game/'+encodeURIComponent('config/game'));
    var setConfig = _.partial(couchr.put, '/_api/hoodie-plugin-game/'+encodeURIComponent('config/game'));
    var levels;
    var achievements;
    var nextAchKey;
    var nextlevelKey;

    // set initial form values
    loadForms();
  
    /*
    *   Level Listeners
    */
  
    // handle level select changes
    $('#levelSelect').change(function() {
        var thisId = $(this).val();
        $('#levelUpdateBtn').hide();
        if (thisId == nextlevelKey) {
            $('#levelDelBtn').attr('disabled','disabled');
            $('.levelInput').removeAttr('disabled');
            $('#levelEditBtn').trigger('click');
            $('#levelName').focus();
        } else {
            $('#levelCancelBtn').hide();
            $('#levelDelBtn').removeAttr('disabled').show();
            $('.levelInput').attr('disabled','disabled');
            $('#levelEditBtn').show();
        }
        $('#levelName').val(''); //reset
        $('#levelPoints').val(''); //reset

        //loop through levels
        $.each(levels, function(i, level) {
            if (i == thisId) {
                $('#levelName').val(level.level_name);
                $('#levelPoints').val(level.points_needed);
               
                //lets not allow for a detion of the 0 level
                if (i == 0) $('#levelDelBtn').hide();
            }
        });
    });
  
    $('#levelEditBtn').on('click',function(event) {
        event.preventDefault();
        $(this).hide();
        $('#levelDelBtn').hide();
        $('#levelCancelBtn').show();
        $('.levelInput').removeAttr('disabled'); //foll
        return false;
    });
  
    $('#levelCancelBtn').on('click', function(event) {
        event.preventDefault();
        $(this).hide();
        if ($('#levelSelect').val() != nextlevelKey) {
            $('.levelInput').attr('disabled','disabled');
            $('#levelEditBtn').show();
            $('#levelDelBtn').show();
        } else {
            $('#levelSelect')[0].selectedIndex = 0;
        }
        $('#levelSelect').trigger('change');
        return false;
    });
  
    //level delete button handler
    $('#levelDelBtn').on('click', function(){
        deleteConfigItem('game_levels', $('#levelSelect').val(), function(){
            alert('level deleted');
        });
    });
  
    //level save button handler
    $('#levelUpdateBtn').on('click', function(){
        var obj = {};
        obj[$('#levelSelect').val()] = {
            level_name: $('#levelName').val(),
            points_needed: $('#levelPoints').val()
        };
        
        //TODO: add validation
        
        updateConfig('game_levels', obj, function(){
            alert('level saved');
        });
    });
  
    /*
    *   Achievement Listeners
    */
  
    //achievement select handler
    $('#achievementSelect').change(function() {
        var thisId = $(this).val();
        $('#achUpdateBtn').hide();
        if (thisId == nextAchKey) {
            $('#achDelBtn').attr('disabled','disabled');
            $('.achInput').removeAttr('disabled');
            $('#achEditBtn').trigger('click');
        } else {
            $('#achievementSelectGroup').show();
            $('#achievementNameGroup').hide()
            $('#achDelBtn').removeAttr('disabled').show();
            $('.achInput').attr('disabled','disabled');
            $('#achEditBtn').show();
        }
        $('#achievementName').val('');//reset
        $('#achievementActionQty').val('');//reset
        $('#achievementBadgeUrl').val('');//reset
        $.each(achievements, function(i, achievement) {
            if (i == thisId) {
                $('#achievementName').val(achievement.achievement_name);
                $('#achievementActionQty').val(achievement.amount_needed);
                $('#achievementBadgeUrl').val(achievement.badge_src);
            }
        });
    });
  
    //achievement edit button handler
    $('#achEditBtn').on('click',function(event) {
        event.preventDefault();
        $(this).hide();
        $('#achDelBtn').hide();
        $('#achCancelBtn').show();
        $('#achievementSelectGroup').hide();
        $('#achievementNameGroup').show()
        $('#achievementName').focus();
        $('.achInput').removeAttr('disabled');
        return false;
    });
  
    //achievement cancel button handler
    $('#achCancelBtn').on('click', function(event) {
        event.preventDefault();
        $(this).hide();
        $('#achievementSelectGroup').show();
        $('#achievementNameGroup').hide();
        if ($('#achievementSelect').val() != nextAchKey) {
            $('.achInput').attr('disabled','disabled');
            $('#achEditBtn').show();
            $('#achDelBtn').show();
        } else {
            $('#achievementSelect')[0].selectedIndex = 0;
        }
        $('#achievementSelect').trigger('change');
        return false;
    });
  
    //achievement delete button handler
    $('#achDelBtn').on('click', function(){
        deleteConfigItem('game_achievements', $('#achievementSelect').val(), function(){
            alert('achievement deleted');
        });
    });
  
    //achievement save button handler
    $('#achUpdateBtn').on('click', function(){
        var obj = {};
        obj[$('#achievementSelect').val()] = {
            achievement_name: $('#achievementName').val(),
            badge_src: $('#achievementBadgeUrl').val(),
            amount_needed: $('#achievementActionQty').val()
        };
        
        //TODO: add validation
        
        updateConfig('game_achievements', obj, function(){
            alert('achievement saved');
        });
    });
  
    /*
    *   General Listeners
    */

    //any input keyup handler
    $('.gameSettingsInput').on('change, keyup', function() {
        //TODO: add validation and/or check for values
        
        $(this).closest('.module').find('.update').show();
    });
  
    // void all form submissions - we have handlers for that!
    $('form').submit(function (event) {event.preventDefault();});
  
    /*
    *   Internal functions
    */
  
    //(re)load the forms
    function loadForms() {
        getConfig(function (err, doc) {
            if (err) {
                return alert(err);
            } else {
                levels = doc.game_levels;
                achievements = doc.game_achievements;
                
                //reset the selects
                $('#levelSelect, #achievementSelect').html('');

                
                //set the level options
                $.each(levels, function(i, level){
                    $('#levelSelect').append('<option value="'+i+'">Level '+i+'</option>');
                });
                nextlevelKey = Object.keys(levels).length
                $('#levelSelect').append('<option value="'+nextlevelKey+'">New Level</option>');
                $('#levelSelect').trigger('change');
                
                //set the achievement options
                $.each(achievements, function(i, achievement){
                    $('#achievementSelect').append('<option value="'+i+'">'+achievement.achievement_name+' (ID: '+i+')</option>');
                });
                nextAchKey = Math.random().toString(36).slice(2,7);
                $('#achievementSelect').append('<option value="'+nextAchKey+'">New Achievement</option>');
                $('#achievementSelect').trigger('change');
            }
        });
    }
  
    //update the config
    function updateConfig(type, obj, callback){
        getConfig(function (err, doc) {
            doc[type] = _.extend(doc[type], obj);
            setConfig(doc, function(err, data){
                loadForms();
                if (callback) callback(data);
            });
        });
    }
  
    //delete a config item
    function deleteConfigItem(type, key, callback){
        getConfig(function (err, doc) {
            delete doc[type][key];
            setConfig(doc, function(err, data){
                loadForms();
                if (callback) callback(data);
            });
        });
    }

});