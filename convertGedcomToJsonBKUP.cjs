// convertGedcomToJson.cjs
const fs = require('fs');
const { parse, d3ize } = require('gedcom-d3');

// Read the GEDCOM file
const gedcomText = fs.readFileSync('./root.ged', 'utf8');

// Parse and convert to D3-compatible format
const parsed = parse(gedcomText);
const d3Data = d3ize(parsed);

// Output result to JSON file
fs.writeFileSync('./tree.json', JSON.stringify(d3Data, null, 2));

console.log('✅ tree.json has been created.');
