import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import dTree from 'd3-dtree';
import '../styles/style-index.css';
import placeholderImage from '../assets/placeholder.jpg';

// This makes these libraries globally available for dTree to use
window.d3 = d3;
window._ = _;

const getActualImageUrl = (mediaItem) => {
  if (mediaItem && mediaItem.url) {
    const filename = mediaItem.url.split(/[\\/]/).pop(); // grab filename
    return `${import.meta.env.BASE_URL}photos/${filename}`;
  }
  return placeholderImage;
};


export default function TreeView({ data, focusId, onNodeClick, treeHeight, onExpandFocus, onExpandSpouse, expandedSpouses, showFocusAncestors }) {
    const ref = useRef();
    const treeInstanceRef = useRef();
    
    useEffect(() => {
        const container = d3.select(ref.current);
        container.selectAll('*').remove();

        if (!data || data.length === 0) {
            return;
        }

        treeInstanceRef.current = dTree.init(data, {
            
            target: ref.current,
            debug: false,
            initialScale: 0.25,
            height: treeHeight || 800,
            width: ref.current.clientWidth,
            nodeWidth: 150,
            nodeHeight: 200,
            marriageNodeSize: 10,
            styles: {
                node: "node",
                marriageNode: "marriageNode",
                lineage: "lineage",
                marriage: "marriage",
                text: "nodeText"
            },
            callbacks: {
                // FIX: Removed unused 'a' and 'b' parameters.
                nodeSeparation: () => 10,
                separation: (a, b) => a.parent === b.parent ? 0.6 : 0.7,
                // FIX: Removed unused 'textRenderer' parameter.
                nodeSize: function(nodes, width) {
                    const desiredNodeHeight = this.opts.nodeHeight;
                    _.map(nodes, function(n) {
                        if (n.data.hidden) { n.cWidth = 0; n.cHeight = 0; }
                        else if (n.data.isMarriage) { n.cWidth = this.opts.marriageNodeSize; n.cHeight = this.opts.marriageNodeSize; }
                        else { n.cWidth = width; n.cHeight = desiredNodeHeight; }
                    }.bind(this));
                    return [width, desiredNodeHeight];
                },
                nodeHeightSeperation: function(nodeWidth, nodeMaxHeight) {
                    return nodeMaxHeight + 70;
                },
                nodeRenderer: function(name, x, y, w, h, extra, id, nodeClass) {
                    const personData = extra;

                    if (!personData || !personData.id) {
                        return `<g transform="translate(${x}, ${y})"></g>`;
                    }
                    
                    const isFocusPerson = personData.id === focusId;
                    const isSpouse = data.length > 0 && data[0].marriages.some(m => m.spouse?.extra.id === personData.id);

                    // This logic for expand buttons is from your original file
                    let expandButtonHtml = '';
                    if (isFocusPerson && onExpandFocus && !showFocusAncestors) {
                        expandButtonHtml = `<div class="expand-button" data-type="focus" data-id="${personData.id}">&#9650;</div>`;
                    }
                    if (isSpouse && onExpandSpouse && !expandedSpouses[personData.id]) {
                        expandButtonHtml = `<div class="expand-button" data-type="spouse" data-id="${personData.id}">&#9650;</div>`;
                    }

                    const photos = personData.extra?.media || [];
                    const mainPhoto = photos.find(photo => photo.isPrimary === true);
                    const imageUrl = getActualImageUrl(mainPhoto);

                    const birthDate = personData.dob || '?';
                    const deathDate = personData.dod || '?';
                    let lifetimeString = '';

                    if (birthDate !== '?') {
                        const birthYear = birthDate.match(/\d{4}/)?.[0] || birthDate.trim();
                        if (deathDate === 'Living') {
                            lifetimeString = `${birthYear} - Living`;
                        } else if (deathDate !== '?') {
                            const deathYear = deathDate.match(/\d{4}/)?.[0] || deathDate.trim();
                            lifetimeString = `${birthYear} - ${deathYear}`;
                        } else {
                            lifetimeString = `b. ${birthYear}`;
                        }
                    }

                    const genderClass = personData.gender === 'M' ? 'male-silhouette' : 'female-silhouette';
                    const focusedClass = isFocusPerson ? 'focused' : '';

                    return `
                        <div class="person-card ${nodeClass} ${focusedClass}" id="node${id}">
                            ${expandButtonHtml}
                            <div class="card-header ${genderClass}">
                                <img src="${imageUrl}" alt="Profile" class="profile-silhouette" onerror="this.onerror=null;this.src='${placeholderImage}';" />
                            </div>
                            <div class="card-content">
                                <p class="person-name">${name || 'Unnamed'}</p>
                                <p class="person-lifetime">${lifetimeString}</p>
                            </div>
                        </div>
                    `;
                },
                nodeClick: (name, extra, id) => {
                    const tree = treeInstanceRef.current;
                    if (!tree) return;
                    if (onNodeClick && extra && extra.id && !extra.id.startsWith('unknown')) {
                        onNodeClick(extra);
                    }
                    // Keep your original toggle siblings logic
                    if (tree.nodes && Array.isArray(tree.nodes)) {
                        const d3Node = tree.nodes.find(n => n.id === id);
                        if (d3Node) {
                            tree._toggleSiblings(d3Node);
                            tree.update(d3Node);
                        }
                    }
                }
            }
        });
        


    }, [data, treeHeight, onNodeClick, onExpandFocus, onExpandSpouse, focusId, expandedSpouses, showFocusAncestors]);

    return (
        <div
            ref={ref}
            id="tree-container"
            className="dtree-container"
            style={{
                height: treeHeight ? `${treeHeight}px` : '800px',
                width: '100%',
                border: '1px solid #ddd',
                backgroundColor: '#5a5a5a',
                overflow: 'hidden'
            }}
        />
    );
}
