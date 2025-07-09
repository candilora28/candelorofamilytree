import React, { useRef, useState, useEffect, useCallback } from 'react';

const ZoomableImage = ({
  src,
  alt,
  maxWidth = '90vw',
  maxHeight = '90vh',
  globalZoom = 1,
  onClick // optional click handler for image (e.g., e.stopPropagation)
}) => {
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDragMousePosition, setStartDragMousePosition] = useState({ x: 0, y: 0 });
  const [startDragTranslate, setStartDragTranslate] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    setStartDragMousePosition({ x: e.clientX, y: e.clientY });
    setStartDragTranslate({ x: translate.x, y: translate.y });
  }, [translate]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - startDragMousePosition.x;
    const dy = e.clientY - startDragMousePosition.y;
    setTranslate({
      x: startDragTranslate.x + dx,
      y: startDragTranslate.y + dy
    });
  }, [isDragging, startDragMousePosition, startDragTranslate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseUp, handleMouseMove]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onClick={(e) => {
          if (onClick) {
            onClick(e); // e.stopPropagation() is passed from parent
          }
        }}
        style={{
          display: 'block',
          transform: `scale(${globalZoom}) translate(${translate.x / globalZoom}px, ${translate.y / globalZoom}px)`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  );
};

export default ZoomableImage;
