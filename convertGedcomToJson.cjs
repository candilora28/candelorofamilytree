// convertGedcomToJson.cjs
const fs = require('fs');
const path = require('path');
const { parse, d3ize } = require('gedcom-d3');

// Helper function to extract data from a GEDCOM node's children based on tag
function extractGedcomDetail(node, tag) {
    if (!node || !node.tree || !Array.isArray(node.tree)) {
        return '';
    }
    const detailNode = node.tree.find(child => child.tag === tag);
    return detailNode ? detailNode.data : '';
}

// Function to process a raw file path into a web-accessible URL
function getWebUrlFromLocalPath(localFilePath) {
    if (!localFilePath) return '';

    const normalizedFilePath = localFilePath.replace(/\\/g, '/');
    const localBasePath = "C:/Users/kcsup/Documents/test_media/";
    const publicWebBaseUrl = '/photos/';

    let relativePath = normalizedFilePath;

    if (normalizedFilePath.startsWith(localBasePath)) {
        relativePath = normalizedFilePath.substring(localBasePath.length);
    } else {
        if (normalizedFilePath.startsWith(publicWebBaseUrl)) {
             return normalizedFilePath;
        }
        const filename = normalizedFilePath.split('/').pop();
        return `${publicWebBaseUrl}${filename}`;
    }

    if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
    }
    
    return `${publicWebBaseUrl}${relativePath}`;
}

