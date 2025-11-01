# Coding Test Prompts for LLM Comparison

These prompts are designed to test LLMs' coding capabilities in the context of the AutoBench application. Each prompt should produce runnable HTML/JavaScript code that works in a browser without external dependencies.

## Prompt 1: Particle System with Physics
**Difficulty:** Medium
**Focus:** Algorithms, Physics Simulation, Performance Optimization

```
Particle Fountain
• Runtime: js-canvas
• Create a canvas with 200 particles that flow upward from a central point, like a fountain. Each particle should have:
  - Gravity that pulls it down
  - Initial upward velocity that decays over time
  - Slight random horizontal drift
  - Size that shrinks as it ages
  - Color gradient from bright at birth to faded at death
• Particles should wrap or respawn when they reach the bottom edge
• Add mouse interaction: moving the mouse should create a subtle wind force affecting nearby particles
```

## Prompt 2: Interactive Data Visualization
**Difficulty:** Medium-Hard
**Focus:** Data Structures, Algorithm Design, Visual Design

```
Sorting Algorithm Visualizer
• Runtime: js-canvas
• Visualize three different sorting algorithms side-by-side:
  - Bubble Sort (left column)
  - Quick Sort (middle column)
  - Merge Sort (right column)
• Each visualization should show an array of 30 bars with heights proportional to values
• Animate the sorting process step-by-step with color coding:
  - Blue: elements being compared
  - Green: elements in correct position
  - Red: elements being swapped
• Add controls to start/pause/reset all three visualizations simultaneously
• Make it visually appealing with smooth animations and a clean layout
```

## Prompt 3: Procedural Generation & Art
**Difficulty:** Medium
**Focus:** Creativity, Math, Pattern Generation

```
Kaleidoscope Generator
• Runtime: js-canvas
• Generate a symmetrical, kaleidoscope-like pattern that evolves over time
• Use mathematical functions (sin, cos) to create organic, flowing shapes
• Implement a color palette that shifts smoothly through the spectrum
• Add 8-fold rotational symmetry
• Include mouse interaction: click to "freeze" the current pattern, click again to resume animation
• The pattern should feel organic and mesmerizing, not mechanical
```

## Prompt 4: Game Logic & State Management
**Difficulty:** Hard
**Focus:** Game Design, State Management, User Input Handling

```
Reactive Color Matching Game
• Runtime: js-canvas
• Create a game where colored circles appear in random positions
• Each circle has a color (red, blue, green, yellow) and pulses at a unique rate
• The player clicks circles to collect them into groups by color
• When 3+ circles of the same color are clicked consecutively, they merge into a larger circle with bonus points
• If a wrong color is clicked, the combo resets
• Display score, combo multiplier, and time remaining (60 second rounds)
• Add visual feedback: particle effects on successful matches, screen shake on big combos
• Make it feel satisfying and polished with smooth animations
```

## Prompt 5: Complex Animation System
**Difficulty:** Medium-Hard
**Focus:** Animation Systems, Interpolation, Event Handling

```
Morphing Geometric Shapes
• Runtime: js-canvas
• Create a system where geometric shapes (triangles, squares, pentagons, hexagons) smoothly morph into each other
• Start with 5 shapes arranged in a circle
• Each shape should continuously transition:
  - Number of vertices (triangle → square → pentagon → hexagon → back)
  - Size (pulsing between small and large)
  - Rotation speed (slow to fast and back)
  - Color (cycling through a vibrant palette)
• The morphing should be synchronized so shapes pass through the same states at different times, creating a wave effect
• Add keyboard controls: press 1-5 to "lock" a shape in its current form, press again to unlock
• Make the transitions smooth and organic using easing functions
```

## Prompt 6: Pathfinding Algorithm Visualization
**Difficulty:** Medium-Hard
**Focus:** Graph Algorithms, Visual Feedback, User Interaction

```
A* Pathfinding Visualizer
• Runtime: js-canvas
• Create a grid-based pathfinding visualizer using A* algorithm
• Generate a 30x20 grid where cells can be:
  - Empty (white)
  - Wall (black)
  - Start position (green)
  - End position (red)
  - Visited (light blue)
  - Path (yellow)
• Add mouse controls:
  - Click and drag to draw/erase walls
  - Click to set start position
  - Shift+click to set end position
• When pathfinding is triggered, visualize the algorithm step-by-step:
  - Show which cells are being evaluated
  - Show the final path when found
• Display the path length and number of cells explored
• Add a button to randomly generate walls and find a new path
• Use smooth color transitions for the visualization
```

## Prompt 7: Waveform Audio Visualizer
**Difficulty:** Medium
**Focus:** Data Processing, Visual Rendering, Interactivity

