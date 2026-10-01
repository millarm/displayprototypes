# Navigation learnings for Meta Ray-Ban Display web apps

These notes come from testing Note Deck on Meta Ray-Ban Display glasses with the Neural Band removed. They describe observed behaviour in this app, not a guarantee about every firmware or Web App release. Use the device as the final test target.

## What we observed

- One-finger temple swipes moved left and right between cards. A temple tap selected a card; the two-finger Back gesture returned from the editor. Native glasses menus also responded to up and down swipes, so the hardware was working.
- Up and down swipes did **not** navigate Note Deck while its page had `overflow: hidden`. Adding more `ArrowUp`/`ArrowDown` and `wheel` handlers did not help.
- An early input-test page received arrow and scroll/wheel activity, but it had a scrollable body. It was therefore not an accurate reproduction of Note Deck's locked layout.
- In Note Deck's `?input-debug=1` readout, focus changes incremented while key and wheel counts did not. That readout alone did not tell us what the browser did with the vertical gesture. Once a scroll range was present, scroll events provided a usable vertical signal.
- Making the whole page scrollable restored vertical navigation, but exposed a scrollbar at the right edge. CSS rules intended to hide the root scrollbar did not remove it on the glasses.
- Making the full-screen editor itself scrollable produced a screen-edge focus box and disrupted selection/navigation in the editor. Keeping the editor non-scrollable and letting a shared ancestor receive the scroll resolved that regression.

## Working layout pattern

Note Deck uses one scrollable ancestor for both the deck and editor:

1. A viewport-sized outer `.scroll-window` clips overflow.
2. Its inner `.scroll-surface` is 24 px wider than the viewport and has 24 px of right padding. The browser's scrollbar lies beyond the clipped edge.
3. A 240 px `.scroll-space` after the sticky `.app-shell` creates vertical travel. The shell stays visually stationary as the surface scrolls.
4. The editor is an absolutely positioned, non-modal `dialog` **inside** the sticky shell. It is not a second scroll surface. While open, the deck view is `inert`, and the note text field receives focus.
5. The scroll handler measures movement away from a midpoint (`scrollTop = 120`), restores that midpoint, and translates movement into the app's vertical action. A small threshold and time guard prevent scroll noise from triggering repeated moves.

The relevant implementation is in [`note-deck/index.html`](note-deck/index.html), [`note-deck/styles.css`](note-deck/styles.css), and [`note-deck/app.js`](note-deck/app.js). This is a fallback alongside arrow-key and wheel handling, since the event path can vary by input method.

## Interaction and focus rules

- Keep actionable controls near the centre of the display. Edge furniture was distracting and hard to use on the glasses.
- Make the front and adjacent cards focusable for horizontal movement. The front card gets focus after a deck change or when leaving the editor.
- In the deck, a down movement scrolls long card content first, then focuses **New note**. Up from **New note** returns to the front card.
- In an existing note, a down movement scrolls long text first, then focuses **Delete card**. Up from **Delete card** returns to the text field.
- Use `focus({ preventScroll: true })` for these transitions. Programmatic focus alone does not open the glasses' dictation composer; the wearer must select the text field.
- The browser Back action and Escape should close the editor, save the draft, and restore deck focus. A non-modal dialog needs explicit Escape handling.

## How to diagnose a new navigation problem

1. Check whether the same gesture works in the glasses' native menus. This separates a device input problem from an app problem.
2. Reproduce the **actual app layout**, including its overflow and focus behaviour. A standalone test page that scrolls can receive events that the app never sees.
3. Open Note Deck with `?input-debug=1` during a device test. Compare key, wheel, scroll, and focus counts while moving in each direction. The readout is diagnostic only; normal users should open the URL without that query parameter.
4. Inspect which element has focus after each movement. A full-screen scrollable dialog may take focus and show a border around the screen instead of exposing its text field or button.
5. Test the deck and editor separately, with short and long notes. Confirm down, up, selection, and Back on the glasses after deployment. Restart the Web App from the glasses' universal menu to load updated assets.

The key lesson is that a vertical gesture can be expressed through **scrolling of a scrollable ancestor**. Preventing that scroll at the page or editor level can remove the only signal the app receives, even when horizontal navigation and native device menus still work.
