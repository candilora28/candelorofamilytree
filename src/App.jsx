import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import rawTree from './data/tree.json';
import TreeView from './components/TreeView';
import PersonView from './components/PersonView';
import HomePage from './components/HomePage';
import SearchResultsModal from './components/SearchResultsModal';


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
    
    // Helper function to calculate distance to ancestor
    const getDistanceToAncestor = useCallback((person, ancestor) => {
        if (person.id === ancestor.id) return 0;
        
        const { father, mother } = getParentsOfIndividual(person.id);
        if (father) {
            const fatherDistance = getDistanceToAncestor(father, ancestor);
            if (fatherDistance !== -1) return fatherDistance + 1;
        }
        if (mother) {
            const motherDistance = getDistanceToAncestor(mother, ancestor);
            if (motherDistance !== -1) return motherDistance + 1;
        }
        
        return -1; // Not found
    }, [getParentsOfIndividual]);
    
const detectRelationship = useCallback((name1, name2) => {
  if (!name1 || !name2) return 'Please provide two names.';
  if (name1 === name2) return 'Please provide two different names.';

  const findByName = (name) => {
    // First try to find by exact displayName match
    let person = processedIndividuals.find(p => p.displayName === name);
    if (person) return person;
    
    // If not found, try to find by name with dates
    person = processedIndividuals.find(p => {
      let fullName = p.displayName;
      if (p.dob && p.dob !== '?' && p.dob !== 'Unknown') {
        fullName += ` (b. ${p.dob}`;
        if (p.dod && p.dod !== '?' && p.dod !== 'Unknown' && p.dod !== 'Living') {
          fullName += ` - d. ${p.dod}`;
        }
        fullName += ')';
      } else if (p.dod && p.dod !== '?' && p.dod !== 'Unknown' && p.dod !== 'Living') {
        fullName += ` (d. ${p.dod})`;
      }
      return fullName === name;
    });
    
    if (person) return person;
    
    // If still not found, try partial matching (in case user typed just part of the name)
    return processedIndividuals.find(p => {
      let fullName = p.displayName;
      if (p.dob && p.dob !== '?' && p.dob !== 'Unknown') {
        fullName += ` (b. ${p.dob}`;
        if (p.dod && p.dod !== '?' && p.dod !== 'Unknown' && p.dod !== 'Living') {
          fullName += ` - d. ${p.dod}`;
        }
        fullName += ')';
      } else if (p.dod && p.dod !== '?' && p.dod !== 'Unknown' && p.dod !== 'Living') {
        fullName += ` (d. ${p.dod})`;
      }
      return fullName.toLowerCase().includes(name.toLowerCase()) || p.displayName.toLowerCase().includes(name.toLowerCase());
    });
  };
  const person1 = findByName(name1);
  const person2 = findByName(name2);

  if (!person1 || !person2) return 'One or both people not found.';
  if (person1.id === person2.id) return 'Same person';

  // Debug logging to see what we're working with
  console.log('Person 1:', person1.displayName, person1.id);
  console.log('Person 2:', person2.displayName, person2.id);





  // Use the same logic that works in getRelatives - this should be bulletproof
  const getPersonRelatives = (currentPerson) => {
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

    // Get siblings
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
        if (famId) {
          const { children } = extractFamilyDetails(family);
          children.forEach(childInfo => {
            const siblingPerson = findById(childInfo.id);
            if (siblingPerson) addSibling(siblingPerson, childInfo.frel === 'adopted' ? 'Adopted (Maternal)' : 'Maternal Half');
          });
        }
      });
    }

    lineage.Siblings = Array.from(allSiblingInfo.values()).sort((a, b) => getName(a.person).localeCompare(getName(b.person)));

    // Get spouse and children
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

    return lineage;
  };

  // Get relatives for both people
  const person1Relatives = getPersonRelatives(person1);
  const person2Relatives = getPersonRelatives(person2);

  console.log('Person 1 relatives:', person1Relatives);
  console.log('Person 2 relatives:', person2Relatives);

  // 1. Check if they're married (same family)
  const person1Fams = person1.tree?.filter(t => t.tag === 'FAMS').map(t => t.data) || [];
  const person2Fams = person2.tree?.filter(t => t.tag === 'FAMS').map(t => t.data) || [];
  
  for (const fam1 of person1Fams) {
    if (person2Fams.includes(fam1)) {
      return `${person1.displayName} and ${person2.displayName} are married`;
    }
  }

  // 2. Check direct parent-child relationships
  if (person1Relatives.Parents.some(p => p.id === person2.id)) {
    if (person2.gender === 'M') {
      return `${person2.displayName} is ${person1.displayName}'s father`;
    } else {
      return `${person2.displayName} is ${person1.displayName}'s mother`;
    }
  }
  
  if (person2Relatives.Parents.some(p => p.id === person1.id)) {
    if (person1.gender === 'M') {
      return `${person1.displayName} is ${person2.displayName}'s father`;
    } else {
      return `${person1.displayName} is ${person2.displayName}'s mother`;
    }
  }

  // 3. Check grandparent-grandchild relationships
  if (person1Relatives["Paternal Grandparents"].some(p => p.id === person2.id)) {
    if (person2.gender === 'M') {
      return `${person2.displayName} is ${person1.displayName}'s paternal grandfather`;
    } else {
      return `${person2.displayName} is ${person1.displayName}'s paternal grandmother`;
    }
  }
  
  if (person1Relatives["Maternal Grandparents"].some(p => p.id === person2.id)) {
    if (person2.gender === 'M') {
      return `${person2.displayName} is ${person1.displayName}'s maternal grandfather`;
    } else {
      return `${person2.displayName} is ${person1.displayName}'s maternal grandmother`;
    }
  }

  // Also check the reverse - is person1 a grandparent of person2?
  if (person2Relatives["Paternal Grandparents"].some(p => p.id === person1.id)) {
    if (person1.gender === 'M') {
      return `${person1.displayName} is ${person2.displayName}'s paternal grandfather`;
    } else {
      return `${person1.displayName} is ${person2.displayName}'s paternal grandmother`;
    }
  }
  
  if (person2Relatives["Maternal Grandparents"].some(p => p.id === person1.id)) {
    if (person1.gender === 'M') {
      return `${person1.displayName} is ${person2.displayName}'s maternal grandfather`;
    } else {
      return `${person1.displayName} is ${person2.displayName}'s maternal grandmother`;
    }
  }

  // 4. Check uncle/aunt relationships
  const checkUncleAuntRelationship = (person1, person2, person1Relatives, person2Relatives) => {
    // Check if person2 is person1's uncle/aunt
    for (const parent of person1Relatives.Parents) {
      const parentSiblings = getPersonRelatives(parent).Siblings;
      for (const siblingInfo of parentSiblings) {
        if (siblingInfo.person.id === person2.id) {
          if (person2.gender === 'M') {
            return `${person2.displayName} is ${person1.displayName}'s ${siblingInfo.type ? siblingInfo.type.toLowerCase() : ''} uncle`;
          } else {
            return `${person2.displayName} is ${person1.displayName}'s ${siblingInfo.type ? siblingInfo.type.toLowerCase() : ''} aunt`;
          }
        }
      }
    }
    
    // Check if person1 is person2's uncle/aunt
    for (const parent of person2Relatives.Parents) {
      const parentSiblings = getPersonRelatives(parent).Siblings;
      for (const siblingInfo of parentSiblings) {
        if (siblingInfo.person.id === person1.id) {
          if (person1.gender === 'M') {
            return `${person1.displayName} is ${person2.displayName}'s ${siblingInfo.type ? siblingInfo.type.toLowerCase() : ''} uncle`;
          } else {
            return `${person1.displayName} is ${person2.displayName}'s ${siblingInfo.type ? siblingInfo.type.toLowerCase() : ''} aunt`;
          }
        }
      }
    }
    
    return null;
  };

  const uncleAuntRelationship = checkUncleAuntRelationship(person1, person2, person1Relatives, person2Relatives);
  if (uncleAuntRelationship) {
    return uncleAuntRelationship;
  }

  // Check for great uncles/aunts and beyond
  const checkGreatUncleAuntRelationship = (person1, person2) => {
    const findGreatUncleAunt = (descendant, targetId, maxGenerations = 5) => {
      const findAtLevel = (person, targetId, level = 0, path = []) => {
        if (level > maxGenerations) return null;
        
        // Check if this person is the target
        if (person.id === targetId) {
          if (level === 1) return null; // This would be a regular uncle/aunt, already handled
          return { level, path };
        }
        
        // Check if this person is a sibling of an ancestor at this level
        const { father, mother } = getParentsOfIndividual(person.id);
        if (father) {
          const fatherSiblings = getPersonRelatives(father).Siblings;
          for (const siblingInfo of fatherSiblings) {
            if (siblingInfo.person.id === targetId) {
              if (level === 1) return null; // Regular uncle/aunt
              return { level, path: [...path, { person: father, side: 'paternal' }] };
            }
          }
          const result = findAtLevel(father, targetId, level + 1, [...path, { person: father, side: 'paternal' }]);
          if (result) return result;
        }
        if (mother) {
          const motherSiblings = getPersonRelatives(mother).Siblings;
          for (const siblingInfo of motherSiblings) {
            if (siblingInfo.person.id === targetId) {
              if (level === 1) return null; // Regular uncle/aunt
              return { level, path: [...path, { person: mother, side: 'maternal' }] };
            }
          }
          const result = findAtLevel(mother, targetId, level + 1, [...path, { person: mother, side: 'maternal' }]);
          if (result) return result;
        }
        return null;
      };
      
      return findAtLevel(descendant, targetId);
    };

    // Check if person2 is person1's great uncle/aunt
    const person2AsGreatUncle = findGreatUncleAunt(person1, person2.id);
    if (person2AsGreatUncle) {
      const level = person2AsGreatUncle.level;
      const side = person2AsGreatUncle.path[0]?.side || '';
      const sideText = side ? ` ${side}` : '';
      
      if (person2.gender === 'M') {
        if (level === 2) return `${person2.displayName} is ${person1.displayName}'s${sideText} great uncle`;
        else if (level === 3) return `${person2.displayName} is ${person1.displayName}'s${sideText} 2nd great uncle`;
        else if (level === 4) return `${person2.displayName} is ${person1.displayName}'s${sideText} 3rd great uncle`;
        else return `${person2.displayName} is ${person1.displayName}'s${sideText} ${level - 1}th great uncle`;
      } else {
        if (level === 2) return `${person2.displayName} is ${person1.displayName}'s${sideText} great aunt`;
        else if (level === 3) return `${person2.displayName} is ${person1.displayName}'s${sideText} 2nd great aunt`;
        else if (level === 4) return `${person2.displayName} is ${person1.displayName}'s${sideText} 3rd great aunt`;
        else return `${person2.displayName} is ${person1.displayName}'s${sideText} ${level - 1}th great aunt`;
      }
    }

    // Check if person1 is person2's great uncle/aunt
    const person1AsGreatUncle = findGreatUncleAunt(person2, person1.id);
    if (person1AsGreatUncle) {
      const level = person1AsGreatUncle.level;
      const side = person1AsGreatUncle.path[0]?.side || '';
      const sideText = side ? ` ${side}` : '';
      
      if (person1.gender === 'M') {
        if (level === 2) return `${person1.displayName} is ${person2.displayName}'s${sideText} great uncle`;
        else if (level === 3) return `${person1.displayName} is ${person2.displayName}'s${sideText} 2nd great uncle`;
        else if (level === 4) return `${person1.displayName} is ${person2.displayName}'s${sideText} 3rd great uncle`;
        else return `${person1.displayName} is ${person2.displayName}'s${sideText} ${level - 1}th great uncle`;
      } else {
        if (level === 2) return `${person1.displayName} is ${person2.displayName}'s${sideText} great aunt`;
        else if (level === 3) return `${person1.displayName} is ${person2.displayName}'s${sideText} 2nd great aunt`;
        else if (level === 4) return `${person1.displayName} is ${person2.displayName}'s${sideText} 3rd great aunt`;
        else return `${person1.displayName} is ${person2.displayName}'s${sideText} ${level - 1}th great aunt`;
      }
    }
    
    return null;
  };

  const greatUncleAuntRelationship = checkGreatUncleAuntRelationship(person1, person2);
  if (greatUncleAuntRelationship) {
    return greatUncleAuntRelationship;
  }

  // 5. Check in-law relationships
  const checkInLawRelationship = (person1, person2, person1Relatives, person2Relatives) => {
    // Check if person2 is person1's in-law
    for (const spouse of person1Relatives.Spouse) {
      if (spouse.person.id === person2.id) return null; // Already handled as spouse
      
      // Check if person2 is spouse's parent (father/mother-in-law)
      const spouseParents = getPersonRelatives(spouse.person).Parents;
      for (const parent of spouseParents) {
        if (parent.id === person2.id) {
          if (person2.gender === 'M') {
            return `${person2.displayName} is ${person1.displayName}'s father-in-law`;
          } else {
            return `${person2.displayName} is ${person1.displayName}'s mother-in-law`;
          }
        }
      }
      
      // Check if person2 is spouse's sibling (brother/sister-in-law)
      const spouseSiblings = getPersonRelatives(spouse.person).Siblings;
      for (const siblingInfo of spouseSiblings) {
        if (siblingInfo.person.id === person2.id) {
          if (person2.gender === 'M') {
            return `${person2.displayName} is ${person1.displayName}'s brother-in-law`;
          } else {
            return `${person2.displayName} is ${person1.displayName}'s sister-in-law`;
          }
        }
      }
      
      // Check if person2 is spouse's child (step-child, but could be considered in-law)
      const spouseChildren = getPersonRelatives(spouse.person).Children;
      for (const childInfo of spouseChildren) {
        if (childInfo.person.id === person2.id) {
          if (person2.gender === 'M') {
            return `${person2.displayName} is ${person1.displayName}'s stepson`;
          } else {
            return `${person2.displayName} is ${person1.displayName}'s stepdaughter`;
          }
        }
      }
    }
    
    // Check if person1 is person2's in-law (reverse direction)
    for (const spouse of person2Relatives.Spouse) {
      if (spouse.person.id === person1.id) return null; // Already handled as spouse
      
      // Check if person1 is spouse's parent (father/mother-in-law)
      const spouseParents = getPersonRelatives(spouse.person).Parents;
      for (const parent of spouseParents) {
        if (parent.id === person1.id) {
          if (person1.gender === 'M') {
            return `${person1.displayName} is ${person2.displayName}'s father-in-law`;
          } else {
            return `${person1.displayName} is ${person2.displayName}'s mother-in-law`;
          }
        }
      }
      
      // Check if person1 is spouse's sibling (brother/sister-in-law)
      const spouseSiblings = getPersonRelatives(spouse.person).Siblings;
      for (const siblingInfo of spouseSiblings) {
        if (siblingInfo.person.id === person1.id) {
          if (person1.gender === 'M') {
            return `${person1.displayName} is ${person2.displayName}'s brother-in-law`;
          } else {
            return `${person1.displayName} is ${person2.displayName}'s sister-in-law`;
          }
        }
      }
      
      // Check if person1 is spouse's child (step-child)
      const spouseChildren = getPersonRelatives(spouse.person).Children;
      for (const childInfo of spouseChildren) {
        if (childInfo.person.id === person1.id) {
          if (person1.gender === 'M') {
            return `${person1.displayName} is ${person2.displayName}'s stepson`;
          } else {
            return `${person1.displayName} is ${person2.displayName}'s stepdaughter`;
          }
        }
      }
    }
    
    // Check if person2 is person1's child's spouse (son/daughter-in-law)
    for (const childInfo of person1Relatives.Children) {
      const childSpouses = getPersonRelatives(childInfo.person).Spouse;
      for (const spouse of childSpouses) {
        if (spouse.person.id === person2.id) {
          if (person2.gender === 'M') {
            return `${person2.displayName} is ${person1.displayName}'s son-in-law`;
          } else {
            return `${person2.displayName} is ${person1.displayName}'s daughter-in-law`;
          }
        }
      }
    }
    
    // Check if person1 is person2's child's spouse (son/daughter-in-law)
    for (const childInfo of person2Relatives.Children) {
      const childSpouses = getPersonRelatives(childInfo.person).Spouse;
      for (const spouse of childSpouses) {
        if (spouse.person.id === person1.id) {
          if (person1.gender === 'M') {
            return `${person1.displayName} is ${person2.displayName}'s son-in-law`;
          } else {
            return `${person1.displayName} is ${person2.displayName}'s daughter-in-law`;
          }
        }
      }
    }
    
    return null;
  };

  const inLawRelationship = checkInLawRelationship(person1, person2, person1Relatives, person2Relatives);
  if (inLawRelationship) {
    return inLawRelationship;
  }

  // 6. Check sibling relationships
  const sibling1 = person1Relatives.Siblings.find(s => s.person.id === person2.id);
  if (sibling1) {
    if (sibling1.type) {
      return `${person1.displayName} and ${person2.displayName} are ${sibling1.type.toLowerCase()} siblings`;
    } else {
      return `${person1.displayName} and ${person2.displayName} are siblings`;
    }
  }

  // 7. Check spouse relationships
  const spouse1 = person1Relatives.Spouse.find(s => s.person.id === person2.id);
  if (spouse1) {
    if (spouse1.type) {
      return `${person1.displayName} and ${person2.displayName} are ${spouse1.type.toLowerCase()}`;
    } else {
      return `${person1.displayName} and ${person2.displayName} are married`;
    }
  }

  // 8. Check child relationships
  const child1 = person1Relatives.Children.find(c => c.person.id === person2.id);
  if (child1) {
    if (person1.gender === 'M') {
      if (child1.type) {
        return `${person1.displayName} is ${person2.displayName}'s ${child1.type.toLowerCase()} father`;
      } else {
                                      return `${person1.displayName} is ${person2.displayName}'s father`;
      }
    } else {
      if (child1.type) {
                                     return `${person1.displayName} is ${person2.displayName}'s ${child1.type.toLowerCase()} mother`;
      } else {
                                      return `${person1.displayName} is ${person2.displayName}'s mother`;
      }
    }
  }

  // 9. Check for deep ancestral relationships (up to 7th great-grandparent and beyond)
  const findAncestralRelationship = (descendant, ancestor, maxGenerations = 15) => {
    const findAncestorAtLevel = (person, targetId, level = 0, path = []) => {
      if (level > maxGenerations) return null;
      if (person.id === targetId) return { level, path };
      
      const { father, mother } = getParentsOfIndividual(person.id);
      if (father) {
        const result = findAncestorAtLevel(father, targetId, level + 1, [...path, { person: father, side: 'paternal' }]);
        if (result) return result;
      }
      if (mother) {
        const result = findAncestorAtLevel(mother, targetId, level + 1, [...path, { person: mother, side: 'maternal' }]);
        if (result) return result;
      }
      return null;
    };

    // Check if person1 is an ancestor of person2
    const person1AsAncestor = findAncestorAtLevel(person2, person1.id);
    console.log('Person1 as ancestor of person2:', person1AsAncestor);
    if (person1AsAncestor) {
      const generation = person1AsAncestor.level;
      const side = person1AsAncestor.path[person1AsAncestor.path.length - 1]?.side || 'unknown';
      console.log('Found ancestor relationship:', { generation, side, gender: person1.gender });
      
      if (generation === 1) {
        return person1.gender === 'M' ? 'father' : 'mother';
      } else if (generation === 2) {
        return `${side} grand${person1.gender === 'M' ? 'father' : 'mother'}`;
      } else {
        const greatCount = generation - 2;
        const greatPrefix = greatCount === 1 ? 'great-' : `${greatCount}th great-`;
        return `${side} ${greatPrefix}${person1.gender === 'M' ? 'grandfather' : 'grandmother'}`;
      }
    }

    // Check if person2 is an ancestor of person1
    const person2AsAncestor = findAncestorAtLevel(person1, person2.id);
    console.log('Person2 as ancestor of person1:', person2AsAncestor);
    if (person2AsAncestor) {
      const generation = person2AsAncestor.level;
      const side = person2AsAncestor.path[person2AsAncestor.path.length - 1]?.side || 'unknown';
      console.log('Found ancestor relationship (reverse):', { generation, side, gender: person2.gender });
      
      if (generation === 1) {
        return person2.gender === 'M' ? 'father' : 'mother';
      } else if (generation === 2) {
        return `${side} grand${person2.gender === 'M' ? 'father' : 'mother'}`;
      } else {
        const greatCount = generation - 2;
        const greatPrefix = greatCount === 1 ? 'great-' : `${greatCount}th great-`;
        return `${side} ${greatPrefix}${person2.gender === 'M' ? 'grandfather' : 'grandmother'}`;
      }
    }

    return null;
  };

  // Check for ancestral relationships
  const ancestralRelationship = findAncestralRelationship(person1, person2);
  console.log('Ancestral relationship result:', ancestralRelationship);
  
  if (ancestralRelationship) {
                     if (ancestralRelationship.includes('father') || ancestralRelationship.includes('mother')) {
         return `${person1.displayName} is ${person2.displayName}'s ${ancestralRelationship}`;
       } else {
         return `${person2.displayName} is ${person1.displayName}'s ${ancestralRelationship}`;
       }
  }

  // 8. Check for cousin relationships
  // Find common grandparents to determine cousin type
  const person1Grandparents = [
    ...person1Relatives["Paternal Grandparents"],
    ...person1Relatives["Maternal Grandparents"]
  ];
  
  const person2Grandparents = [
    ...person2Relatives["Paternal Grandparents"],
    ...person2Relatives["Maternal Grandparents"]
  ];

  // Check for common grandparents (1st cousins)
  for (const gp1 of person1Grandparents) {
    if (person2Grandparents.some(gp2 => gp2.id === gp1.id)) {
      return `${person1.displayName} and ${person2.displayName} are 1st cousins`;
    }
  }

  // Check for common ancestors to determine cousin relationships
  // We'll use the ancestral relationship function for this too
  const findCommonAncestor = (person1, person2, maxGenerations = 8) => {
    const findAncestors = (person, maxGen = maxGenerations) => {
      const ancestors = new Map();
      const traverse = (p, generation = 0) => {
        if (generation > maxGen) return;
        ancestors.set(p.id, generation);
        
        const { father, mother } = getParentsOfIndividual(p.id);
        if (father) traverse(father, generation + 1);
        if (mother) traverse(mother, generation + 1);
      };
      traverse(person);
      return ancestors;
    };

    const person1Ancestors = findAncestors(person1);
    const person2Ancestors = findAncestors(person2);

    let closestCommonAncestor = null;
    let closestDistance = Infinity;

    for (const [ancestorId, gen1] of person1Ancestors) {
      if (person2Ancestors.has(ancestorId)) {
        const gen2 = person2Ancestors.get(ancestorId);
        const totalDistance = gen1 + gen2;
        if (totalDistance < closestDistance) {
          closestDistance = totalDistance;
          closestCommonAncestor = { id: ancestorId, gen1, gen2 };
        }
      }
    }

    if (closestCommonAncestor) {
      const gen1 = closestCommonAncestor.gen1;
      const gen2 = closestCommonAncestor.gen2;
      
      // Both people must be the same generation from the common ancestor for proper cousin classification
      if (gen1 === gen2) {
        if (gen1 === 1) {
          return '1st cousins';
        } else if (gen1 === 2) {
          return '2nd cousins';
        } else if (gen1 === 3) {
          return '3rd cousins';
        } else if (gen1 === 4) {
          return '4th cousins';
        } else if (gen1 === 5) {
          return '5th cousins';
        } else if (gen1 === 6) {
          return '6th cousins';
        } else if (gen1 === 7) {
          return '7th cousins';
        } else if (gen1 === 8) {
          return '8th cousins';
        } else {
          return `${gen1}th cousins`;
        }
      } else {
        // If they're different generations from the common ancestor, they're "removed" cousins
        const minGen = Math.min(gen1, gen2);
        const maxGen = Math.max(gen1, gen2);
        const removed = maxGen - minGen;
        
        if (minGen === 1) {
          if (removed === 1) return '1st cousins once removed';
          else if (removed === 2) return '1st cousins twice removed';
          else return `1st cousins ${removed} times removed`;
        } else if (minGen === 2) {
          if (removed === 1) return '2nd cousins once removed';
          else if (removed === 2) return '2nd cousins twice removed';
          else return `2nd cousins ${removed} times removed`;
        } else if (minGen === 3) {
          if (removed === 1) return '3rd cousins once removed';
          else if (removed === 2) return '3rd cousins twice removed';
          else return `3rd cousins ${removed} times removed`;
        } else if (minGen === 4) {
          if (removed === 1) return '4th cousins once removed';
          else if (removed === 2) return '4th cousins twice removed';
          else return `4th cousins ${removed} times removed`;
        } else {
          return `${minGen}th cousins ${removed} times removed`;
        }
      }
    }
    return null;
  };

  const cousinRelationship = findCommonAncestor(person1, person2);
  if (cousinRelationship) {
    return `${person1.displayName} and ${person2.displayName} are ${cousinRelationship}`;
  }

  // 8. Check if they share any other relatives
  const person1AllRelatives = [
    ...person1Relatives.Parents,
    ...person1Relatives.Siblings,
    ...person1Relatives.Children
  ];
  
  const person2AllRelatives = [
    ...person2Relatives.Parents,
    ...person2Relatives.Siblings,
    ...person2Relatives.Children
  ];

  // Check for common relatives
  for (const rel1 of person1AllRelatives) {
    if (person2AllRelatives.some(rel2 => rel2.id === rel1.id)) {
      const commonRelative = rel1.displayName || rel1.name || 'Unknown';
      return `${person1.displayName} and ${person2.displayName} are related through ${commonRelative}`;
    }
  }

  return `${person1.displayName} and ${person2.displayName} are not directly related`;
}, [processedIndividuals, getParentsOfIndividual, findFamilyByPointer, extractFamilyDetails, findById, getName]);




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

    const rootPerson = createNode(person);
    const fatherNode = createNode(lineage.Parents.find(p => p.gender === 'M'));
    const motherNode = createNode(lineage.Parents.find(p => p.gender === 'F'));

    const siblingNodes = lineage.Siblings.map(s => createNode(s.person)).filter(Boolean);
    const spouseIds = new Set(lineage.Spouse.map(s => s.person.id));
    const cleanSiblingNodes = siblingNodes.filter(n => !spouseIds.has(n.extra.id));

    if (fatherNode && motherNode) {
        if (!fatherNode.marriages.some(m => m.spouse.extra.id === motherNode.extra.id)) {
            fatherNode.marriages.push({ spouse: motherNode, children: [rootPerson, ...cleanSiblingNodes] });
        }
    }

    if (fatherNode) {
        const pGF = createNode(lineage["Paternal Grandparents"].find(p => p.gender === 'M'));
        const pGM = createNode(lineage["Paternal Grandparents"].find(p => p.gender === 'F'));
        if (pGF && pGM) {
            // Connect paternal grandparents through marriage
            if (!pGF.marriages.some(m => m.spouse.extra.id === pGM.extra.id)) {
                pGF.marriages.push({ spouse: pGM, children: [fatherNode] });
            }
        }
    }

    if (motherNode) {
        const mGF = createNode(lineage["Maternal Grandparents"].find(p => p.gender === 'M'));
        const mGM = createNode(lineage["Maternal Grandparents"].find(p => p.gender === 'F'));
        if (mGF && mGM) {
            // Connect maternal grandparents through marriage
            if (!mGF.marriages.some(m => m.spouse.extra.id === mGM.extra.id)) {
                mGF.marriages.push({ spouse: mGM, children: [motherNode] });
            }
        }
    }
    
    // To show both paternal and maternal grandparents, we need to find a root that
    // will display both sides. Let's start from the father if available to show the
    // paternal line, and ensure maternal grandparents are connected through mother.
    
    let rootCandidate = null;
    
    // Priority: Start from father if available to show paternal line
    if (fatherNode) {
        rootCandidate = fatherNode;
    }
    // Otherwise start from mother to show maternal line  
    else if (motherNode) {
        rootCandidate = motherNode;
    }
    // Finally, start from the person themselves
    else {
        rootCandidate = rootPerson;
    }
    
    // Process spouses and siblings before returning
    lineage.Spouse.forEach(s => {
        const spouseNode = createNode(s.person);
        const childrenOfThisUnion = lineage.Children
            .filter(c => {
                const parents = getParentsOfIndividual(c.person.id);
                return (parents.father?.id === person.id && parents.mother?.id === s.person.id) ||
                       (parents.mother?.id === person.id && parents.father?.id === s.person.id);
            })
            .map(c => createNode(c.person)).filter(Boolean);

        if (spouseNode && !rootPerson.marriages.some(m => m.spouse.extra.id === spouseNode.extra.id)) {
            rootPerson.marriages.push({ spouse: spouseNode, children: childrenOfThisUnion });
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
    
    return [rootCandidate];



}, [person, lineage, findById, findFamilyByPointer, getParentsOfIndividual, extractFamilyDetails]);


    useEffect(() => {
        if (topSectionRef.current) setTreeViewDynamicHeight(window.innerHeight - topSectionRef.current.offsetHeight);
    }, [person]);

    const handleSearchSubmit = useCallback((searchTerm) => {
        if (!searchTerm) return;
        
        // Create names with dates for search
        const namesWithDates = processedIndividuals.map(p => {
            let name = p.displayName;
            if (p.dob && p.dob !== '?' && p.dob !== 'Unknown') {
                name += ` (b. ${p.dob}`;
                if (p.dod && p.dod !== '?' && p.dod !== 'Unknown' && p.dod !== 'Living') {
                    name += ` - d. ${p.dod}`;
                }
                name += ')';
            } else if (p.dod && p.dod !== '?' && p.dod !== 'Unknown' && p.dod !== 'Living') {
                name += ` (d. ${p.dod})`;
            }
            return { ...p, fullDisplayName: name };
        });
        
        // Search in both the original displayName and the full name with dates
        const matches = namesWithDates.filter(p => 
            p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.fullDisplayName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        setShowNoResultsMessage(matches.length === 0);
        if (matches.length === 1) { handleSetPerson(matches[0]); setSearchResults([]); }
        else if (matches.length > 1) setSearchResults(matches);
    }, [processedIndividuals, handleSetPerson]);
    
    const handleSelectSearchResult = useCallback((p) => { handleSetPerson(p); setSearchResults([]); }, [handleSetPerson]);
    const handleCloseSearchResults = useCallback(() => setSearchResults([]), []);
    const handleViewSampleTree = useCallback(() => handleSetPerson(findById('@I318@')), [findById, handleSetPerson]);
    const handleGoToGiovanni = useCallback(() => handleSetPerson(findById('@I214@')), [findById, handleSetPerson]);
    const goToHomePage = useCallback(() => handleSetPerson(null), [handleSetPerson]);

    return (
        <div className="app-container" style={{ fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {person && (
                <div ref={topSectionRef} style={{ textAlign: 'center', padding: '1rem', borderBottom: '1px solid #ddd' }}>
                    <h1 onClick={goToHomePage} style={{ cursor: 'pointer', margin: '0 0 1rem 0' }}>Candeloro Family Tree</h1>
                    <div className="search-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <input 
                            type="text" 
                            placeholder="Search another name..." 
                            value={query} 
                            onChange={(e) => setQuery(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(query)} 
                            style={{ padding: '0.5rem', fontSize: '1rem', width: '400px' }}
                        />
                        <button onClick={() => handleSearchSubmit(query)} style={{ padding: '0.5rem 1rem', marginLeft: '10px' }}>Search</button>
                    </div>
                </div>
            )}
            {person ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div>
                        <PersonView person={person} lineage={lineage} />
                        <div className="tree-navigation-instructions" style={{ 
                            padding: '0.5rem', 
                            textAlign: 'center',
                            fontSize: '0.9rem',
                            color: '#666',
                            borderTop: '1px solid #eee',
                            marginTop: '1rem'
                        }}>
                            💡 <strong>Family Tree Navigation:</strong> Click and drag with your mouse to move around, scroll with your mousewheel to zoom in or out
                        </div>
                    </div>
                    <div className="tree-view-container" style={{ flex: 1, minHeight: 0 }}>
                        <TreeView 
                            data={focusedTreeData} 
                            onNodeClick={handleSetPerson} 
                            treeHeight={treeViewDynamicHeight}
                            focusId={person.id}
                        />
                    </div>
                </div>
            ) : null}
            {!person && (
                <>
                    <HomePage
                          onSearchSubmit={handleSearchSubmit}
  onSampleTreeClick={handleViewSampleTree}
  onGoToGiovanni={handleGoToGiovanni}
  showNoResultsMessage={showNoResultsMessage}
  detectRelationship={detectRelationship}
  allNames={processedIndividuals.map(p => {
    let name = p.displayName;
    if (p.dob && p.dob !== '?' && p.dob !== 'Unknown') {
      name += ` (b. ${p.dob}`;
      if (p.dod && p.dod !== '?' && p.dod !== 'Unknown' && p.dod !== 'Living') {
        name += ` - d. ${p.dod}`;
      }
      name += ')';
    } else if (p.dod && p.dod !== '?' && p.dod !== 'Unknown' && p.dod !== 'Living') {
      name += ` (d. ${p.dod})`;
    }
    return { ...p, fullDisplayName: name };
  })}
                    />
                </>
            )}
            {searchResults.length > 0 && <SearchResultsModal results={searchResults} onSelectPerson={handleSelectSearchResult} onClose={handleCloseSearchResults} />}
        </div>
    );
}

export default App;