// --- Main script execution with error handling ---
try {
    const gedcomFilePath = './root.ged';
    const jsonOutputFilePath = './tree.json';
    // Removed debugOutputFilePath as it's not being created


    if (!fs.existsSync(gedcomFilePath)) {
        console.error(`ERROR: GEDCOM file not found at: ${path.resolve(gedcomFilePath)}`);
        console.error('Please ensure "root.ged" is in the same directory as this script.');
        process.exit(1);
    }
    console.log(`DEBUG: GEDCOM file found at: ${path.resolve(gedcomFilePath)}`);

    console.log('DEBUG: Reading GEDCOM file...');
    const gedcomText = fs.readFileSync(gedcomFilePath, 'utf8');
    console.log(`DEBUG: GEDCOM file read successfully. Size: ${gedcomText.length} bytes.`);

    console.log('DEBUG: Parsing GEDCOM data...');
    const parsedGedcom = parse(gedcomText); // Raw parsed data
    console.log('DEBUG: GEDCOM data parsed successfully.');

    // --- NEW INLINE DEBUGGING: Log parsedGedcom's top-level records ---
    console.log('DEBUG: --- INLINE parsedGedcom TOP-LEVEL RECORDS ---');
    if (Array.isArray(parsedGedcom)) {
        let objeCount = 0;
        parsedGedcom.slice(0, Math.min(100, parsedGedcom.length)).forEach((record, index) => { // Log first 100 records
            if (record && typeof record === 'object') {
                if (record.tag === 'OBJE' && record.pointer) {
                    objeCount++;
                    console.log(`DEBUG:  Record ${index}: Found OBJE. Pointer: ${record.pointer}, Tree length: ${record.tree ? record.tree.length : 'N/A'}`);
                    // Log first few children of the OBJE's tree if it exists
                    if (record.tree && Array.isArray(record.tree) && record.tree.length > 0) {
                        record.tree.slice(0, Math.min(5, record.tree.length)).forEach((child, childIndex) => {
                            console.log(`DEBUG:    Child ${childIndex}: tag=${child.tag}, data=${child.data}`);
                        });
                    }
                } else {
                    // Log other record types, but less verbosely
                    // console.log(`DEBUG:  Record ${index}: tag=${record.tag}, pointer=${record.pointer || 'N/A'}`);
                }
            } else {
                console.log(`DEBUG:  Record ${index}: Not an object or is null/undefined.`);
            }
        });
        console.log(`DEBUG: Total OBJE records in first 100: ${objeCount}`);
        console.log(`DEBUG: Total records in parsedGedcom: ${parsedGedcom.length}`);
    } else {
        console.log('DEBUG: parsedGedcom is not a top-level array.');
    }
    console.log('DEBUG: --- END INLINE parsedGedcom TOP-LEVEL RECORDS ---');


    // --- STEP 1: Create a map of ALL raw media objects by pointer (GEDCOM ID) ---
    const rawMediaObjectsMap = new Map();

    // The super-robust, deep-scanning collection function
    const deepFindMediaObjects = (currentData) => {
        if (Array.isArray(currentData)) {
            currentData.forEach(item => deepFindMediaObjects(item));
        } else if (currentData && typeof currentData === 'object') {
            // Check if the current object is an OBJE record
            if (currentData.tag === 'OBJE' && currentData.pointer) {
                rawMediaObjectsMap.set(currentData.pointer, currentData);
            }
            // Recursively check all properties that might contain nested data
            Object.values(currentData).forEach(value => deepFindMediaObjects(value));
        }
    };

    // Start the deep scan from the root of the parsedGedcom object
    deepFindMediaObjects(parsedGedcom);

    console.log(`DEBUG: Collected ${rawMediaObjectsMap.size} raw media objects by pointer.`);

    // --- STEP 2: Convert the ORIGINAL, UNTOUCHED parsed data to D3-compatible format ---
    console.log('DEBUG: Converting raw parsed data to D3 format (this might simplify media data)...');
    const d3Data = d3ize(parsedGedcom); // This will generate the tree.json structure
    console.log('DEBUG: Data converted to D3 format successfully.');

    // --- STEP 3: Post-processing: Enrich media objects in d3Data using raw data ---
    console.log('DEBUG: Starting post-processing to enrich media objects in d3Data...');

    function enrichD3MediaNode(node) {
        if (!node || typeof node !== 'object') return;

        // If this node has an 'extra.media' array, process it
        if (node.extra && node.extra.media && Array.isArray(node.extra.media)) {
            node.extra.media = node.extra.media.map((mediaItem) => {
                if (mediaItem.pointer && rawMediaObjectsMap.has(mediaItem.pointer)) {
                    const rawMediaObject = rawMediaObjectsMap.get(mediaItem.pointer);
                    
                    const extractedCaption = extractGedcomDetail(rawMediaObject, 'TITL');
                    const extractedDescription = extractGedcomDetail(rawMediaObject, 'NOTE');
                    const extractedDate = extractGedcomDetail(rawMediaObject, '_DATE');
                    const extractedFilePath = extractGedcomDetail(rawMediaObject, 'FILE');
                    const extractedIsPrimary = extractGedcomDetail(rawMediaObject, '_PRIM') === 'Y';

                    return {
                        ...mediaItem, 
                        url: getWebUrlFromLocalPath(extractedFilePath),
                        caption: extractedCaption,
                        description: extractedDescription,
                        date: extractedDate,
                        isPrimary: extractedIsPrimary
                    };

                } else if (mediaItem.url && !mediaItem.pointer) {
                    console.warn(`  WARNING: Media item with URL ${mediaItem.url} found without pointer. Cannot enrich with original GEDCOM data.`); 
                } else if (mediaItem.pointer && !rawMediaObjectsMap.has(mediaItem.pointer)) {
                    console.warn(`  WARNING: Media item with pointer ${mediaItem.pointer} not found in rawMediaObjectsMap. Skipping enrichment.`);
                }
                return mediaItem;
            });
        }
        
        // Recursively apply to children of the current node
        Object.values(node).forEach(value => {
            if (value && typeof value === 'object') {
                enrichD3MediaNode(value);
            }
        });
    }

    // Start enrichment from the root of the d3Data object
    enrichD3MediaNode(d3Data); 

    console.log('DEBUG: Post-processing enrichment complete.');

    console.log(`DEBUG: Writing D3 data to JSON file: ${path.resolve(jsonOutputFilePath)}`);
    fs.writeFileSync(jsonOutputFilePath, JSON.stringify(d3Data, null, 2));
    console.log('✅ tree.json has been created with enriched media data.');

} catch (error) {
    console.error('CRITICAL ERROR: An unexpected error occurred during GEDCOM processing:');
    console.error(error);
    if (error.stack) {
        console.error('Stack trace:', error.stack);
    }
    process.exit(1);
}