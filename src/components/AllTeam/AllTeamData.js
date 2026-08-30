/* =========================================================
   AUTO LOAD ALL TEAM IMAGES
========================================================= */

const allTeamImages = import.meta.glob(
  "../../assets/images/allteam/**/*.{png,jpg,jpeg,webp}", 
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);


/* =========================================================
   IMAGE FINDER
========================================================= */

const getTeamImage = (folder, fileName) => {
  if (!folder || !fileName) {
    return null;
  }

  const normalizedFolder = folder
    .toLowerCase()
    .replace(/\\/g, "/");

  const normalizedFile = fileName.toLowerCase();

  const imageEntry = Object.entries(
    allTeamImages
  ).find(([path]) => {
    const normalizedPath = path
      .toLowerCase()
      .replace(/\\/g, "/");

    return normalizedPath.endsWith(
      `/allteam/${normalizedFolder}/${normalizedFile}`
    );
  });

  if (!imageEntry) {
    console.warn(
      `Team image not found: ${folder}/${fileName}`
    );

    console.log(
      "Available team images:",
      Object.keys(allTeamImages)
    );

    return null;
  }

  return imageEntry[1];
};


/* =========================================================
   LEADERSHIP
========================================================= */

export const leadershipTeam = [
  {
    id: 1,

    name: "Hassan Sultan",

    designation: "Founder & Ex Supervisor",

    image: getTeamImage(
      "leadership",
      "Sir-Hassan.png"
    ),

    message:
      "Guiding the team toward meaningful ideas and successful outcomes",
  },

  {
    id: 2,

    name: "Umer Ahmad",

    designation: "Supervisor",

    image: getTeamImage(
      "leadership",
      "Sir-Umer.png"
    ),

    message:
      "Providing direction, support, and expertise throughout the journey",
  },

  {
    id: 3,

    name: "Umair Bin Ahmad",

    designation: "Supervisor",

    image: getTeamImage(
      "leadership",
      "Sir-Umair.png"
    ),

    message:
      "Dedicated to mentoring, guiding, and inspiring the next generation",
  },

   {
    id: 4,

    name: "Suhaib Ahmad",

    designation: "Co Supervisor",

    image: getTeamImage(
      "leadership",
      "Sir-Suhaib.png"
    ),

    message:
      "Supporting the team with valuable insights, guidance, and expertise",
  },

  {
    id: 5,

    name: "Mirza Sheheryar Baig",

    designation: "Ex Co Supervisor",

    image: getTeamImage(
      "leadership",
      "Sir-Shery.jpeg"
    ),

    message:
      "Their support and expertise remain an important part of our progress",
  },

  {
    id: 6,

    name: "M Ammar",

    designation: "Ex Supervisor",

    image: getTeamImage(
      "leadership",
      "Sir-Ammar.jpeg"
    ),

    message:
      "A respected mentor who contributed greatly to our development",
  },
];


/* =========================================================
   CORE TEAM
========================================================= */

