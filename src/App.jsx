import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import rawTree from './data/tree.json';
import TreeView from './components/TreeView';
import PersonView from './components/PersonView';
import HomePage from './components/HomePage';
import SearchResultsModal from './components/SearchResultsModal';

// Place this helper function at the top of your App.jsx file


function App() {
    const individuals = useMemo(() => rawTree.nodes || [], []);
    const families = useMemo(() => rawTree.families || [], []);

    const formatDate = useCallback((dateString) => {
        if (!dateString || dateString.trim() === '' || dateString.trim() === '?') return '?';
        if (dateString.trim().toUpperCase() === 'LIVING') return 'Living';
        const gedcomDateRegex = /^(\d{1,2}\s)?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s(\d{4})$/i;
        if (gedcomDateRegex.test(dateString.trim())) return dateString.trim().toUpperCase();
        const yearOnlyRegex = /^(\d{4})$/;
        if (yearOnlyRegex.test(dateString.trim())) return dateString.trim();
        try {
            const dateObj = new Date(dateString);
            if (!isNaN(dateObj.getTime())) {
                const day = dateObj.getUTCDate();
                const month = dateObj.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
                const year = dateObj.getUTCFullYear();
                return `${day} ${month} ${year}`;
            }
        } catch {
  // do nothing
}
        return dateString;
    }, []);

    const getFullDisplayNameHelper = useCallback((ind) => {
        if (!ind || !ind.name) return 'Unnamed';
        let baseName = ind.name.trim();
        const nameParts = baseName.match(/(.*?)\s*\/(.*?)\//);
        if (nameParts && nameParts.length === 3) {
            baseName = `${nameParts[1].trim()} ${nameParts[2].trim()}`.trim();
        } else {
            baseName = baseName.replace(/\//g, '').trim();
        }
        const nameTags = ind.tree?.filter(tag => tag.tag === 'NAME');
        let suffix = '';
        if (nameTags && nameTags.length > 0) {
            for (const nameTag of nameTags) {
                const nsfxTag = nameTag.tree?.find(subtag => subtag.tag === 'NSFX');
                if (nsfxTag && typeof nsfxTag.data === 'string' && nsfxTag.data.trim() !== '') {
                    suffix = nsfxTag.data.trim();
                    break;
                }
            }
        }
        let finalDisplayName = suffix ? `${baseName} ${suffix}` : baseName;
        return finalDisplayName.replace(/\s*\|\|\s*'Unnamed'/, '').trim();
    }, []);

    const processIndividualData = useCallback((individual) => {
        if (!individual) return null;
        const media = (individual.tree?.filter(tag => tag.tag === 'OBJE') || [])
            .map(objTag => {
                const fileTag = objTag.tree.find(subtag => subtag.tag === 'FILE');
                const isPrimary = objTag.tree.some(subtag => subtag.tag === '_PRIM' && subtag.data === 'Y');
                const isPhotoType = objTag.tree.some(subtag => subtag.tag === '_TYPE' && subtag.data === 'PHOTO');
                const caption = objTag.tree.find(subtag => subtag.tag === 'TITL')?.data || '';
                const description = objTag.tree.find(subtag => subtag.tag === 'NOTE')?.data || '';
                const date = objTag.tree.find(subtag => subtag.tag === '_DATE')?.data || ''; 
                if (fileTag && fileTag.data && isPhotoType) { 
                    return { url: fileTag.data, isPrimary, caption, description, date: formatDate(date), tree: objTag.tree };
                }
                return null;
            }).filter(Boolean);
        const extractedSources = [];
        const processSourceTag = (sourTag) => {
            const pageTag = sourTag.tree?.find(subtag => subtag.tag === 'PAGE');
            if (pageTag && pageTag.data) {
                const pageData = pageTag.data;
                const urlMatch = pageData.match(/URL:\s*(https?:\/\/\S+)/);
                const url = urlMatch ? urlMatch[1] : null;
                if (url) {
                    const directNameTag = sourTag.tree?.find(subtag => subtag.tag === 'NAME');
                    let sourceName = directNameTag?.data?.trim();
                    if (!sourceName) {
                        const nameBeforeUrlMatch = pageData.match(/^(.*?);\s*URL:/);
                        sourceName = nameBeforeUrlMatch ? nameBeforeUrlMatch[1].trim() : pageData.split(';')[0].trim();
                    }
                    return { name: sourceName || url, url: url };
                }
            }
            const webTag = sourTag.tree?.find(subtag => subtag.tag === '_WEBTAG');
            if (webTag) {
                const urlTag = webTag.tree?.find(subsubtag => subsubtag.tag === 'URL');
                const nameTag = webTag.tree?.find(subsubtag => subsubtag.tag === 'NAME');
                if (urlTag && urlTag.data) return { name: nameTag?.data || urlTag.data, url: urlTag.data };
            }
            if (sourTag.data && sourTag.data.startsWith('http')) return { name: sourTag.data, url: sourTag.data };
            return null;
        };
        (individual.tree?.filter(tag => tag.tag === 'SOUR') || []).forEach(sourTag => { const source = processSourceTag(sourTag); if (source) extractedSources.push(source); });
        const tagsToSearchForSources = ['NAME', 'BIRT', 'DEAT', 'MARR', 'EVEN', 'OCCU', 'RESI'];
        tagsToSearchForSources.forEach(mainTag => { (individual.tree?.filter(tag => tag.tag === mainTag) || []).forEach(mainEventTag => { (mainEventTag.tree?.filter(subtag => subtag.tag === 'SOUR') || []).forEach(sourTag => { const source = processSourceTag(sourTag); if (source) extractedSources.push(source); }); }); });
        const uniqueSourcesMap = new Map();
        extractedSources.forEach(source => { if (source?.url) { uniqueSourcesMap.set(source.url, source); } });
        const sources = Array.from(uniqueSourcesMap.values());
        const hasDeatTag = individual.tree?.some(tag => tag.tag === 'DEAT');
        let dod = formatDate(individual.dod);
        if (!hasDeatTag && dod === '?') {
            dod = 'Living';
        }
        if (individual.yod === 'Present') {
            dod = 'Living';
        }
        return { ...individual, displayName: getFullDisplayNameHelper(individual), dob: formatDate(individual.dob), dod: dod, extra: { ...individual.extra, media: media, sources: sources } };
    }, [getFullDisplayNameHelper, formatDate]);

    const processedIndividuals = useMemo(() => individuals.map(ind => processIndividualData(ind)).filter(Boolean), [individuals, processIndividualData]);

    const [person, setPerson] = useState(null);
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showNoResultsMessage, setShowNoResultsMessage] = useState(false);
    const topSectionRef = useRef(null);
    const [treeViewDynamicHeight, setTreeViewDynamicHeight] = useState(600);
    
    const getName = useCallback((entry) => entry?.displayName || 'Unnamed', []);
    const findById = useCallback((id) => processedIndividuals.find(i => i.id === id), [processedIndividuals]);
    const findFamilyByPointer = useCallback((id) => families.find(f => f.id === id || f.pointer === id), [families]);
    
    const extractFamilyDetails = useCallback((fam) => {
        const result = { husband: null, wife: null, children: [] };
        if (!fam?.tree) return result;
        fam.tree.forEach(tag => {
            if (tag.tag === 'HUSB') result.husband = tag.data;
            if (tag.tag === 'WIFE') result.wife = tag.data;
            if (tag.tag === 'CHIL') {
                const frelTag = tag.tree.find(subtag => subtag.tag === '_FREL');
                result.children.push({ id: tag.data, frel: frelTag ? frelTag.data : null });
            }
        });
        return result;
    }, []);

    const getParentsOfIndividual = useCallback((individualId) => {
        if (!individualId) return { father: null, mother: null };
        const individual = findById(individualId);
        if (!individual) return { father: null, mother: null };
        const famcEntry = individual.tree?.find(t => t.tag === 'FAMC');
        const famcPointer = famcEntry?.data;
        if (!famcPointer) return { father: null, mother: null };
        const parentFamily = findFamilyByPointer(famcPointer);
        if (parentFamily) {
            const { husband, wife } = extractFamilyDetails(parentFamily);
            return { father: findById(husband), mother: findById(wife) };
        }
        return { father: null, mother: null };
    }, [findById, findFamilyByPointer, extractFamilyDetails]);

    const handleSetPerson = useCallback((newPerson) => {
        setPerson(newPerson);
    }, []);
    
    const getRelatives = useCallback((currentPerson) => {
        const lineage = { Parents: [], "Paternal Grandparents": [], "Maternal Grandparents": [], Siblings: [], Spouse: [], Children: [] };
        if (!currentPerson) return lineage;
        const personId = currentPerson.id;
        
        const { father, mother } = getParentsOfIndividual(currentPerson.id);
        if (father) lineage.Parents.push(father);
        if (mother) lineage.Parents.push(mother);

        if (father) {
            const paternalGrandparents = getParentsOfIndividual(father.id);
            if (paternalGrandparents.father) lineage["Paternal Grandparents"].push(paternalGrandparents.father);
            if (paternalGrandparents.mother) lineage["Paternal Grandparents"].push(paternalGrandparents.mother);
        }
        if (mother) {
            const maternalGrandparents = getParentsOfIndividual(mother.id);
            if (maternalGrandparents.father) lineage["Maternal Grandparents"].push(maternalGrandparents.father);
            if (maternalGrandparents.mother) lineage["Maternal Grandparents"].push(maternalGrandparents.mother);
        }

        const allSiblingInfo = new Map();
        const addSibling = (siblingPerson, type) => {
            if (!siblingPerson || siblingPerson.id === personId) return;
            if (allSiblingInfo.has(siblingPerson.id)) {
                const existingType = allSiblingInfo.get(siblingPerson.id).type;
                if (type === null || (type && existingType === null) || (type && existingType && type.includes('Half') && existingType === 'Adopted')) {
                    allSiblingInfo.set(siblingPerson.id, { person: siblingPerson, type });
                }
            } else {
                allSiblingInfo.set(siblingPerson.id, { person: siblingPerson, type });
            }
        };

        const primaryFamcEntry = currentPerson.tree?.find(t => t.tag === 'FAMC');
        const directParentFamilyId = primaryFamcEntry?.data;
        if (directParentFamilyId) {
            const parentFamily = findFamilyByPointer(directParentFamilyId);
            if(parentFamily) {
                const { children } = extractFamilyDetails(parentFamily);
                children.forEach(childInfo => {
                    const siblingPerson = findById(childInfo.id);
                    if (siblingPerson) {
                        let siblingType = null;
                        const { father: siblingBioFather, mother: siblingBioMother } = getParentsOfIndividual(siblingPerson.id);
                        const sharesFather = father && siblingBioFather && father.id === siblingBioFather.id;
                        const sharesMother = mother && siblingBioMother && mother.id === siblingBioMother.id;
                        if (sharesFather && sharesMother) siblingType = null;
                        else if (sharesFather) siblingType = 'Paternal Half';
                        else if (sharesMother) siblingType = 'Maternal Half';
                        else if (childInfo.frel === 'adopted') siblingType = 'Adopted';
                        addSibling(siblingPerson, siblingType);
                    }
                });
            }
        }

        if (father) {
            const fatherFAMS = father.tree?.filter(t => t.tag === 'FAMS').map(t => t.data) || [];
            fatherFAMS.forEach(famId => {
                if (famId === directParentFamilyId) return;
                const family = findFamilyByPointer(famId);
                if (family) {
                    const { children } = extractFamilyDetails(family);
                    children.forEach(childInfo => {
                        const siblingPerson = findById(childInfo.id);
                        if (siblingPerson) addSibling(siblingPerson, childInfo.frel === 'adopted' ? 'Adopted (Paternal)' : 'Paternal Half');
                    });
                }
            });
        }
        if (mother) {
            const motherFAMS = mother.tree?.filter(t => t.tag === 'FAMS').map(t => t.data) || [];
            motherFAMS.forEach(famId => {
                if (famId === directParentFamilyId) return;
                const family = findFamilyByPointer(famId);
                if (family) {
                    const { children } = extractFamilyDetails(family);
                    children.forEach(childInfo => {
                        const siblingPerson = findById(childInfo.id);
                        if (siblingPerson) addSibling(siblingPerson, childInfo.frel === 'adopted' ? 'Adopted (Maternal)' : 'Maternal Half');
                    });
                }
            });
        }

        lineage.Siblings = Array.from(allSiblingInfo.values()).sort((a, b) => getName(a.person).localeCompare(getName(b.person)));

        const famsPointers = currentPerson.tree?.filter(t => t.tag === 'FAMS').map(t => t.data) || [];
        famsPointers.forEach(famPointer => {
            const familyAsSpouse = findFamilyByPointer(famPointer);
            if (familyAsSpouse) {
                const { husband, wife, children } = extractFamilyDetails(familyAsSpouse);
                const isDivorced = familyAsSpouse.tree?.some(t => t.tag === 'DIV');
                let spouseRelType = isDivorced ? 'Divorced' : null;
                const spouseId = currentPerson.gender === 'M' ? wife : husband;
                if (spouseId) {
                    const spouse = findById(spouseId);
                    if (spouse && !lineage.Spouse.some(s => s.person.id === spouse.id)) {
                        lineage.Spouse.push({ person: spouse, type: spouseRelType });
                    }
                }
                if (children) {
                    children.forEach(childInfo => {
                        const child = findById(childInfo.id);
                        if (child && !lineage.Children.some(c => c.person.id === child.id)) {
                            let childRelType = childInfo.frel === 'adopted' ? 'Adopted' : null;
                            lineage.Children.push({person: child, type: childRelType});
                        }
                    });
                }
            }
        });

        lineage.onSelect = handleSetPerson;
        return lineage;
    }, [findById, findFamilyByPointer, getParentsOfIndividual, extractFamilyDetails, getName, handleSetPerson]);

    const lineage = useMemo(() => getRelatives(person), [person, getRelatives]);
    
   // All previous code stays the same...

const focusedTreeData = useMemo(() => {
    if (!person) return [];

    const nodeMap = new Map();
    const createNode = (p) => {
        if (!p) return null;
        if (nodeMap.has(p.id)) return nodeMap.get(p.id);
        const node = { name: p.displayName, class: p.gender === 'M' ? 'man' : 'woman', extra: p, marriages: [] };
        nodeMap.set(p.id, node);
        return node;
    };

    const getSpousesOf = (p) => {
        if (!p || !p.tree) return [];
        return p.tree.filter(t => t.tag === 'FAMS').map(famsEntry => {
            const family = findFamilyByPointer(famsEntry.data);
            if (!family) return null;
            const spouseId = p.gender === 'M' ? extractFamilyDetails(family).wife : extractFamilyDetails(family).husband;
            return findById(spouseId);
        }).filter(Boolean);
    };

    const rootNode = createNode(person);
    const fatherNode = createNode(lineage.Parents.find(p => p.gender === 'M'));
    const motherNode = createNode(lineage.Parents.find(p => p.gender === 'F'));

    const siblingNodes = lineage.Siblings.map(s => createNode(s.person)).filter(Boolean);
    const spouseIds = new Set(lineage.Spouse.map(s => s.person.id));
    const cleanSiblingNodes = siblingNodes.filter(n => !spouseIds.has(n.extra.id));

    if (fatherNode && motherNode) {
        if (!fatherNode.marriages.some(m => m.spouse.extra.id === motherNode.extra.id)) {
            fatherNode.marriages.push({ spouse: motherNode, children: [rootNode, ...cleanSiblingNodes] });
        }
    }

    if (fatherNode) {
        const pGF = createNode(lineage["Paternal Grandparents"].find(p => p.gender === 'M'));
        const pGM = createNode(lineage["Paternal Grandparents"].find(p => p.gender === 'F'));
        if (pGF) fatherNode.father = pGF;
        if (pGM) fatherNode.mother = pGM;
        if (pGF && pGM && !pGF.marriages.some(m => m.spouse.extra.id === pGM.extra.id)) {
            pGF.marriages.push({ spouse: pGM, children: [fatherNode] });
        }
    }

    if (motherNode) {
        const mGF = createNode(lineage["Maternal Grandparents"].find(p => p.gender === 'M'));
        const mGM = createNode(lineage["Maternal Grandparents"].find(p => p.gender === 'F'));
        if (mGF) motherNode.father = mGF;
        if (mGM) motherNode.mother = mGM;
        if (mGF && mGM && !mGF.marriages.some(m => m.spouse.extra.id === mGM.extra.id)) {
            mGF.marriages.push({ spouse: mGM, children: [motherNode] });
        }
    }

    lineage.Spouse.forEach(s => {
        const spouseNode = createNode(s.person);
        const childrenOfThisUnion = lineage.Children
            .filter(c => {
                const parents = getParentsOfIndividual(c.person.id);
                return (parents.father?.id === person.id && parents.mother?.id === s.person.id) ||
                       (parents.mother?.id === person.id && parents.father?.id === s.person.id);
            })
            .map(c => createNode(c.person)).filter(Boolean);

        if (spouseNode && !rootNode.marriages.some(m => m.spouse.extra.id === spouseNode.extra.id)) {
            rootNode.marriages.push({ spouse: spouseNode, children: childrenOfThisUnion });
        }
    });

    siblingNodes.forEach(sibNode => {
        const siblingSpouses = getSpousesOf(sibNode.extra);
        siblingSpouses.forEach(spouse => {
            const spouseNode = createNode(spouse);
            if (spouseNode && !sibNode.marriages.some(m => m.spouse.extra.id === spouseNode.extra.id)) {
                sibNode.marriages.push({ spouse: spouseNode, children: [] });
            }
        });
    });

    const rootCandidates = [
        lineage["Paternal Grandparents"].find(p => p.gender === 'M'),
        lineage["Maternal Grandparents"].find(p => p.gender === 'M'),
        lineage.Parents.find(p => p.gender === 'M'),
        lineage.Parents.find(p => p.gender === 'F'),
        person
    ];

    const root = createNode(rootCandidates.find(p => p));
    return root ? [root] : [];

}, [person, lineage, findById, findFamilyByPointer, getParentsOfIndividual, extractFamilyDetails]);


    useEffect(() => {
        if (topSectionRef.current) setTreeViewDynamicHeight(window.innerHeight - topSectionRef.current.offsetHeight);
    }, [person]);

    const handleSearchSubmit = useCallback((searchTerm) => {
        if (!searchTerm) return;
        const matches = processedIndividuals.filter(p => p.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
        setShowNoResultsMessage(matches.length === 0);
        if (matches.length === 1) { handleSetPerson(matches[0]); setSearchResults([]); }
        else if (matches.length > 1) setSearchResults(matches);
    }, [processedIndividuals, handleSetPerson]);
    
    const handleSelectSearchResult = useCallback((p) => { handleSetPerson(p); setSearchResults([]); }, [handleSetPerson]);
    const handleCloseSearchResults = useCallback(() => setSearchResults([]), []);
    const handleViewSampleTree = useCallback(() => handleSetPerson(findById('@I312@')), [findById, handleSetPerson]);
    const handleGoToGiovanni = useCallback(() => handleSetPerson(findById('@I214@')), [findById, handleSetPerson]);
    const goToHomePage = useCallback(() => handleSetPerson(null), [handleSetPerson]);

    return (
        <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {person && (
                <div ref={topSectionRef} style={{ textAlign: 'center', padding: '1rem', borderBottom: '1px solid #ddd' }}>
                    <h1 onClick={goToHomePage} style={{ cursor: 'pointer', margin: '0 0 1rem 0' }}>Candeloro Family Tree</h1>
                    <div>
                        <input type="text" placeholder="Search another name..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(query)} style={{ padding: '0.5rem', fontSize: '1rem' }}/>
                        <button onClick={() => handleSearchSubmit(query)} style={{ padding: '0.5rem 1rem', marginLeft: '10px' }}>Search</button>
                    </div>
                </div>
            )}
            {person ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <PersonView person={person} lineage={lineage} />
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <TreeView 
                            data={focusedTreeData} 
                            onNodeClick={handleSetPerson} 
                            treeHeight={treeViewDynamicHeight}
                            focusId={person.id}
                        />
                    </div>
                </div>
            ) : (
                <>
                    <HomePage onSearchSubmit={handleSearchSubmit} onSampleTreeClick={handleViewSampleTree} onGoToGiovanni={handleGoToGiovanni} />
                    {showNoResultsMessage && <p style={{ textAlign: 'center', color: 'red' }}>No results found.</p>}
                </>
            )}
            {searchResults.length > 0 && <SearchResultsModal results={searchResults} onSelectPerson={handleSelectSearchResult} onClose={handleCloseSearchResults} />}
        </div>
    );
}

export default App;