```
Audio Waveform Generator
• Runtime: js-canvas
• Generate a synthetic audio waveform visualization
• Create multiple waveform patterns:
  - Sine wave (default)
  - Square wave
  - Triangle wave
  - Sawtooth wave
  - Combined frequencies (harmonic series)
• Display the waveform scrolling from right to left across the canvas
• Add controls to:
  - Switch between waveform types
  - Adjust frequency (slider: 1Hz to 100Hz)
  - Adjust amplitude (slider: 0.1 to 1.0)
  - Add multiple overlapping waves (up to 3)
• Show frequency domain visualization (FFT-like representation) above the waveform
• Use vibrant colors with smooth gradients
• Add visual effects: particles that bounce off the wave peaks
```

## Prompt 8: Conway's Game of Life
**Difficulty:** Medium
**Focus:** Cellular Automata, State Management, Performance

```
Interactive Conway's Game of Life
• Runtime: js-canvas
• Implement Conway's Game of Life on a 50x50 grid
• Rules:
  - Live cells with 2-3 neighbors survive
  - Dead cells with exactly 3 neighbors become alive
  - All other cells die or stay dead
• Controls:
  - Click cells to toggle them on/off
  - Spacebar to start/pause simulation
  - 'R' to reset to random pattern
  - 'C' to clear all cells
  - Right arrow to step one generation forward
• Display generation count, population count, and FPS
• Use a dark background with glowing cells (green for alive, fading trails)
• Optimize rendering to handle smooth 60fps animation
• Add preset patterns button: glider, blinker, beacon, toad
```

## Prompt 9: Music Visualizer with Particles
**Difficulty:** Hard
**Focus:** Complex Systems, Particle Effects, Visual Design

```
Rhythmic Particle Visualizer
• Runtime: js-canvas
• Create a particle system that responds to a synthetic rhythm
• Generate 500 particles that orbit around the center
• Each particle has:
  - Circular orbit path
  - Size that pulses with the beat
  - Color that shifts based on position and time
  - Glow effect that intensifies on the beat
• Implement a "beat detector" that triggers visual effects:
  - Main beat (every 1 second): large pulse, color shift
  - Secondary beat (every 0.5 seconds): medium pulse
  - Continuous rhythm: subtle background pulse
• Add mouse interaction:
  - Mouse position affects particle orbit radius
  - Click creates a ripple effect through all particles
  - Mouse movement creates a gravitational pull effect
• Use radial gradients and bloom effects for visual appeal
• Display a circular waveform visualization around the center
```

## Prompt 10: Voronoi Diagram Generator
**Difficulty:** Medium-Hard
**Focus:** Computational Geometry, Algorithm Implementation, Visualization

```
Interactive Voronoi Diagram
• Runtime: js-canvas
• Generate a Voronoi diagram (also called Voronoi tessellation)
• Start with 10 randomly placed "seed" points
• Calculate Voronoi cells for each seed point:
  - Each cell contains all points closest to its seed
  - Cells are colored based on the seed's position
• Add interactivity:
  - Click to add new seed points (up to 20)
  - Click and drag to move existing seed points
  - Right-click to remove seed points
  - Mouse position highlights the nearest cell
• Display the seed points as small circles
• Show the edges of Voronoi cells as lines
• Use a color scheme: each cell colored by its seed's distance from center
• Add an option to show the Delaunay triangulation (dual graph) as an overlay
```

## Prompt 11: Tower of Hanoi Solver
**Difficulty:** Medium
**Focus:** Recursive Algorithms, Animation, Game Logic

```
Tower of Hanoi Visualizer
• Runtime: js-canvas
• Create a visual representation of the Tower of Hanoi puzzle
• Three pegs with disks stacked on the leftmost peg (largest to smallest)
• Display 5-7 disks of different colors and sizes
• Implement automatic solver using recursive algorithm
• Animate each move:
  - Disk smoothly slides up
  - Moves horizontally to target peg
  - Smoothly slides down to new position
• Add controls:
  - Play button: animate solution automatically
  - Step button: move one step at a time
  - Reset button: return to initial state
  - Speed slider: adjust animation speed (0.5x to 3x)
• Display move counter and show optimal move count
• Add a manual mode where user can drag disks to solve themselves
• Show which moves are valid (highlight valid target pegs)
```

## Prompt 12: Fractal Tree Generator
**Difficulty:** Medium
**Focus:** Recursion, Mathematical Modeling, Visual Art

