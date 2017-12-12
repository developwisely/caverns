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
            height: 10,
            width: 10,
            displaySize: 1,
            numChunks: 5
        };

        self.Init = function(canvas) {
            canvas.width = self.settings.width;
            canvas.height = self.settings.height;

			self.ctx = canvas.getContext('2d');

            self.cols = Math.floor(self.settings.width / self.settings.displaySize);  // x
            self.rows = Math.floor(self.settings.height / self.settings.displaySize); // y

			for (var y = 0; y < self.rows; y++) {
				for (var x = 0; x < self.cols; x++) {
					var cell = new Cell(x, y);
					self.board.push(cell);
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

			// Run path algorithm
			self.SetPaths();

			// Set all the cells in the chunks to their values
			self.SetStatusOfCells();


			//debug
			self.Draw();
				
			// run random caverns.js cellular automata on map
				// CAVES!!!
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

			// Exit must be at least 3 blocks away from entrance
			while (!isValid) {
				var posX = Math.floor(Math.random() * self.settings.numChunks),
					posY = Math.floor(Math.random() * self.settings.numChunks);

				var dX = Math.abs(posX - self.entranceChunk.x),
					dY = Math.abs(posY - self.entranceChunk.y);
				
				if (dX > 3 || dY > 3) isValid = true;
			}

			self.chunkSet[posY][posX] = chunkStatus.EXIT;

			return { x: posX, y: posY };
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

							for (var cell in self.board) {
								if (self.board[cell].x !== bX || self.board[cell].y !== bY) continue;

								if (self.chunkSet[cY][cX] === chunkStatus.PATH ||
									self.chunkSet[cY][cX] === chunkStatus.ENTRANCE ||
									self.chunkSet[cY][cX] === chunkStatus.EXIT) {
										self.board[cell].state = false;
								} else {
									self.board[cell].state = true;
								}	
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
			for (var c = 0; c < self.board.length; c++) {
				self.board[c].Show();
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




		function Cell(x, y) {
			this.x = x;
			this.y = y;

			this.state = false;

			this.Show = function() {
				var xPos = this.x * self.settings.displaySize,
					yPos = this.y * self.settings.displaySize;

				self.ctx.beginPath();
				self.ctx.rect(xPos, yPos, self.settings.displaySize, self.settings.displaySize);
				
				if (this.state) {
					self.ctx.fillStyle = '#333';
				} else {
					self.ctx.fillStyle = '#666';
				}
				
				self.ctx.fill();
				self.ctx.closePath();
			}
		};
    }

    game.Init(canvas);
})();