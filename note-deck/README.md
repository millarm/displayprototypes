# Note Deck

A card-shaped note list for Meta Ray-Ban Display glasses. The centre card is upright; adjacent cards rotate around a pivot below the deck so they fan outward like cards held in a hand.

## Use

- Use left/right on the glasses, keyboard, or a horizontal pointer drag to move through cards.
- Scroll long cards up/down while they are in the deck; their full text is available without opening the editor.
- Pinch to select the front card and edit or append to its text. Select the centred **New note** button to create one.
- The note field receives focus immediately. Select it to open the glasses' dictation composer; web apps cannot open that composer with programmatic focus alone.
- Changes save automatically as text is entered. Use the glasses' Back gesture to return to the deck. **Delete card** sits below an open card and asks for confirmation.
- With the app open and the glasses' WebMCP preview available, try “Hey Meta, make a note: [your words].” Meta AI can call the app's `make_note` action. Outside the open app, generic voice invocation is not provided by this web app.

The card's creation date appears beside its number. The hosted `icon.svg` is the web app favicon and a source asset for a future 80 × 80 px catalogue thumbnail. Meta's current public instructions for connecting a web app do not document a separate launcher icon upload.

Notes are stored in browser local storage on the device where they are created. They do not sync between devices. Each note keeps its creation number, including after deletions. Existing notes from the first version are numbered from oldest to newest when the updated app first opens.

## Local preview

Run `python3 -m http.server 8000` in this directory and open `http://localhost:8000`.

## Replit hosting

The `displayprototypes` repository is imported into Replit. Its **Static pages** deployment serves `note-deck` as the public directory, with no build command. The live URL is [displayprototypes.replit.app](https://displayprototypes.replit.app/). Add that URL in the Meta AI app under Display Glasses settings → App connections → Web apps → Add a web app.
