(function($)
{
	'use strict';

	window.game =
	{
		settings:
		{
            chance: 0.42,
            iterations: 3,
            width: Math.floor(Math.random()*(100-30+1)+30),
			height: Math.floor(Math.random()*(100-30+1)+30)
		},

		overworld: null,

		Init: function()
		{
            game.overworld = new Map(game.settings.width, game.settings.height, game.settings.chance);
            
            for (var l = 0; l < game.settings.iterations; l++) {
                game.overworld = this.MakeCaverns(game.overworld);
            }

            this.PlaceTreasure(game.overworld);
        },
        
        MakeCaverns: function(map) {
            var newMap = new Map(map.width, map.height, 0);

            for (var y = 0; y < map.height - 1; y++) {
                for (var x = 0; x < map.width - 1; x++) {
                    newMap.board[y][x]().isWall = map.PlaceWallLogic(y, x);
                }
            }

            return newMap;
        },

        PlaceTreasure: function(map) {
            // 6 for very rare
            // 3-5 for regular
            var treasureHiddenLimit = 5;

            for (var y = 0; y < map.height; y++) {
                for (var x = 0; x < map.width; x++) {
                    if (!map.board[y][x]().isWall) {
                        if (map.GetAdjacentWalls(y, x, 1, 1) >= treasureHiddenLimit && !map.IsTreasureAround(y, x, 30)) {
                            map.board[y][x]().treasure = true;
                        }
                    }
                }
            }
        }
	};



	$(document).ready(function() {
		game.Init();
		ko.applyBindings(game);
	});



	function Map(width, height, percentWalls) {
		this.width = width ? width : 0;
		this.height = height ? height : 0;
        this.percentWalls = percentWalls ? percentWalls : 0;
        this.board = new Array(this.height);

        
		this.Init = function() {
            for (var y = 0; y < this.height; y++)
			{
				this.board[y] = new Array(this.width);
				
				for (var x = 0; x < this.width; x++)
				{
					this.board[y][x] = ko.observable({
                        isWall: false,
                        treasure: false
                    });
				}
            }
            
            this.RandomFillMap();
        };


        this.PlaceWallLogic = function(y, x) {
            var numWalls = this.GetAdjacentWalls(y, x, 1, 1);

            if (this.board[y][x]().isWall) {
                if (numWalls > 3) {
                    return true;
                } else if (numWalls < 2) {
                    return false;
                }
            } else {
                if (numWalls > 4) {
                    return true;
                }
            }

            return false;
        };


        this.GetAdjacentWalls = function(y, x, incY, incX) {
            var startX = x - incX,
                startY = y - incY,
                endX = x + incX,
                endY = y + incY;

            var iX = startX,
                iY = startY,
                wallCounter = 0;

            for (var a = iY; a <= endY; a++) {
                for (var b = iX; b <= endX; b++) {
                    if (b == x && a == y) continue;

                    if (this.IsWall(a, b)) {
                        wallCounter++;
                    }
                }
            }

            return wallCounter;
        };


        this.IsTreasureAround = function(y, x, inc) {
            var startX = x - inc,
                startY = y - inc,
                endX = x + inc,
                endY = y + inc;

            var iX = startX,
                iY = startY,
                isTreasureAround = false;
            
            for (var a = iY; a <= endY; a++) {
                for (var b = iX; b <= endX; b++) {
                    if (this.IsTreasure(a, b))
                        isTreasureAround = true;
                }
            }

            return isTreasureAround;
        };


        this.IsTreasure = function(y, x) {
            if (this.IsOutOfBounds(y, x)) return false;

            return this.board[y][x]().treasure;
        }


        this.IsWall = function(y, x) {
            if (this.IsOutOfBounds(y, x)) return true;

            return this.board[y][x]().isWall;
        };


        this.IsOutOfBounds = function(y, x) {
            if (x < 0 || x > this.width - 1 || y < 0 || y > this.height - 1) return true;
            
            return false;
        };


        this.RandomFillMap = function() {
            var mapMiddle = this.height / 2;

            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    // true if we are on an edge
                    if (x == 0 || x == this.width - 1 || y == 0 || y == this.height - 1) {
                        this.board[y][x]().isWall = true;
                        continue;
                    }

                    // false if we are in the middle
                    if (y == mapMiddle) {
                        this.board[y][x]().isWall = false;
                        continue;
                    }

                    // random choice
                    this.board[y][x]().isWall = this.RandomPercent();
                }
            }
        };


        this.RandomPercent = function() {
            return Math.random() < this.percentWalls;
        };


		this.Init();
	};
})(jQuery);







