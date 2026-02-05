# Beer Pong League

A comprehensive beer pong league management system with visual game interface, statistics tracking, and leaderboards.

## Features

### Team Management
- Add unlimited teams with two players each
- Custom team names or auto-generated from player names
- Delete teams as needed
- View quick stats for each team

### Game Play
- **Visual Beer Pong Table**: Interactive SVG representation of a standard 10-cup triangle formation
- **Referee Interface**: Easy-to-use controls for recording shots
  - Click on cups to record makes
  - Miss button for missed shots
  - Undo button to correct mistakes
- **Real-time Statistics**: Live tracking during games
- **Turn Indicator**: Clear display of which team and player is shooting

### Series Management
- Play single games or best-of series (3, 5, or 7 games)
- Automatic series tracking and progression
- Series winner determined automatically

### Statistics Tracked

#### Team Stats:
- Games Won/Played
- Series Won/Played
- Total Shots/Makes/Misses
- Shooting Accuracy
- Islands Made (cups with no neighbors)
- Clutch Shots (game-winning final shots)
- Perfect Games
- Comebacks

#### Individual Player Stats:
- Shots/Makes/Misses per player
- Individual accuracy
- Islands per player
- Games played

### Leaderboards
- **Win Rate**: Teams ranked by winning percentage
- **Accuracy**: Teams ranked by shooting percentage
- **Islands**: Teams ranked by island shots made
- **Clutch Factor**: Teams ranked by game-winning shots

### Data Persistence
- All data automatically saved to browser localStorage
- Data persists between sessions
- No server or database required

## How to Use

### Getting Started
1. Open `index.html` in any modern web browser
2. Start by adding teams in the "Manage Teams" section
3. Add at least 2 teams to begin playing

### Adding Teams
1. Click "Manage Teams" from main menu
2. Enter Player 1 and Player 2 names
3. Optionally enter a team name (otherwise auto-generated)
4. Click "Add Team"

### Starting a Series
1. Click "Start New Series" from main menu
2. Select Team 1 and Team 2 from dropdowns
3. Choose series length (single game or best-of 3/5/7)
4. Click "Start Series"

### Playing a Game (Referee View)
1. The game interface shows two beer pong tables side-by-side
2. The shooting team/player is highlighted in the center
3. **To record a make**: Click on the cup that was made on the OPPONENT's table
4. **To record a miss**: Click the "MISS" button
5. **To undo**: Click the "UNDO" button to reverse the last action
6. Game automatically ends when all cups on one side are eliminated
7. Series continues until one team reaches the required wins

### Special Shots
- **Islands**: Automatically detected when a cup with no neighboring cups is made
- **Clutch Shots**: Automatically recorded when the final cup is made to win the game

### Viewing Statistics
1. Click "View Statistics" from main menu
2. Select "All Teams" or filter by specific team
3. View detailed breakdowns of team and player performance

### Leaderboards
1. Click "Leaderboard" from main menu
2. Switch between different categories using tabs
3. Top 3 teams are highlighted with gold, silver, bronze

## Game Rules Implemented

- Standard 10-cup triangle formation (4-3-2-1)
- Players alternate shots (both teammates shoot before switching teams)
- Islands are cups with no neighbors (touching distance)
- Game ends when all opponent cups are eliminated
- Series winner is first to reach majority of games

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Graphics**: SVG for cup visualization
- **Storage**: Browser localStorage API
- **No dependencies**: Runs entirely in the browser with no external libraries

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Tips for Referees

1. Keep the interface visible to both teams for transparency
2. Use the undo button if you make a mistake - don't restart the game
3. The turn indicator shows who's currently shooting
4. Game events log shows recent actions for verification
5. Live stats update after each shot

## Data Management

- All data is stored locally in your browser
- To backup data: Use browser developer tools to export localStorage
- To reset: Clear browser data for this site
- Data persists indefinitely unless browser data is cleared

## Future Enhancement Ideas

- Overtime/Rebuttal rules
- Custom cup formations
- Team photos/avatars
- Export stats to CSV
- Print brackets for tournaments
- Mobile-optimized interface
- Sound effects
- Animation effects for makes/islands

---

Enjoy your Beer Pong League!
