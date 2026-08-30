const imageModules = import.meta.glob(
  "../../assets/images/ourgallery/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}",
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
    // filename se readable alt/category nikal lete hain (jaisay: "robotics-workshop-04.webp")
    const fileName = path.split("/").pop().split(".")[0];
    const readable = fileName
      .replace(/[-_]/g, " ")
      .replace(/\d+/g, "")
      .trim();

    return {
      id: index + 1,
      image,
      alt: readable ? readable : `GEARS Gallery ${index + 1}`,
      category: "GEARS",
    };
  });

export default galleryImages;