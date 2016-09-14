"use strict";

/*:
* @plugindesc Helps with the creation of Foraging and Farming Event Creation.
* @author RivingtonDown
*

@help

Harvest_Manager
by: RivingtonDown

Item Note: harvest type, harvest level, item id

E.g.
Crop 1 5 (Farming crop at level 1 that will provide you item id:5)
Forage 3 1 (Foraging plant at level 3 that will provice you item id:1)

*/

var Imported = Imported || {};
Imported.Harvest_Manager = true;

var Harvest = Harvest || {};
Harvest.HD = Harvest.HD || {};

var HarvestType = null;
var HarvestLvl = null;
var HarvestItem = null;
var HarvestEvent = null;

var HarvestYield = null;
var CraftXP = null;
var CraftLvl = null;
var CraftXPVar = null;
var CraftLvlVar = null;
var CraftType = null;
var mapID = null;
var eventID = null;

Harvest.HD.GameSystem_initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function () {
  Harvest.HD.GameSystem_initialize.call(this);
};

Game_System.prototype.createHarvestable = function (value, eventID, mapID) {
  HarvestType = value.shift(); //set harvest type (crop or forage) while shifting value array
  HarvestLvl = parseInt(value[0]); //level of the plant you're harvesting
  HarvestItem = parseInt(value[1]); //item code of the plant you're harvesting

  if (HarvestType == "Forage") {
    //if you're foraging
    CraftType = "Foraging"; //string for messages
    CraftXPVar = 6; //in-game forage xp variable number
    CraftLvlVar = 7; //in-game forage lvl variable number
    ;
  }
  if (HarvestType == "Crop") {
    //if you're farming
    CraftType = "Farming"; //string for messages
    CraftXPVar = 9; //in-game farming xp variable number
    CraftLvlVar = 8; //in-game farming lvl variable number
  }
  CraftXP = $gameVariables.value(CraftXPVar); //in-game craft xp quick value
  CraftLvl = $gameVariables.value(CraftLvlVar); //in-game craft lvl quick value

  console.log("Trying to harvest... " + CraftType + " Lvl:" + CraftLvl + " / Harvest Lvl:" + HarvestLvl);

  if (HarvestType == "Forage" && HarvestLvl > CraftLvl) {
    //if you're foraging AND the plant is higher level than your foraging lvl
    $gameMessage.add( //create a message
    CraftType + " level too low to forage "+$gameMap.event(eventID).event().name.toLowerCase()+"\n" + "Required level: " + HarvestLvl + "\n" + "Current level: " + CraftLvl + "\n");
    return; //cancel out of the script
  } else {
    //otherwise, assuming your are either farming or you're foraging but the plant is not higher level
    calculateItems(CraftLvl, HarvestItem); //generate the items and give them to the player
    calculateExp(HarvestLvl, CraftLvl); //calculate experience and level ups for the player's craft skill
    if (HarvestType == "Forage") {
      //if you're foraging
      $gameSelfSwitches.setValue([mapID, eventID, "A"], true); //switch plant to self switch A, which should delete the event
    }
  }

  function calculateItems(level, item) {
    var bonusSuccess = 0; //base chance for bonus success
    if (HarvestType == "Forage") {
      //if you are foraging
      HarvestYield = Math.floor(Math.random() * Math.min(4, level)) + 1; //calculate yield based on item level
      if (CraftLvl > HarvestLvl) {
        //if you have a higher forage lvl than the harvest lvl
        var random = Math.random();
        bonusSuccess = (CraftLvl - HarvestLvl) * 10; //generate percentage chance based on level difference
        if (random < bonusSuccess) {
          //if you suceed at that chance
          AudioManager.playSe({ name: "Item3", volume: 100, pitch: 100, pan: 0, pos: 0 }); //play bonus gain sfx
          $gameParty.gainItem($dataItems[3], 1); //gain bonus item
          console.log("Gained 1 bonus item with a " + bonusSuccess + "% chance");
        }
      }
    }
    if (HarvestType == "Crop") {
      //if you are harvesting a crop
      if (CraftLvl - HarvestLvl == 0) {
        //if craft level is only one and you try to harvest a level one crop
        HarvestYield = 1; //set the yield to one so it isn't zero
      } else {
        HarvestYield = Math.min(4, CraftLvl - HarvestLvl + 1); //otherwise yield is the level difference to a maximum of 4
      }
    }
    $gameParty.gainItem($dataItems[HarvestItem], HarvestYield); //gain the items you were foraging or harvesting in the correct yield
    console.log("Gained " + HarvestYield + " regular item with id:" + HarvestItem);
  }

  function calculateExp(experience, level) {
    var toNextLvl = Math.pow(level + 1, 2) * 2; //Formula that generates xp to next craft level

    CraftXP = $gameVariables.value(CraftXPVar) + experience; //add harvest level to craft xp
    $gameVariables.setValue(CraftXPVar, CraftXP); //set that xp to in-game craft xp variable

    if (CraftXP >= toNextLvl) {
      //if you've gained enough craft xp level up craft lvl
      CraftXP = toNextLvl - CraftXP; //reset craft xp, allowing carry over of extra xp into next level
      $gameVariables.setValue(CraftXPVar, CraftXP); //set that craft xp variable in-game
      CraftLvl = level + 1; //add 1 to crafting lvl
      $gameVariables.setValue(CraftLvlVar, CraftLvl); //set that level to in-game variable
      $gameMessage.setPositionType(2); //set message to screen middle
      AudioManager.playSe({ name: "Saint5", volume: 100, pitch: 100, pan: 0, pos: 0 }); //play craft level up sfx
      $gameMessage.add(CraftType + " Level Increased to " + $gameVariables.value(CraftLvlVar) + "!"); //generate craft level up message
    }
  }
};
Game_System.prototype.plowPlot = function (value, eventID, mapID) {
  HarvestType = value.shift(); //shift value array over
  HarvestLvl = parseInt(value[0]); //level of the crop you're harvesting
  HarvestItem = parseInt(value[1]); //item code of the crop you're harvesting

  CraftLvl = $gameVariables.value(8);

  if (HarvestLvl > CraftLvl) {
    //if the crop is too high level for you to harvest
    $gameMessage.add( //create a message
    "Farming level too low to grow "+$gameMap.event(eventID).event().name.toLowerCase()+"\n" + "Required level: " + HarvestLvl + "\n" + "Current level: " + CraftLvl + "\n");
    $gameMessage.add("Clear plot?"); //generate an option to clear the plot
    $gameMessage.setChoices(['Yes', 'No'], 0, -1);
    $gameMessage.setChoiceCallback(function (choice) {
      if (choice == 0) {
        //if you choose yes
        $gameSelfSwitches.setValue([mapID, eventID, "D"], true); //set self switch to D which should automatically destroy event
      } else {
          //if you choose no
          return; //cancel out of the script
        }
    });
  } else {
    //if you are, in-fact, high enough level
    $gameSelfSwitches.setValue([mapID, eventID, "A"], true); //turn self-switch to A which should allow you to water
    $gameVariables.setValue(10, $gameVariables.value(10) - 1); //lower your gardening tools durability by 1
  }
};
Game_System.prototype.plantPlots = function (value, eventID, mapID) {
  $gameMessage.add("What will you plant?");
  $gameMessage.setChoices([value[0], value[1], value[2], value[3], "Cancel"], 0, 1, 2, 3, -1);
  $gameMessage.setChoiceCallback(function (choice) {
    if (choice == 0) {
      $gameMap.spawnMapEventFrom(19, 1, 11, false);
    }
    if (choice == 1) {
      $gameMap.spawnMapEventFrom(19, 2, 11, false);
    }
    if (choice == 2) {
      $gameMap.spawnMapEventFrom(19, 3, 11, false);
    }
    if (choice == 3) {
      $gameMap.spawnMapEventFrom(19, 4, 11, false);
    }
    if (choice == -1) {
      return;
    }
  });
}
