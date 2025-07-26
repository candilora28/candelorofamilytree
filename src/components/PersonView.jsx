// src/components/PersonView.jsx
import React, { useCallback, useState, useEffect, useRef } from 'react';
import placeholderImage from '/src/assets/placeholder.jpg';
import ZoomableImage from './ZoomableImage';


const getName = (dataItem) => {
  if (!dataItem) return 'N/A';
  const person = dataItem?.person || dataItem;
  return person?.displayName || person?.name?.replace(/\//g, '')?.trim() || 'Unnamed';
};

const getSex = (person) => {
  const sex = person?.gender?.toUpperCase();
  if (sex === 'M') return 'Male';
  if (sex === 'F') return 'Female';
  return 'Unknown';
};

// Removed old getBirth/getDeath logic, relying on formatted dates from App.jsx's processIndividualData
// The person object now comes with dob/dod already formatted as 'DD MMM YYYY' or '?' / 'Living'



const getMediaDetail = (mediaItem, tag) => {
    if (tag === 'TITL' && mediaItem.caption) {
        return mediaItem.caption;
    }
    if (tag === 'NOTE' && mediaItem.description) {
        return mediaItem.description;
    }
    if (tag === '_DATE' && mediaItem.date) {
        return mediaItem.date;
    }

    const itemInTree = mediaItem?.tree?.find(node => node.tag === tag);
    if (itemInTree) {
        return itemInTree.data;
    }

    return '';
};


const PersonView = ({ person, lineage }) => {
  const isEmpty = !person;
  



  const name = getName(person);
  const gender = getSex(person);
  const birthDate = person?.dob; // Directly use person.dob, which is now pre-formatted
  const deathStatus = person?.dod; // Directly use person.dod, which is now pre-formatted

 

  const [activeImageIndex, setActiveImageIndex] = useState(null);
  const [globalZoom, setGlobalZoom] = useState(1);
  const modalRef = useRef(null);
  const profileModalRef = useRef(null);


  const openImageModal = useCallback((index) => {
  setActiveImageIndex(index);
  setGlobalZoom(1);
  document.body.style.overflow = 'hidden';
}, []);


 const closeImageModal = useCallback(() => {
  setActiveImageIndex(null);
  setGlobalZoom(1);
  document.body.style.overflow = 'unset';
}, []);


  const handleZoomableImageClick = useCallback((e) => {
    e.stopPropagation();
  }, []);


  const getPersonFromLineageItem = (item) => item?.person || item;
  const getTypeFromLineageItem = (item) => item?.type;


  const photos = person.extra?.media || [];

 const getActualImageUrl = (mediaItem) => {
  if (mediaItem && mediaItem.url) {
    const localBasePath = "C:/Users/kcsup/Documents/test_media".replace(/\\/g, '/');
    const rawPath = mediaItem.url.replace(/\\/g, '/');

    // Remove the local base from the GEDCOM path
    let relativePath = rawPath.startsWith(localBasePath)
      ? rawPath.substring(localBasePath.length)
      : rawPath;

    // Remove leading slashes
    relativePath = relativePath.replace(/^\/+/, '');

    // Final output
    return `${import.meta.env.BASE_URL}photos/${relativePath}`;
  }

  return placeholderImage;
};



  const formattedPhotos = photos.map(photo => {
    const isPrimaryNode = photo.tree?.find(node => node.tag === '_PRIM');
    const isPrimary = isPrimaryNode ? isPrimaryNode.data === 'Y' : (photo.isPrimary || false);

    const formattedPhoto = {
      ...photo,
      url: getActualImageUrl(photo),
      caption: getMediaDetail(photo, 'TITL'),
      description: getMediaDetail(photo, 'NOTE'),
      date: getMediaDetail(photo, '_DATE'),
      isPrimary: isPrimary,
    };
    return formattedPhoto;
  });

  const mainPhoto = formattedPhotos.find(photo => photo.isPrimary === true);
  const mainPhotoUrl = mainPhoto ? mainPhoto.url : placeholderImage;
  
  const galleryPhotos = formattedPhotos.filter(photo => photo !== mainPhoto) || [];

  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const modalElement = modalRef.current;

    const handleModalWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const zoomFactor = 0.1;
      setGlobalZoom((prev) =>
        e.deltaY < 0 ? Math.min(prev + zoomFactor, 5) : Math.max(prev - zoomFactor, 1)
      );
    };

    if (modalElement && activeImageIndex !== null) {
      modalElement.addEventListener('wheel', handleModalWheel, { passive: false });
    }

    return () => {
      if (modalElement) {
        modalElement.removeEventListener('wheel', handleModalWheel);
      }
    };
  },  [activeImageIndex]);


  useEffect(() => {
  const profileElement = profileModalRef.current;

  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const zoomFactor = 0.1;
    setGlobalZoom((prev) =>
      e.deltaY < 0 ? Math.min(prev + zoomFactor, 5) : Math.max(prev - zoomFactor, 1)
    );
  };

  if (profileElement && showProfileModal) {
    profileElement.addEventListener('wheel', handleWheel, { passive: false });
  }

  return () => {
    if (profileElement) {
      profileElement.removeEventListener('wheel', handleWheel);
    }
  };
}, [showProfileModal]);