```
Interactive Fractal Tree
• Runtime: js-canvas
• Create a recursive fractal tree that grows from a trunk
• Parameters to control:
  - Branch angle (30-60 degrees)
  - Branch length ratio (0.6-0.8)
  - Number of recursive levels (4-8)
  - Trunk thickness and initial height
• Add animation: tree grows from trunk to tips
• Use realistic colors: brown trunk, green foliage at tips
• Add seasonal effects toggle:
  - Spring: green leaves
  - Summer: darker green with fruit (small colored circles)
  - Fall: yellow/orange/red gradient
  - Winter: bare branches (white/silver)
• Mouse interaction:
  - Click to plant new tree at mouse position
  - Mouse position affects branch angle slightly
• Display parameter sliders to adjust tree appearance in real-time
• Add wind effect: branches sway gently with sine wave motion
```

## Prompt 13: Binary Search Tree Visualizer
**Difficulty:** Medium-Hard
**Focus:** Data Structures, Tree Algorithms, Visual Layout

```
Interactive Binary Search Tree
• Runtime: js-canvas
• Create a visual binary search tree that can be manipulated
• Display nodes as circles with values inside
• Show edges connecting parent to child nodes
• Implement insert, delete, and search operations
• Add interactive controls:
  - Input field to insert a number
  - Buttons: Insert, Delete, Search
  - Visual feedback: highlight path during search
  - Animation: show node insertion/deletion step-by-step
• Display node values and structure clearly
• Add traversal visualization:
  - In-order, Pre-order, Post-order
  - Highlight nodes as they're visited
  - Show traversal order with numbers
• Color code nodes:
  - Default: white/gray
  - Being searched: yellow
  - Found: green
  - To be deleted: red
• Auto-balance option: implement AVL tree balancing visualization
```

## Prompt 14: Perlin Noise Landscape
**Difficulty:** Medium-Hard
**Focus:** Procedural Generation, Advanced Math, Visual Effects

```
3D-Looking Perlin Noise Landscape
• Runtime: js-canvas
• Generate a 2D landscape that looks 3D using Perlin noise
• Create a height map using Perlin noise algorithm
• Render landscape with:
  - Color based on height (water: blue, ground: green, peaks: white)
  - Shading to create depth illusion
  - Smooth color transitions between terrain types
• Add animation: landscape slowly shifts/evolves over time
• Mouse interaction:
  - Click to add "mountains" (localized noise peaks)
  - Drag to create "valleys" (lower the terrain)
• Display controls:
  - Regenerate button: create new random landscape
  - Seed input: use specific seed for reproducible landscapes
  - Noise scale slider: adjust terrain detail
  - Color scheme selector: desert, forest, arctic, etc.
• Add a small "character" dot that can be moved with arrow keys, following terrain height
```

## Prompt 15: Network Graph Visualizer
**Difficulty:** Hard
**Focus:** Graph Theory, Force-Directed Layout, Complex Systems

```
Force-Directed Network Graph
• Runtime: js-canvas
• Create an interactive network/graph visualization
• Start with 15-20 nodes connected in a network structure
• Implement force-directed graph layout:
  - Nodes repel each other
  - Edges pull connected nodes together
  - Nodes settle into stable positions
• Visual features:
  - Nodes as colored circles with labels (A-Z)
  - Edges as lines between connected nodes
  - Mouse hover highlights node and its connections
  - Click and drag to move nodes manually
• Add controls:
  - Add Node: creates new node with random connections
  - Remove Node: removes selected node and its edges
  - Add Edge: connect two nodes
  - Reset: regenerate random graph
  - Auto-layout: run force simulation until stable
• Show network metrics:
  - Number of nodes and edges
  - Average degree (connections per node)
  - Density calculation
• Color nodes by their degree (most connected = brighter)
• Add animation: nodes smoothly move as forces balance

---

## Usage Notes

### Original Prompts (1-5):
- **Prompt 1**: Physics simulation, real-time calculations, performance
- **Prompt 2**: Complex algorithm understanding, visualization, UI controls
- **Prompt 3**: Creative problem-solving, mathematical thinking, visual design
- **Prompt 4**: Game development, state management, user experience design
- **Prompt 5**: Animation systems, interpolation, advanced programming concepts

### New Prompts (6-15):
- **Prompt 6**: Graph algorithms, pathfinding, visual feedback
- **Prompt 7**: Signal processing, wave synthesis, data visualization
- **Prompt 8**: Cellular automata, state management, performance optimization
- **Prompt 9**: Complex particle systems, rhythm detection, visual effects
- **Prompt 10**: Computational geometry, Voronoi diagrams, interactive algorithms
- **Prompt 11**: Recursive algorithms, puzzle solving, step-by-step animation
- **Prompt 12**: Recursive structures, parametric generation, seasonal effects
- **Prompt 13**: Data structures, tree algorithms, search visualization
- **Prompt 14**: Procedural generation, Perlin noise, 3D-like rendering
- **Prompt 15**: Graph theory, force simulation, network visualization

Each prompt should result in a single, self-contained HTML document with inline CSS and JavaScript that runs immediately in a browser sandbox.