export const coreTeam = [
  {
    id: 1,

    name: "Muhammad Haseeb",

    designation: "President",

    image: getTeamImage(
      "coreteam",
      "haseeb.jpeg"
    ),

    text:
      "Leading GEARS with innovation and vision.",
  },

  {
    id: 2,

    name: "M Ahmad Samdani",

    designation: "Vice President",

    image: getTeamImage(
      "coreteam",
      "ahmad.jpg"
    ),

    text:
      "Managing robotics projects and technical teams.",
  },

  {
    id: 3,

    name: "Mahnoor",

    designation: "General Secretary",

    image: getTeamImage(
      "coreteam",
      "mahnoor.jpeg"
    ),

    text:
      "Managing public relations and communication.",
  },

  {
    id: 4,

    name: "Muhammad Ali",

    designation: "Information Secretary",

    image: getTeamImage(
      "coreteam",
      "ali.jpg"
    ),

    text:
      "Manages communication, information sharing, and organizational outreach activities.",
  },

  {
    id: 5,

    name: "Areel Ashfaq",

    designation: "Technical Head",

    image: getTeamImage(
      "coreteam",
      "areel.jpg"
    ),

    text:
      "Leads technical operations, and ensures effective implementation of technical initiatives.",
  },

  {
    id: 6,

    name: "Haroon Nawaz",

    designation: "Inventory Head",

    image: getTeamImage(
      "coreteam",
      "haroon.jpg"
    ),

    text:
      "Manages inventory and oversees equipment and resources.",
  },

  {
    id: 7,

    name: "Abdul Hannan",

    designation: "Finance Secretary",

    image: getTeamImage(
      "coreteam",
      "hanan.jpg"
    ),

    text:
      "Handles financial records and oversees the organization’s finances.",
  },

  {
    id: 8,

    name: "Laiba Naheed",

    designation: "Media Head",

    image: getTeamImage(
      "coreteam",
      "laiba.jpg"
    ),

    text:
      "Manages media content and handles the organization’s media activities.",
  },

  {
    id: 9,

    name: "Abdul Sami",

    designation: "Documentation Head",

    image: getTeamImage(
      "coreteam",
      "sami.jpg"
    ),

    text:
      "Manages documentation and maintains organizational records.",
  },

  {
    id: 10,

    name: "Hassan Kashif",

    designation: "Lego Head",

    image: getTeamImage(
      "coreteam",
      "hassan.jpg"
    ),

    text:
      "Leads LEGO projects and handles LEGO-related activities.",
  },
];


/* =========================================================
   ALUMNI OF THE YEAR
========================================================= */


  export const alumniOfYear = [
  {
    id: 1,
    name: "Ahmad Ali",
    year: "ALUMNI OF THE YEAR",
    designation: "Outstanding contribution to GEARS",
    image: getTeamImage(
      "alumni",
      "ahmad.jpeg"
    ),
  },

  {
    id: 2,
    name: "Waqas Ahmad",
    year: "ALUMNI OF THE YEAR",
    designation: "Outstanding contribution to GEARS",
    image: getTeamImage(
      "alumni",
      "waqas.png"
    ),
  },

  {
    id: 3,
    name: "Daniyal",
    year: "ALUMNI OF THE YEAR",
    designation: "Outstanding contribution to GEARS",
    image: getTeamImage(
      "alumni",
      "ahmad.jpg"
    ),
  },
];



/* =========================================================
   ALL PRESIDENTS
========================================================= */


export const allPresidents = [
  {
    id: 8,

    name: "Umer Ahmad",

    session: "2017 - 2018",

    image: getTeamImage(
      "allpresident",
      "president-8.png"
    ),
  },

  {
    id: 7,

    name: "Waseem ullah Minhas",

    session: "2018 - 2019",

    image: getTeamImage(
      "allpresident",
      "president-7.jpeg"
    ),
  },

  {
    id: 6,

    name: "Waqas Ahmad",

    session: "2019 - 2020",

    image: getTeamImage(
      "allpresident",
      "president-6.png"
    ),
  },

  {
    id: 5,

    name: "Sufyan",

    session: "2020 - 2021",

    image: getTeamImage(
      "allpresident",
      "president-5.png"
    ),
  },

  {
    id: 4,

    name: "Fahwad Khan",

    session: "2021 - 2022",

    image: getTeamImage(
      "allpresident",
      "president-4.jpeg"
    ),
  },

  {
    id: 3,

    name: "Haziq",

    session: "2022 - 2023",

    image: getTeamImage(
      "allpresident",
      "president-3.jpeg"
    ),
  },

  {
    id: 2,

    name: "Zaheer Akram",

    session: "2023 - 2024",

    image: getTeamImage(
      "allpresident",
      "president-2.jpeg"
    ),
  },

  {
    id: 1,

    name: "Karimullah",

    session: "2024 - 2025",

    image: getTeamImage(
      "allpresident",
      "president-1.PNG"
    ),
  },
];

