# Spreadsheet Grid (React)

This is a simple spreadsheet-like web app built using React.  
It supports basic features like formulas, sorting, copy-paste, and saving data locally.

## Features

- Column sorting (ascending, descending, reset)
- Basic formula support (example: =A1*2)
- Multi-cell paste from Excel / Google Sheets
- Copy cell values
- Undo functionality
- Data persistence using localStorage (auto-save)

## How it works

- Each cell stores both value and formula
- Formulas are parsed and evaluated when entered
- Sorting is applied only to the view (data stays intact)
- Clipboard handles tab-separated values for multi-cell paste
- Data is saved automatically with a small delay

## Tech Used

- React (Vite)
- JavaScript
- LocalStorage

## Run Locally

npm install  
npm run dev  

