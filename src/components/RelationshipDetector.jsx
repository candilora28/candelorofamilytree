// src/components/RelationshipDetector.jsx
import React, { useState } from 'react';
import placeholderImage from '/src/assets/placeholder.jpg';

function RelationshipDetector({ detectRelationship, allNames, onPersonClick }) {
  console.log('RelationshipDetector received allNames:', allNames);
  console.log('Sample person from allNames:', allNames[0]);
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [person1, setPerson1] = useState(null);
  const [person2, setPerson2] = useState(null);

  // Process photos for a person (EXACT same logic as PersonView)
  const getPersonMainPhoto = (person) => {
    console.log('getPersonMainPhoto called with person:', person);
    console.log('person.extra:', person?.extra);
    console.log('person.extra?.media:', person?.extra?.media);
    
    if (!person?.extra?.media || person.extra.media.length === 0) {
      console.log('No media found, returning placeholder');
      return placeholderImage;
    }
    
    const photos = person.extra.media;
    console.log('Photos found:', photos);
    
    // Find the primary photo (same logic as PersonView)
    const mainPhoto = photos.find(photo => {
      const isPrimaryNode = photo.tree?.find(node => node.tag === '_PRIM');
      return isPrimaryNode ? isPrimaryNode.data === 'Y' : (photo.isPrimary || false);
    });
    
    console.log('Main photo found:', mainPhoto);
    
    // If no primary photo, use the first available photo
    const photoToUse = mainPhoto || photos[0];
    console.log('Photo to use:', photoToUse);
    
    // Use EXACT same logic as PersonView
    if (photoToUse && photoToUse.url) {
      console.log('Original photo URL:', photoToUse.url);
      
      // Check if this is a local path that needs conversion
      if (photoToUse.url.includes('test_media')) {
        const localBasePath = "C:/Users/kcsup/Documents/test_media".replace(/\\/g, '/');
        const rawPath = photoToUse.url.replace(/\\/g, '/');

        // Remove the local base from the GEDCOM path (same as PersonView)
        let relativePath = rawPath.startsWith(localBasePath)
          ? rawPath.substring(localBasePath.length)
          : rawPath;

        // Remove leading slashes
        relativePath = relativePath.replace(/^\/+/, '');

        // Final output (same as PersonView)
        const webUrl = `${import.meta.env.BASE_URL}photos/${relativePath}`;
        console.log('Converted to web URL:', webUrl);
        return webUrl;
      }
      
      console.log('Returning photo URL:', photoToUse.url);
      return photoToUse.url;
    }
    
    console.log('No valid photo URL, returning placeholder');
    return placeholderImage;
  };

  const handleDetect = () => {
    if (name1 && name2) {
      setIsLoading(true);
      // Small delay to show loading state
      setTimeout(() => {
        const rel = detectRelationship(name1, name2);
        setResult(rel || 'No relationship found.');
        setIsLoading(false);
        
        // Clear the input fields but KEEP the person objects for photo display
        setName1('');
        setName2('');
        // Don't clear person1 and person2 - we need them for photos!
      }, 100);
    }
  };

  const clearResults = () => {
    setName1('');
    setName2('');
    setResult('');
    setPerson1(null);
    setPerson2(null);
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="name1" style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: '#2c3e50'
          }}>
            First Person:
          </label>
          <input
            list="name1-options"
            value={name1}
            onChange={(e) => {
              setName1(e.target.value);
              // Find the person object
              const foundPerson = allNames.find(p => p.fullDisplayName === e.target.value);
              console.log('Found person1:', foundPerson);
              setPerson1(foundPerson || null);
            }}
            placeholder="Enter first person's name"
            style={{ 
              width: '100%', 
              padding: '0.6rem', 
              fontSize: '0.9rem',
              border: '2px solid #e1e8ed',
              borderRadius: '8px',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
          />
          <datalist id="name1-options">
            {allNames.map((n, idx) => (
              <option key={idx} value={n.fullDisplayName} />
            ))}
          </datalist>
        </div>

        <div style={{ 
          alignSelf: 'flex-end', 
          paddingBottom: '2rem', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          minWidth: '120px',
          fontSize: '1.2rem',
          color: '#666'
        }}>
          and
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="name2" style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: '#2c3e50'
          }}>
            Second Person:
          </label>
          <input
            list="name2-options"
            value={name2}
            onChange={(e) => {
              setName2(e.target.value);
              // Find the person object
              const foundPerson = allNames.find(p => p.fullDisplayName === e.target.value);
              console.log('Found person2:', foundPerson);
              setPerson2(foundPerson || null);
            }}
            placeholder="Enter second person's name"
            style={{ 
              width: '100%', 
              padding: '0.6rem', 
              fontSize: '0.9rem',
              border: '2px solid #e1e8ed',
              borderRadius: '8px',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
          />
          <datalist id="name2-options">
            {allNames.map((n, idx) => (
              <option key={idx} value={n.fullDisplayName} />
            ))}
          </datalist>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        justifyContent: 'center'
      }}>
        <button
          onClick={handleDetect}
          disabled={!name1 || !name2 || isLoading}
          style={{
            padding: '0.6rem 1.2rem',
            backgroundColor: name1 && name2 ? '#28a745' : '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: name1 && name2 ? 'pointer' : 'not-allowed',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            minWidth: '120px'
          }}
          onMouseOver={(e) => {
            if (name1 && name2) e.target.style.backgroundColor = '#218838';
          }}
          onMouseOut={(e) => {
            if (name1 && name2) e.target.style.backgroundColor = '#28a745';
          }}
        >
          {isLoading ? 'Detecting...' : 'Detect Relationship'}
        </button>

        {(name1 || name2 || result) && (
          <button
            onClick={clearResults}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'background-color 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            Clear
          </button>
        )}
      </div>

              {result && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '2px solid #e9ecef',
            textAlign: 'center'
          }}>

          <h4 style={{ 
            margin: '0 0 1rem 0', 
            color: '#2c3e50',
            fontSize: '1.1rem'
          }}>
            Relationship Found:
          </h4>
          
          {/* Person Photos and Names */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            {/* Person 1 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '8px',
                overflow: 'hidden',
                margin: '0 auto 0.5rem auto',
                border: '2px solid #e1e8ed',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <img 
                  src={getPersonMainPhoto(person1)}
                  alt={person1?.displayName || 'Person'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    cursor: person1 ? 'pointer' : 'default',
                    imageRendering: 'high-quality'
                  }}
                  onClick={() => person1 && onPersonClick && onPersonClick(person1)}
                  title={person1 ? `Click to view ${person1.displayName}'s tree` : ''}
                />
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666', maxWidth: '120px' }}>
                {person1?.displayName}
              </div>
            </div>

            {/* Relationship Icon */}
            <div style={{
              fontSize: '2rem',
              color: '#28a745',
              display: 'flex',
              alignItems: 'center'
            }}>
              🔗
            </div>

            {/* Person 2 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '8px',
                overflow: 'hidden',
                margin: '0 auto 0.5rem auto',
                border: '2px solid #e1e8ed',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <img 
                  src={getPersonMainPhoto(person2)}
                  alt={person2?.displayName || 'Person'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    cursor: person2 ? 'pointer' : 'default',
                    imageRendering: 'high-quality'
                  }}
                  onClick={() => person2 && onPersonClick && onPersonClick(person2)}
                  title={person2 ? `Click to view ${person2.displayName}'s tree` : ''}
                />
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666', maxWidth: '120px' }}>
                {person2?.displayName}
              </div>
            </div>
          </div>

          {/* Relationship Text */}
          <p style={{ 
            margin: 0, 
            fontWeight: '600', 
            fontSize: '1.2rem',
            color: '#28a745',
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            {result}
          </p>
        </div>
      )}
    </div>
  );
}

export default RelationshipDetector;
