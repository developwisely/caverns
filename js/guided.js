(function() {
    'use strict';

	var chunkStatus = {
		EMPTY: 0,
		PATH: 1,
		ENTRANCE: 2,
		EXIT: 3,
		INVALID: 4,
		VALID: 5,
		BLOCKED: 6,
		UNKNOWN: 7
	};

    var canvas = document.getElementById('game');

    window.game = new function() {
        self = this;

		self.board = [];
		self.chunkSet = [];

        self.settings = {
            height: 100,
            width: 100,
            displaySize: 1,
			numChunks: 4,
			percentWalls: 0.4,
			iterations: 3
        };

        self.Init = function(canvas) {
            canvas.width = self.settings.width;
            canvas.height = self.settings.height;

			self.ctx = canvas.getContext('2d');

            self.cols = Math.floor(self.settings.width / self.settings.displaySize);  // x
            self.rows = Math.floor(self.settings.height / self.settings.displaySize); // y

			self.board = new Array(self.rows);

			for (var y = 0; y < self.rows; y++) {
				self.board[y] = new Array(self.cols);
				for (var x = 0; x < self.cols; x++) {
					var cell = new Cell(x, y);
					self.board[y][x] = cell;
				}
			}

			self.GenerateRandomMap();
		};

	
		self.GenerateRandomMap = function() {

			// Set up chunks
			self.chunkSet = new Array(self.settings.numChunks);
			for (var cY = 0; cY < self.settings.numChunks; cY++) {
				self.chunkSet[cY] = new Array(self.settings.numChunks);

				for (var cX = 0; cX < self.settings.numChunks; cX++) {
					self.chunkSet[cY][cX] = chunkStatus.EMPTY;
				}
			}

			// Get entrance and exit points
			self.entranceChunk = self.GetEntranceChunk();
			self.exitChunk = self.GetExitChunk();

			// Set blockers for more unique paths
			var blockers = Math.floor(Math.random()*((self.settings.numChunks-1)-1+1)+1);
			for (var q = 0; q < blockers; q++) {
				self.SetBlocker();
			}

			// Run path algorithm
			self.SetPaths();
			// possibly add random blocked chunks to get more unique paths?


			// Set all the cells in the chunks to their values
			self.SetStatusOfCells();


			// Build out the caverns
			self.BuildCaverns();

			// Place treasure
			self.PlaceTreasure();

			//debug
			self.Draw();
		};


		// Places treasure in the caves
		self.PlaceTreasure = function() {
			// higher = more rare
			var treasureHiddenLimit = 4;
			
			for (var y = 0; y < self.rows; y++) {
				for (var x = 0; x < self.cols; x++) {
					if (self.board[y][x].state !== cellState.WALL) {
						if (self.GetAdjacentWalls(x, y, 1, 1) >= treasureHiddenLimit &&
							!self.IsTreasureAround(x, y, 35)) {
							self.board[y][x].state = cellState.TREASURE;
						}
					}
				}
			}
		};

		// Checks if a treasure cell is within 'inc' of x, y
		self.IsTreasureAround = function(x, y, inc) {
            var startX = x - inc,
                startY = y - inc,
                endX = x + inc,
                endY = y + inc;

            var iX = startX,
                iY = startY,
                isTreasureAround = false;
            
            for (var rY = iY; rY <= endY; rY++) {
                for (var rX = iX; rX <= endX; rX++) {
                    if (this.IsTreasure(rX, rY))
                        isTreasureAround = true;
                }
            }

            return isTreasureAround;
        };


		// Check if the x, y coordinate is treasure
        self.IsTreasure = function(x, y) {
            if (self.IsOutOfBounds(x, y)) return false;

            return self.board[y][x].state === cellState.TREASURE;
		};


		// Starts the process of building caverns on the map
		self.BuildCaverns = function() {

			// Set the cell states
			for (var y = 0; y < self.board.length; y++) {
				for (var x = 0; x < self.board[y].length; x++) {
					if (self.board[y][x].state === cellState.WALL) continue;

					self.board[y][x].state = self.GetRandomState();
				}
			}
			
			// Iterate to build out the caverns
			for (var i = 0; i < self.settings.iterations; i++) {
				self.board = self.RefineCaverns(self.board);
			}
		};


		// Refines the caverns with cellular automata rules
		self.RefineCaverns = function(map) {
			var newMap = new Array(self.rows);
			
			for (var y = 0; y < newMap.length; y++) {
				newMap[y] = new Array(self.cols);

				for (var x = 0; x < newMap[y].length; x++) {
					var cell = new Cell(x, y);
					cell.state = self.CellularStateLogic(x, y);
					
					newMap[y][x] = cell;
				}
			}

			return newMap;
		};


		// Runs cellular automata rules
		self.CellularStateLogic = function(x, y) {
			var numWalls = this.GetAdjacentWalls(x, y, 1, 1);

			if (self.board[y][x].state === cellState.WALL) {
				if (numWalls > 3) {
					return cellState.WALL;
				} else if (numWalls < 2) {
					return cellState.FLOOR;
				}
			} else {
				if (numWalls > 4) {
					return cellState.WALL;
				}
			}

			return cellState.FLOOR;
		};


		// Gets adjacent cell wall count
		this.GetAdjacentWalls = function(x, y, incX, incY) {
            var startX = x - incX,
                startY = y - incY,
                endX = x + incX,
                endY = y + incY;

            var iX = startX,
                iY = startY,
                wallCounter = 0;

            for (var rY = iY; rY <= endY; rY++) {
                for (var rX = iX; rX <= endX; rX++) {
                    if (rX == x && rY == y) continue;

                    if (this.IsWall(rX, rY)) {
                        wallCounter++;
                    }
                }
            }

            return wallCounter;
		};


		// Checks if passed x, y coordinate cell is a wall
		self.IsWall = function(x, y) {
            if (self.IsOutOfBounds(x, y)) return true;

            return self.board[y][x].state === cellState.WALL;
		};
		

		// Checks if passed x, y coordinate is out of bounds
		self.IsOutOfBounds = function(x, y) {
            if (x < 0 || x > self.board.length - 1 || y < 0 || y > self.board.length - 1) return true;
            
            return false;
        };


		// Gets a random state for the cell
		self.GetRandomState = function() {
			if (Math.random() < self.settings.percentWalls) {
				return cellState.WALL;
			}

			return cellState.FLOOR;
		};


	
		// Pulls a random chunk for entrance
		self.GetEntranceChunk = function() {
			var posX = Math.floor(Math.random() * self.settings.numChunks),
				posY = 0;
			
			if (posX == 0 || posX == self.settings.numChunks - 1) {
				// We're on an outer edge, choose anywhere
				posY = Math.floor(Math.random() * self.settings.numChunks);
			} else {
				// We're on the inside, choose up or down
				posY = Math.floor(Math.random()) ? self.settings.numChunks : 0;
			}

			self.chunkSet[posY][posX] = chunkStatus.ENTRANCE;

			return { x: posX, y: posY }
		};


		// Pulls a random chunk for exit
		self.GetExitChunk = function() {
			var isValid = false;

			// Exit must be at least 2 blocks away from entrance
			while (!isValid) {
				var posX = Math.floor(Math.random() * self.settings.numChunks),
					posY = Math.floor(Math.random() * self.settings.numChunks);

				var dX = Math.abs(posX - self.entranceChunk.x),
					dY = Math.abs(posY - self.entranceChunk.y);
				
				if ((dX > self.settings.numChunks - 2 && dY > 0) || (dX > 0 && dY > self.settings.numChunks - 2)) isValid = true;
			}

			self.chunkSet[posY][posX] = chunkStatus.EXIT;

			return { x: posX, y: posY };
		};


		// Sets a random blocker cell
		self.SetBlocker = function() {
			var isValid = false;

			while (!isValid) {
				var posX = Math.floor(Math.random() * self.settings.numChunks),
					posY = Math.floor(Math.random() * self.settings.numChunks);
			
				if (self.chunkSet[posY][posX] !== chunkStatus.BLOCKED &&
					self.chunkSet[posY][posX] !== chunkStatus.ENTRANCE &&
					self.chunkSet[posY][posX] !== chunkStatus.EXIT) isValid = true;
			}

			self.chunkSet[posY][posX] = chunkStatus.BLOCKED;
		};


		// Sets the shortest path from entrance to exit
		self.SetPaths = function() {
			// Get path between them
			var path = self.FindShortestPath(self.entranceChunk, self.chunkSet);
			
			// Set the paths
			var pX = self.entranceChunk.x,
				pY = self.entranceChunk.y;

			for (var p = 0; p < path.length; p++) {
				switch(path[p]) {
					case 'North':
						pY -= 1;
						break;
					
					case 'East':
						pX += 1;
						break;
					
					case 'South':
						pY += 1;
						break;
					
					case 'West':
						pX -= 1;
						break;
				}

				self.chunkSet[pY][pX] = (self.chunkSet[pY][pX] === chunkStatus.EXIT) ? chunkStatus.EXIT : chunkStatus.PATH;
			}
		};


		// Sets the status of the cells within the path chunks
		self.SetStatusOfCells = function() {
			var multiplierX = 1,
				multiplierY = 1;
			
			var cellsPerChunkX = Math.floor(self.settings.width / self.settings.numChunks),
				cellsPerChunkY = Math.floor(self.settings.width / self.settings.numChunks);

			for (var cY = 0; cY < self.chunkSet.length; cY++) {
				for (var cX = 0; cX < self.chunkSet[cY].length; cX++) {
					
					var startingX = cellsPerChunkX * cX,
						startingY = cellsPerChunkY * cY;

					//console.log('STARTING -- x: ' + startingX + ' y: ' + startingY);
					//console.log('CELLS PER -- x: ' + cellsPerChunkX * multiplierX + ' y: ' + cellsPerChunkY * multiplierY)

					for (var bY = startingY; bY < cellsPerChunkY * multiplierY; bY++) {
						for (var bX = startingX; bX < cellsPerChunkX * multiplierX; bX++) {
							//console.log('x: ' + bX + ' y: ' + bY);

							if (self.chunkSet[cY][cX] === chunkStatus.PATH ||
								self.chunkSet[cY][cX] === chunkStatus.ENTRANCE ||
								self.chunkSet[cY][cX] === chunkStatus.EXIT) {
									self.board[bY][bX].state = cellState.FLOOR;
							} else {
								self.board[bY][bX].state = cellState.WALL;
							}
						}
					}

					if (multiplierX === self.settings.numChunks) {
						multiplierX = 1;
					} else {
						multiplierX++;
					}
				}

				multiplierY++;
			}
		};

	
		self.Draw = function() {
			for (var y = 0; y < self.board.length; y++) {
				for (var x = 0; x < self.board[y].length; x++) {
					self.board[y][x].Show();
				}
			}
		};



		// A* Pathfinder Algorithm
		self.FindShortestPath = function(entrance, board) {
			var posX = entrance.x,
				posY = entrance.y;
			
			// Set starting location
			var location = {
				x: posX,
				y: posY,
				path: [],
				status: chunkStatus.ENTRANCE
			};

			// Set up the queue
			var queue = [location];

			// Loop through the grid
			while (queue.length > 0) {
				var currentLocation = queue.shift(),
					directions = ['North', 'East', 'South', 'West'];

				for (var d in directions) {
					var newLocation = self.ExploreInDirection(currentLocation, directions[d], board);
					
					if (newLocation.status === chunkStatus.EXIT) {
						return newLocation.path;
					} else if (newLocation.status === chunkStatus.VALID) {
						queue.push(newLocation);
					}
				}
			}

			// No valid path found
			return false;
		};

		self.GetLocationStatus = function(location, board) {
			var boardSize = board.length,
				locX = location.x,
				locY = location.y;

			// Out of bounds
			if (locX < 0 || locX >= boardSize || locY < 0 || locY >= boardSize) {
				return chunkStatus.INVALID;
			
			// Found the goal
			} else if (board[locY][locX] === chunkStatus.EXIT) {
				return chunkStatus.EXIT;

			// Obstacle found
			} else if (board[locY][locX] !== chunkStatus.EMPTY) {
				return chunkStatus.BLOCKED;

			// Valid block
			} else {
				return chunkStatus.VALID;
			}
		};

		self.ExploreInDirection = function(currentLocation, direction, board) {
			var newPath = currentLocation.path.slice(),
				locX = currentLocation.x,
				locY = currentLocation.y;

			newPath.push(direction);

			switch(direction) {
				case 'North':
					locY -= 1;
					break;

				case 'East':
					locX += 1;
					break;
				
				case 'South':
					locY += 1;
					break;
				
				case 'West':
					locX -= 1;
					break;
			}

			var newLocation = {
				x: locX,
				y: locY,
				path: newPath,
				status: 0
			};

			newLocation.status = self.GetLocationStatus(newLocation, board);

			// If this new location is valid, mark it as visited
			if (newLocation.status === chunkStatus.VALID) {
				board[locY][locX] = chunkStatus.EMPTY;
			}

			return newLocation;
		};



		var cellState = {
			WALL: 0,
			FLOOR: 1,
			TREASURE: 2
		}

		function Cell(x, y) {
			this.x = x;
			this.y = y;

			this.state = cellState.FLOOR;

			this.Show = function() {
				var xPos = this.x * self.settings.displaySize,
					yPos = this.y * self.settings.displaySize;

				self.ctx.beginPath();
				self.ctx.rect(xPos, yPos, self.settings.displaySize, self.settings.displaySize);
				
				switch(this.state) {
					case cellState.WALL:
						//self.ctx.fillStyle = '#666';
						self.ctx.fillStyle = '#000';
						break;
					
					case cellState.FLOOR:
						self.ctx.fillStyle = '#333';
						break;

					case cellState.TREASURE:
						self.ctx.fillStyle = '#A5E640';
						break;
				}
				
				self.ctx.fill();
				self.ctx.closePath();
			};
		};
    }

    game.Init(canvas);
})();