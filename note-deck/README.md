# Note Deck

A card-shaped note list for Meta Ray-Ban Display glasses. The centre card is upright; adjacent cards rotate around a pivot below the deck so they fan outward like cards held in a hand.

## Use

- With or without the Neural Band, swipe on the glasses' temple to move left/right between cards. Adjacent cards are focusable so the glasses' directional navigation can select them. A desktop keyboard's left/right arrows and a horizontal pointer drag also work.
- Swipe up/down to scroll a long card. At the bottom, down moves to the centred **New note** button; up returns to the card. The deck and editor include a small scroll range behind their stationary layout so the glasses can deliver vertical touchpad movement as arrow, wheel, or scroll events.
- Tap the temple or pinch to open the front card for editing. Use the glasses' two-finger Back gesture or the band's Back gesture to return to the deck.
- The note field receives focus immediately. Select it to open the glasses' dictation composer; web apps cannot open that composer with programmatic focus alone.
- On an existing note in the editor, down moves from the text field to **Delete card** once the text is scrolled to the end; up returns to the text field. A new unsaved note has no Delete action to move to.
- Changes save automatically as text is entered. Use the glasses' Back gesture to return to the deck. **Delete card** sits below an open card and asks for confirmation.
- The deck no longer shows a “Hey Meta” prompt because Meta AI has not routed either tested phrase to this app on the glasses: “make a note” started Meta's audio-note recorder, and “add a card to Note Deck” returned that it could not create decks or cards. Use **New note**, then select the text field for the glasses' dictation composer. The experimental `add_card_to_note_deck` WebMCP action remains registered for devices where Meta enables it, but should not be presented as a working voice shortcut until it passes an on-device test.

The card's creation date appears beside its number. The glasses' app grid has `.well-known/meta-wearables-manifest.json` with a transparent monochrome PNG icon. For clients using older Web App icon discovery, the page also supplies PNG favicons, an Apple touch icon, and `manifest.webmanifest`. Run `swift generate-icons.swift` in this directory to regenerate the PNG assets. Replit Static does not serve the hidden directory directly, so `.replit` rewrites the required Meta manifest URL to a copy in the public directory. The icon appearance on a particular phone or glasses release still requires an on-device check.

Notes are stored in browser local storage on the device where they are created. They do not sync between devices. Each note keeps its creation number, including after deletions. Existing notes from the first version are numbered from oldest to newest when the updated app first opens.

## Local preview

Run `python3 -m http.server 8000` in this directory and open `http://localhost:8000`.

## Replit hosting

The `displayprototypes` repository is imported into Replit. Its **Static pages** deployment serves `note-deck` as the public directory, with no build command. The live URL is [displayprototypes.replit.app](https://displayprototypes.replit.app/). Add that URL in the Meta AI app under Display Glasses settings → App connections → Web apps → Add a web app.

After a deployment, use the glasses' universal Web App menu → **Restart** to load the newest script and stylesheet. Reopening an already running app may retain the previous version.
