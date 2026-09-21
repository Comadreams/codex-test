# Dreamz Project storyboard MVP

Create projects and story cards, edit card details, move cards between status columns with drag and drop or the Move selector, reorder cards within a column, and delete cards. Card details include a title, description, tags, notes, image, and attachment link.

## Run locally

```bash
npm install
npm test
npm run build
npm run dev
```

Open `http://localhost:3000`.

## Storage and team access

This version stores data in this browser's localStorage. It synchronizes tabs in the same browser profile, but does not share data between devices or people. Clearing site data removes the boards. The `DreamzState` types and `useDreamzStore` hook are the boundary to replace with a hosted database and authenticated users when team access is added. Do not use this version for team collaboration or as the only copy of important work.

## Manual checks before merging

1. Create a project and add two cards with distinct titles, notes, descriptions, and tags in different columns.
2. Drag one card onto a card in a populated column, then drag it onto an empty column. Try the Move selector as well.
3. Edit the first card, then the second, then the first again. Verify each form shows its own values, save, and reload.
4. Delete a card, cancel a deletion, add another project, and verify each project's cards stay separate.
