import { useState } from "react";
import "./Gallery.css";
import galleryImages from "./GalleryData";

const GalleryCard = ({ item, index }) => {
  const [orientation, setOrientation] = useState("");

  const handleLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;

    if (naturalHeight > naturalWidth * 1.12) {
      setOrientation("portrait");
    } else if (naturalWidth > naturalHeight * 1.15) {
      setOrientation("landscape");
    } else {
      setOrientation("square");
    }
  };

  return (
    <article
      className={`gallery-card gallery-item-${index + 1} ${orientation}`}
    >
      <img
        src={item.image}
        alt={item.alt}
        onLoad={handleLoad}
        loading={index < 6 ? "eager" : "lazy"}
      />

      <div className="gallery-overlay">
        <div className="gallery-overlay-content">
          <span>{String(index + 1).padStart(2, "0")}</span>

          <div className="gallery-line" />
        </div>
      </div>
    </article>
  );
};

const Gallery = () => {
  return (
    <section className="gallery-section" id="gallery">
      {/* HEADING */}
      <div className="gallery-heading">
        

        <h2>
          OUR <span>ACHIEVEMENTS</span>
        </h2>

        <p>
          From competitions and teamwork to innovation and unforgettable
          milestones — explore the moments that continue to shape our journey.
        </p>
      </div>

      {/* GALLERY */}
      <div className="gallery-wrapper">
        <div className="gallery-decoration gallery-decoration-one">
          26
        </div>

        <div className="gallery-decoration gallery-decoration-two">
          GEARS
        </div>

        <div className="gallery-container">
          {galleryImages.map((item, index) => (
            <GalleryCard
              key={item.id}
              item={item}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;