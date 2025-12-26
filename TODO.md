# Todo

## Completed ✅

- ✅ (HIGH) fix bug with bid retaining after blind bid toggle
- ✅ (HIGH) allow selecting player to start with first round
- ✅ (HIGH) add an icon to ending play early
- ✅ (HIGH) make bid entry touch friendly and not requiring keyboard
- ✅ (HIGH) add ability to delete a game on the MyGamesPage
- ✅ (HIGH) remove unused GameHistoryPage
- ✅ (HIGH) fix avatar in horizontal score breakdown. it should show name below the avatar instead of next to it
- ✅ (MEDIUM) save automatically when bids are entered
- ✅ (HIGH) add intermediate score review phase between rounds with point deltas on mobile
- ✅ (MEDIUM) add logout functionality
- ✅ (HIGH) Make the number of decks input touch friendly
- ✅ (HIGH) consistent Blind badge above the bid count instead of next to it. Also, make sure that spacing the same with or without the blind badge
- ✅ (HIGH) show bid count consistently. Bid: (count). Don't include the books as a unit next to the count
- ✅ (HIGH) make the copy link button the GameViewPage behave consistently. Specifically, with the animation effect.
- ✅ (HIGH) When all players made a blind bid and then we move into the results collection phase skipping the regular bids phase the view only page still shows the regular bid phase. It should switch the results collection instead. It currently switches only after the first result is inputted.
- ✅ (HIGH) In the bid collector, as soon as an input is made then the bidding is moved to the next player. There should some small delay to allow the owner to adjust up or down the bids. If there's no change for a certain time when move to the next player
- ✅ (HIGH) the blind bid declaration and bid collection should be done in the same order as regular bids (showing indicators doesn't make sense since blind bidding is optional)
- ✅ (HIGH) refactor duplicated bidding logic between BidCollector and GameViewPage into reusable utilities
- ✅ (HIGH) fix number of decks input width - was too wide
- ✅ (HIGH) fix 2-second bid delay timer to start on first click instead of second
- ✅ (HIGH) fix bid synchronization between entry and view-only pages during 2-second delay window
- ✅ (HIGH) fix blind bids showing -1 when transitioning to regular bidding phase
- ✅ (MEDIUM) fix view-only page spacing/overflow with blind bid results
- ✅ (MEDIUM) remove bullseye (🎯) first bidder indicator, keep only pointer and checkmark
- ✅ (HIGH) add collaborative share link feature for one-time edit access
- ✅ (HIGH) move share links to header menu in modal (less prominent, saves space above fold)
- ✅ (HIGH) add running totals to score breakdown with per-round deltas
- ✅ (MEDIUM) simplify mobile score breakdown collapsed view to show only running totals
- ✅ (HIGH) add player reordering capability on game setup page with up/down arrows
- ✅ (MEDIUM) move delete player button to left of avatar (away from reorder arrows)
- ✅ (HIGH) add player reordering to edit game setup dialog
- ✅ (MEDIUM) add "Continue to Regular Bidding" button at top of blind bid phase (skip scrolling)
- ✅ (MEDIUM) reduce bid input delay from 2 seconds to 1.5 seconds
- ✅ (HIGH) make result buttons (Made it/Missed it) side by side on mobile for compact layout
- ✅ (MEDIUM) hide radio buttons in result cards for cleaner appearance
- ✅ (HIGH) show score review phase after round 1 (was auto-starting round 2)

## Remaining

- (MEDIUM) Show score breakdown at the top of the page when blind bid phase
- (LOW) allow editing blind bid, bids and results
- (MEDIUM) do not allow blind bids of 0. It needs to be greater than 0
