# Caverns

The following repo is a test for generating random caverns for game development use.

### Cellular Automata (index.html)
This is the basic way of generating large open caverns. It doesn't quite serve what I'm looking for, but useful possibly for overworlds.

### Guided Cellular Automata (guided.html)
This approach does the following: 
1. separates the entire board into X chunks
2. fills out some blockers in the chunks
3. randomly picks an entrance and exit chunk
4. runs A-star to find the best path from entrance to exit chunks
5. fills out the board cells based their chunk status
5. runs cellular automata rules against the board

This gets straight forward results that directs the player from one point to another while still giving some randomness to the overall map.