const goToNextImage = useCallback(() => {
  setActiveImageIndex((prevIndex) =>
    prevIndex === galleryPhotos.length - 1 ? 0 : prevIndex + 1
  );
}, [galleryPhotos.length]);

const goToPrevImage = useCallback(() => {
  setActiveImageIndex((prevIndex) =>
    prevIndex === 0 ? galleryPhotos.length - 1 : prevIndex - 1
  );
}, [galleryPhotos.length]);

if (isEmpty) return null;

  return (
    <div style={{ padding: '1rem 2rem', width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', alignItems: 'stretch' }}>
        <div style={{ flex: 1, minWidth: '380px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
            <div style={{ flex: '0 0 250px', minWidth: '200px', marginRight: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ marginBottom: '0.5rem', textAlign: 'center', width: '100%' }}>Profile Photo</h3>
              <img
                src={mainPhotoUrl}
                alt={`${name} profile`}
                style={{ width: '100%', borderRadius: '8px', aspectRatio: '1/1', objectFit: 'cover', cursor: 'pointer', marginBottom: '0.5rem' }}
               onClick={(e) => {
  e.stopPropagation();
  setShowProfileModal(true);
  document.body.style.overflow = 'hidden';
}}

                onError={(e) => { e.target.src = placeholderImage; }}
              />
            </div>
            <div style={{ flex: '1 1 auto', minWidth: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <div>
                <h2>{name}</h2>
                <p><strong>Gender:</strong> {gender}</p>
                <p><strong>Born:</strong> {birthDate || '?'}</p> {/* Now correctly displays '?' if dob is 'Unknown' */}
                <p><strong>Died:</strong> {deathStatus}</p>
              </div>
              {person.extra?.sources && person.extra.sources.length > 0 && (
                <div style={{ marginTop: '1rem', width: '100%' }}>
                  <h3>Sources</h3>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {person.extra.sources.map((source, idx) => (
                      <li key={idx} style={{ marginBottom: '0.5rem' }}>
                        <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'underline' }}>
                          {source.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ marginBottom: '0.5rem', textAlign: 'center', width: '100%' }}>Other Media</h3>
          {galleryPhotos.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', height: '350px', gap: '0.5rem', justifyContent: 'flex-start', alignItems: 'center', paddingBottom: '10px', boxSizing: 'border-box', width: '100%' }}>
              {(galleryPhotos || []).map((photo, i) => {
                const thumbnailUrl = photo.url;
                const altText = photo.title || `Gallery Image ${i + 1}`;
                return (
                  <img
                    key={i}
                    src={thumbnailUrl}
                    alt={altText}
                    style={{ width: '320px', height: '320px', flexShrink: 0, borderRadius: '6px', objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => {
                      openImageModal(i);
                    }}
                    onError={(e) => { e.target.src = placeholderImage; }}
                  />
                );
              })}
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: '#eee', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888', minHeight: '150px' }}>
              No additional media
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ marginBottom: '0.5rem', textAlign: 'center', width: '100%' }}>Relatives</h3>
          {['Parents', 'Paternal Grandparents', 'Maternal Grandparents', 'Siblings', 'Spouse', 'Children'].map((key) => {
            const relationData = lineage?.[key];
            if (!relationData || (Array.isArray(relationData) && relationData.length === 0)) return null;
            const itemsToRender = Array.isArray(relationData) ? relationData : [relationData];
            const renderRelationItem = (relInfo, index, totalLength) => {
              const currentPersonRel = getPersonFromLineageItem(relInfo);
              if (!currentPersonRel) return null;
              return (
                <span key={index}>
                  <a href="#" onClick={(e) => { e.preventDefault(); lineage.onSelect(currentPersonRel); }}>
                    {getName(relInfo)}{(key === 'Siblings' || key === 'Children') && getTypeFromLineageItem(relInfo) && ` (${getTypeFromLineageItem(relInfo)})`}
                  </a>{index < totalLength - 1 && ', '}
                </span>
              );
            };
            return (
              <p key={key}><strong>{key}:</strong> {itemsToRender.map((relInfo, i) => renderRelationItem(relInfo, i, itemsToRender.length))}</p>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '2rem', width: '100%' }}>
        <h3>Timeline</h3>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '1rem', padding: '0.5rem 0', whiteSpace: 'nowrap' }}>
          {/* Modified Birth and Death display to use birthDate and deathStatus directly from component state */}
          {birthDate !== 'Unknown' && <div style={{ background: '#fff', padding: '1rem', borderRadius: '6px', minWidth: '200px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}><strong>Birth</strong><br /><span>{birthDate}{person?.pob && ` in ${person.pob}`}</span></div>}
          {deathStatus !== 'Living' && deathStatus !== 'Unknown' && <div style={{ background: '#fff', padding: '1rem', borderRadius: '6px', minWidth: '200px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}><strong>Death</strong><br /><span>{deathStatus}{person?.pod && ` in ${person.pod}`}</span></div>}
        </div>
      </div>

{activeImageIndex !== null && (
  <div
    ref={modalRef}
    style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2
    }}
    onClick={closeImageModal}
  >
    <button
  onClick={(e) => {
    e.stopPropagation();
    setActiveImageIndex(null);
    setGlobalZoom(1);
    document.body.style.overflow = 'unset';
  }}
  style={{
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    fontSize: '2rem',
    background: 'none',
    color: '#fff',
    border: 'none',
    cursor: 'pointer'
  }}
  aria-label="Close Modal"
>
  ✕
</button>

    <button
      onClick={(e) => { e.stopPropagation(); goToPrevImage(); }}
      style={{
        position: 'absolute',
        left: '2rem',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '2rem',
        color: '#fff',
        background: 'none',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      &#8592;
    </button>

    <ZoomableImage
      src={galleryPhotos[activeImageIndex]?.url}
      alt={galleryPhotos[activeImageIndex]?.caption || ''}
      globalZoom={globalZoom}
      onClick={handleZoomableImageClick}
    />

    <button
      onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
      style={{
        position: 'absolute',
        right: '2rem',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '2rem',
        color: '#fff',
        background: 'none',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      &#8594;
    </button>

    <div
      style={{
        position: 'absolute',
        bottom: '2rem',
        color: 'white',
        textAlign: 'center',
        maxWidth: '90%',
        padding: '0 1rem'
      }}
    >
      <h3 style={{ margin: 0 }}>{galleryPhotos[activeImageIndex]?.caption}</h3>
      <p style={{ margin: '0.5rem 0' }}>{galleryPhotos[activeImageIndex]?.description}</p>
      <p style={{ margin: 0, fontSize: '0.85rem' }}>{galleryPhotos[activeImageIndex]?.date}</p>
    </div>
  </div>
)}

{showProfileModal && (
  <div
    ref={profileModalRef}
    onClick={() => {
      setShowProfileModal(false);
      document.body.style.overflow = 'unset';
      setGlobalZoom(1);
    }}
    style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}
  >
    <ZoomableImage
      src={mainPhoto?.url}
      alt={mainPhoto?.caption || ''}
      globalZoom={globalZoom}
      onClick={(e) => e.stopPropagation()}
    />

    <button
      onClick={(e) => {
        e.stopPropagation();
        setShowProfileModal(false);
        document.body.style.overflow = 'unset';
        setGlobalZoom(1);
      }}
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        fontSize: '2rem',
        color: '#fff',
        background: 'none',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      &times;
    </button>
  </div>
  
)}


  </div>
  
)}


export default PersonView;