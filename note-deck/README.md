# Note Deck

A card-shaped note list for Meta Ray-Ban Display glasses. The centre card is upright; adjacent cards rotate around a pivot below the deck so they fan outward like cards held in a hand.

## Use

- Use left/right on the glasses, keyboard, or a horizontal pointer drag to move through cards.
- Select the front card to edit it, or select **New note** to create one. Select the text field to use the glasses' dictation composer.
- If the glasses' WebMCP preview is available while this app is open, Meta AI can call the `make_note` action. Outside the open app, generic “Hey Meta, make a note” invocation is not provided by this web app.

Notes are stored in browser local storage on the device where they are created. They do not sync between devices. The three example cards are shown only when the deck has no saved notes.

## Local preview

Run `python3 -m http.server 8000` in this directory and open `http://localhost:8000`.

## Replit hosting

Import these files into a Replit project, then choose a **Static** deployment. Set its public directory to the project root (`/`); no build command is needed. Publish to a public HTTPS `*.replit.app` URL, then add that URL in the Meta AI app under Display Glasses settings → App connections → Web apps → Add a web app.
