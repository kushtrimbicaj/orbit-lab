import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNasaImages } from '../../hooks/useNasaImages';
import Icon from './Icon';

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

/** Full-screen viewer, portalled to <body> so panel blur/transforms don't clip it. */
function Lightbox({ images, index, onClose, onNavigate }) {
  const image = images[index];
  const [src, setSrc] = useState(image.large);
  const closeRef = useRef(null);
  const handlers = useRef({ onClose, onNavigate });
  handlers.current = { onClose, onNavigate };

  useEffect(() => setSrc(image.large), [image]);
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    // Capture phase + stopPropagation: Esc closes only the viewer, not the info panel.
    const onKey = (event) => {
      if (event.key === 'Escape') { event.stopPropagation(); handlers.current.onClose(); }
      else if (event.key === 'ArrowRight') { event.stopPropagation(); handlers.current.onNavigate(1); }
      else if (event.key === 'ArrowLeft') { event.stopPropagation(); handlers.current.onNavigate(-1); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      previouslyFocused?.focus?.();
    };
  }, []);

  const date = formatDate(image.date);
  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={image.title} onClick={onClose}>
      <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox__media">
          <img src={src} alt={image.title} onError={() => src !== image.thumb && setSrc(image.thumb)} />
          {images.length > 1 && (
            <>
              <button type="button" className="lightbox__nav lightbox__nav--prev icon-btn" onClick={() => onNavigate(-1)} aria-label="Previous image">
                <Icon name="back" size={18} />
              </button>
              <button type="button" className="lightbox__nav lightbox__nav--next icon-btn" onClick={() => onNavigate(1)} aria-label="Next image">
                <Icon name="back" size={18} className="icon--flip" />
              </button>
            </>
          )}
        </div>
        <figcaption className="lightbox__caption">
          <div className="lightbox__head">
            <h3>{image.title}</h3>
            <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label="Close image viewer">
              <Icon name="close" size={18} />
            </button>
          </div>
          <p className="lightbox__meta">
            {[image.credit, date].filter(Boolean).join(' · ')} · {index + 1} / {images.length}
          </p>
          {image.description && (
            <p className="lightbox__description">
              {image.description.length > 420 ? `${image.description.slice(0, 420).trimEnd()}…` : image.description}
            </p>
          )}
          <a className="link-btn" href={image.detailsUrl} target="_blank" rel="noopener noreferrer">
            View on images.nasa.gov ↗
          </a>
        </figcaption>
      </figure>
    </div>,
    document.body,
  );
}

/** Thumbnail strip of real NASA imagery for the selected body. */
export default function NasaGallery({ bodyId, bodyName }) {
  const { status, images, error, retry } = useNasaImages(bodyId);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => setOpenIndex(null), [bodyId]);

  const navigate = (step) => setOpenIndex((i) => (i === null ? i : (i + step + images.length) % images.length));

  return (
    <section className="info-panel__section nasa-gallery" aria-label={`NASA images of ${bodyName}`}>
      <div className="nasa-gallery__head">
        <h3 className="eyebrow">NASA imagery</h3>
        <span className="nasa-gallery__source">images.nasa.gov</span>
      </div>

      {status === 'loading' && (
        <div className="nasa-gallery__grid" aria-busy="true" aria-label="Loading images">
          {Array.from({ length: 4 }, (_, i) => <span key={i} className="nasa-gallery__skeleton" />)}
        </div>
      )}

      {status === 'error' && (
        <div className="nasa-gallery__message">
          <p>Couldn’t load NASA images. {error}</p>
          <button type="button" className="link-btn" onClick={retry}><Icon name="reset" size={14} /> Try again</button>
        </div>
      )}

      {status === 'ready' && images.length === 0 && (
        <p className="nasa-gallery__message">No NASA images found for {bodyName}.</p>
      )}

      {status === 'ready' && images.length > 0 && (
        <ul className="nasa-gallery__grid">
          {images.map((image, i) => (
            <li key={image.id}>
              <button type="button" className="nasa-gallery__thumb" onClick={() => setOpenIndex(i)} title={image.title}>
                <img src={image.thumb} alt={image.title} loading="lazy" decoding="async" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {openIndex !== null && images[openIndex] && (
        <Lightbox images={images} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={navigate} />
      )}
    </section>
  );
}
