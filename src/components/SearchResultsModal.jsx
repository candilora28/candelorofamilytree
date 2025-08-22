// src/components/SearchResultsModal.jsx
import React from 'react';

// Old Helper
// const getName = (entry) => entry?.name?.replace(/\//g, '')?.trim() || 'Unnamed';

function SearchResultsModal({ results, onSelectPerson, onClose }) {
  if (!results || results.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflowY: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#333' }}>Multiple Matches Found</h2>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#aaa',
          }}
        >
          &times;
        </button>
        <p style={{ marginBottom: '1rem', color: '#666' }}>Please select the correct person:</p>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {results.map(person => (
            <li key={person.id} style={{ marginBottom: '0.8rem' }}>
              <button
                onClick={() => onSelectPerson(person)}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem',
                  fontSize: '1.1rem',
                  textAlign: 'left',
                  backgroundColor: '#e9f5ff',
                  color: '#007bff',
                  border: '1px solid #007bff',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease, transform 0.1s ease',
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#d3e8ff'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#e9f5ff'}
              >
                {(() => {
                    let name = person.displayName || person.name.replace(/\//g, '')?.trim() || 'Unnamed';
                    if (person.dob && person.dob !== '?' && person.dob !== 'Unknown') {
                        name += ` (b. ${person.dob}`;
                        if (person.dod && person.dod !== '?' && person.dod !== 'Unknown' && person.dod !== 'Living') {
                            name += ` - d. ${person.dod}`;
                        }
                        name += ')';
                    } else if (person.dod && person.dod !== '?' && person.dod !== 'Unknown' && person.dod !== 'Living') {
                        name += ` (d. ${person.dod})`;
                    }
                    return name;
                })()}
              </button>
            </li>
          ))}
        </ul>
        {results.length === 0 && (
            <p style={{textAlign: 'center', color: '#666'}}>No results found for your query. Try a different name.</p>
        )}
      </div>
    </div>
  );
}

export default SearchResultsModal;