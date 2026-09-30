# Note Deck

A card-shaped note list for Meta Ray-Ban Display glasses. The centre card is upright; adjacent cards rotate around a pivot below the deck so they fan outward like cards held in a hand.

## Use

- Use left/right on the glasses, keyboard, or a horizontal pointer drag to move through cards.
- Scroll long cards up/down while they are in the deck; their full text is available without opening the editor.
- Pinch to select the front card and edit or append to its text. Select the centred **New note** button to create one.
- The note field receives focus immediately. Select it to open the glasses' dictation composer; web apps cannot open that composer with programmatic focus alone.
- Changes save automatically as text is entered. Use the glasses' Back gesture to return to the deck. **Delete card** sits below an open card and asks for confirmation.
- The deck no longer shows a “Hey Meta” prompt because Meta AI has not routed either tested phrase to this app on the glasses: “make a note” started Meta's audio-note recorder, and “add a card to Note Deck” returned that it could not create decks or cards. Use **New note**, then select the text field for the glasses' dictation composer. The experimental `add_card_to_note_deck` WebMCP action remains registered for devices where Meta enables it, but should not be presented as a working voice shortcut until it passes an on-device test.

The card's creation date appears beside its number. The hosted `icon.svg` is the browser favicon. The glasses' app grid uses `.well-known/meta-wearables-manifest.json` and its transparent monochrome `launcher-icon.svg`, tinted by the manifest's theme color. Replit Static does not serve the hidden directory directly, so `.replit` rewrites the required URL to a copy in the public directory. The icon shown in the app grid may refresh when the glasses reconnect or the app is re-added.

Notes are stored in browser local storage on the device where they are created. They do not sync between devices. Each note keeps its creation number, including after deletions. Existing notes from the first version are numbered from oldest to newest when the updated app first opens.

## Local preview

Run `python3 -m http.server 8000` in this directory and open `http://localhost:8000`.

## Replit hosting

The `displayprototypes` repository is imported into Replit. Its **Static pages** deployment serves `note-deck` as the public directory, with no build command. The live URL is [displayprototypes.replit.app](https://displayprototypes.replit.app/). Add that URL in the Meta AI app under Display Glasses settings → App connections → Web apps → Add a web app.
