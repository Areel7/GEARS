const imageModules = import.meta.glob(
  "../../assets/images/gallary/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}",
  {
    eager: true,
    import: "default",
  }
);

const galleryImages = Object.entries(imageModules)
  .sort(([pathA], [pathB]) =>
    pathA.localeCompare(pathB, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  )
  .map(([path, image], index) => {
    const fileName =
      path
        .split("/")
        .pop()
        ?.replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim() || `Gallery Image ${index + 1}`;

    return {
      id: index + 1,
      image,
      alt: fileName,
    };
  });

export default galleryImages;