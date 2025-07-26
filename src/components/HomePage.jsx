// src/components/HomePage.jsx
import React, { useState } from 'react';
import candlemas from '/src/assets/candlemas.webp';
import spoltoreMap from '/src/assets/spoltore-map.jpg';

function HomePage({ onSearchSubmit, onSampleTreeClick, onGoToGiovanni, showNoResultsMessage }) {
  const [localQuery, setLocalQuery] = useState('');

  const handleLocalSearch = () => {
    if (localQuery.trim()) {
      onSearchSubmit(localQuery.trim());
    }
  };

  return (
    <div style={{
      textAlign: 'center',
      padding: '2rem 1rem',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#f8f8f8',
      color: '#333',
      overflowY: 'auto',
    }}>

      {/* Main Welcome Section */}
      <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', color: '#2c3e50', textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
        Welcome to the Candeloro Family Tree!
      </h1>
      <p style={{ fontSize: '1.5rem', lineHeight: '1.6', marginBottom: '2rem', color: '#555' }}>
        Embark on a journey through generations, uncover forgotten stories, and connect with your roots.
      </p>

      {/* Integrated Search Bar */}
      <div style={{ marginBottom: '3rem', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Enter your name or a family member name"
          value={localQuery}
          onChange={(e) => {
              setLocalQuery(e.target.value);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleLocalSearch()}
          style={{
            padding: '0.8rem 1.2rem',
            fontSize: '1.1rem',
            width: 'calc(100% - 140px)',
            maxWidth: '450px',
            borderRadius: '5px 0 0 5px',
            border: '1px solid #ccc',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={handleLocalSearch}
          style={{
            padding: '0.8rem 1.5rem',
            fontSize: '1.1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: '1px solid #28a745',
            borderRadius: '0 5px 5px 0',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
        >
          Search
        </button>
        </div>
        {showNoResultsMessage && ( // NEW: Display message if no results
          <p style={{
            textAlign: 'center',
            color: '#dc3545',
            fontSize: '1rem',
            marginTop: '0.5rem'
          }}>
            No results found. Please try a different name.
          </p>
        )}
        <p style={{ fontSize: '1rem', marginTop: '1rem', color: '#777' }}>
          No name in mind? <button
            onClick={onSampleTreeClick}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: 0,
            }}
          >
            Click here to view Albert Maurice Candilora's tree.
          </button>.
        </p>
      </div>

      {/* Facts About Our Family */}
      <div style={{
        width: '100%',
        maxWidth: '2100px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem',
        padding: '0 1rem',
      }}>
        {/* Why Candeloro? Section */}
        <div style={{
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '10px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          textAlign: 'left',
        }}>
          <h3 style={{ fontSize: '1.8rem', color: '#34495e', marginBottom: '1rem' }}>Why Candeloro?</h3>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
            Most of us now have the last name Candelore or Candilora, but our original surname was Candeloro. Upon immigrating to America, the last name was often changed due to the immigration or naturalization process.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
            The name Candeloro stems from the "Candelora" celebration (Candlemas in English), a Christian feast commemorating the presentation of Jesus at the Temple. This tradition often involved candle-lit processions. The surname likely originated as a reference to a family associated with this tradition, perhaps candle makers, or those living near a church dedicated to this feast.
          </p>
          
          <img src={candlemas} alt="Candlemas Celebration" style={{ width: '100%', borderRadius: '8px', marginTop: '1rem' }} />
        </div>

        {/* Our Family is From Spoltore Section */}
        <div style={{
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '10px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          textAlign: 'left',
        }}>
          <h3 style={{ fontSize: '1.8rem', color: '#34495e', marginBottom: '1rem' }}>Our Family is From Spoltore</h3>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
            Our family's roots trace back to Spoltore, a charming comune in the Province of Pescara, Abruzzo, Italy.
          </p>
          <ul style={{ fontSize: '1.1rem', lineHeight: '1.6', paddingLeft: '20px' }}>
            <li><strong>Spoltore:</strong> A historic town known for its medieval architecture and panoramic views. It sits on a hill overlooking the Pescara river valley.</li>
            <li><strong>Pescara:</strong> The capital city of the province, a vibrant port city on the Adriatic coast, famous for its beaches and as the birthplace of Gabriele D'Annunzio.</li>
            <li><strong>Abruzzo:</strong> Known as the "Green Region of Europe," Abruzzo is famous for its national parks, mountains (Apennines), and a rugged coastline. It's a region rich in history, folklore, and delicious cuisine.</li>
          </ul>
          <h4 style={{marginTop: '1.5rem', marginBottom: '0.5rem', color: '#444'}}>Map of Abruzzo with Spoltore Highlighted:</h4>
          <img src={spoltoreMap} alt="spoltore" style={{ width: '100%', borderRadius: '8px', marginTop: '1rem' }} />
        </div>
      </div>

      {/* Italian Life and Naming Conventions Section */}
      <div style={{
        width: '100%',
        maxWidth: '2100px',
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        textAlign: 'left',
        marginBottom: '3rem',
      }}>
        <h3 style={{ fontSize: '1.8rem', color: '#34495e', marginBottom: '1rem' }}>Italian Life & Naming Traditions (1700s-1900s)</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
          Understanding family names and traditions can shed light on our ancestors' lives:
        </p>
        <ul style={{ fontSize: '1.1rem', lineHeight: '1.6', paddingLeft: '20px' }}>
          <li><strong>Naming Conventions:</strong> In many Italian regions, it was customary for the first-born son to be named after the paternal grandfather, and the first-born daughter after the paternal grandmother. Second children might be named after maternal grandparents. This pattern helps trace lineages.</li>
          <li><strong>Infant Mortality:</strong> Sadly, infant mortality rates were high. If a child died in infancy, it was common for the next child born of the same gender to be given the same name. This tradition, though somber, aimed to preserve the name and memory within the family.</li>
          <li><strong>Name Translations:</strong> Many Italian names were Anglicized upon immigration. For example:
            <ul>
              <li>Giuseppe &rarr; Joseph</li>
              <li>Giovanni &rarr; John</li>
              <li>Maria &rarr; Mary</li>
              <li>Luigi &rarr; Louis</li>
              <li>Concetta &rarr; Connie</li>
            </ul>
          </li>
          <li><strong>Life in Southern Italy:</strong> (Add facts about daily life, agriculture, social structures, emigration patterns from Southern Italy/Abruzzo during the 1700s-1900s. E.g., agricultural society, large families, impact of unification, reasons for emigration).</li>
        </ul>
      </div>

      {/* Earliest Known Ancestor Section */}
      <div style={{
        width: '100%',
        maxWidth: '2100px',
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        textAlign: 'left',
        marginBottom: '3rem',
      }}>
        <h3 style={{ fontSize: '1.8rem', color: '#34495e', marginBottom: '1rem' }}>Our Earliest Known Ancestor: Giovanni Giuseppe Candeloro</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
          Our family lineage proudly traces back to {' '}
          <button
            onClick={onGoToGiovanni}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: 'inherit',
              padding: 0,
              display: 'inline',
            }}
          >
            <b>Giovanni Giuseppe Candeloro</b>
          </button>, who was born in the early 1700s. He is the earliest known ancestor we have been able to identify in our records from Spoltore, Italy.
          While specific details of his life are scarce due to the passage of time, his existence marks the foundational point of our documented family history.
          His descendants carried the Candeloro name through generations, eventually leading to the family branches we know today.
        </p>
      </div>

      <p style={{ fontSize: '1rem', marginTop: '2rem', color: '#777' }}>
        "Every generation builds upon the last. Discover your roots."
      </p>
    </div>
  );
}

export default HomePage;