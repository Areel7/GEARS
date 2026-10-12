/* =========================================================
   MIGRATION SOURCE DATA

   Copied verbatim from the original frontend data files so the
   seeded database reproduces the live site exactly:

     src/components/AllTeam/AllTeamData.js
     src/components/MemberTeam/MemberData.js
     src/components/Team/Team.jsx
     src/components/Gallery/GalleryData.js       (gallary/*)
     src/components/OurGallery/GalleryData.js    (ourgallery/*)

   Image paths are relative to the frontend `src/assets/images`
   directory and are read from disk by the seed script.
========================================================= */

/* ---------------------------------------------------------
   LEADERSHIP
   `homeImage` is set for the four supervisors that the home
   page "OUR TEAM" strip shows, in that exact order.
--------------------------------------------------------- */

export const leadership = [
  {
    name: "Hassan Sultan",
    designation: "Founder & Ex Supervisor",
    description:
      "Guiding the team toward meaningful ideas and successful outcomes",
    image: "allteam/leadership/Sir-Hassan.png",
    showOnHome: true,
    homeImage: "Sir-Hassan.png",
    order: 0,
  },
  {
    name: "Umer Ahmad",
    designation: "Supervisor",
    description:
      "Providing direction, support, and expertise throughout the journey",
    image: "allteam/leadership/Sir-Umer.png",
    showOnHome: true,
    homeImage: "Sir-Umer.png",
    order: 1,
  },
  {
    name: "Umair Bin Ahmad",
    designation: "Supervisor",
    description:
      "Dedicated to mentoring, guiding, and inspiring the next generation",
    image: "allteam/leadership/Sir-Umair.png",
    showOnHome: true,
    homeImage: "Sir-Umair.png",
    order: 2,
  },
  {
    name: "Suhaib Ahmad",
    designation: "Co Supervisor",
    description:
      "Supporting the team with valuable insights, guidance, and expertise",
    image: "allteam/leadership/Sir-Suhaib.png",
    showOnHome: true,
    homeImage: "Sir-Suhaib.png",
    order: 3,
  },
  {
    name: "Mirza Sheheryar Baig",
    designation: "Ex Co Supervisor",
    description:
      "Their support and expertise remain an important part of our progress",
    image: "allteam/leadership/Sir-Shery.jpeg",
    showOnHome: false,
    order: 4,
  },
  {
    name: "M Ammar",
    designation: "Ex Supervisor",
    description:
      "A respected mentor who contributed greatly to our development",
    image: "allteam/leadership/Sir-Ammar.jpeg",
    showOnHome: false,
    order: 5,
  },
];

/* ---------------------------------------------------------
   CORE TEAM
   `image`     -> /team page          (allteam/coreteam/*)
   `homeImage` -> home page carousel  (memberN.*)
--------------------------------------------------------- */

export const coreTeam = [
  {
    name: "Muhammad Haseeb",
    designation: "President",
    description: "Leading GEARS with innovation and vision.",
    image: "allteam/coreteam/haseeb.jpeg",
    homeImage: "member1.jpeg",
    order: 0,
  },
  {
    name: "M Ahmad Samdani",
    designation: "Vice President",
    description: "Managing robotics projects and technical teams.",
    image: "allteam/coreteam/ahmad.jpg",
    homeImage: "member2.jpg",
    order: 1,
  },
  {
    name: "Mahnoor",
    designation: "General Secretary",
    description: "Managing public relations and communication.",
    image: "allteam/coreteam/mahnoor.jpeg",
    homeImage: "member3.jpeg",
    order: 2,
  },
  {
    name: "Muhammad Ali",
    designation: "Information Secretary",
    description:
      "Manages communication, information sharing, and organizational outreach activities.",
    image: "allteam/coreteam/ali.jpg",
    homeImage: "member4.jpg",
    order: 3,
  },
  {
    name: "Areel Ashfaq",
    designation: "Technical Head",
    description:
      "Leads technical operations, and ensures effective implementation of technical initiatives.",
    image: "allteam/coreteam/areel.jpg",
    homeImage: "member5.jpg",
    order: 4,
  },
  {
    name: "Haroon Nawaz",
    designation: "Inventory Head",
    description:
      "Manages inventory and oversees equipment and resources.",
    image: "allteam/coreteam/haroon.jpg",
    homeImage: "member6.jpg",
    order: 5,
  },
  {
    name: "Abdul Hannan",
    designation: "Finance Secretary",
    description:
      "Handles financial records and oversees the organization’s finances.",
    image: "allteam/coreteam/hanan.jpg",
    homeImage: "member7.jpg",
    order: 6,
  },
  {
    name: "Laiba Naheed",
    designation: "Media Head",
    description:
      "Manages media content and handles the organization’s media activities.",
    image: "allteam/coreteam/laiba.jpg",
    homeImage: "member8.jpg",
    order: 7,
  },
  {
    name: "Abdul Sami",
    designation: "Documentation Head",
    description:
      "Manages documentation and maintains organizational records.",
    image: "allteam/coreteam/sami.jpg",
    homeImage: "member9.jpg",
    order: 8,
  },
  {
    name: "Hassan Kashif",
    designation: "Lego Head",
    description:
      "Leads LEGO projects and handles LEGO-related activities.",
    image: "allteam/coreteam/hassan.jpg",
    homeImage: "member10.jpg",
    order: 9,
  },
];

/* ---------------------------------------------------------
   ALUMNI OF THE YEAR

   The third record points at "alumni/ahmad.jpg", which does not
   exist on disk (only ahmad.jpeg), so it renders without an
   image on the current site. It is migrated as-is rather than
   silently substituted; an admin can upload the right photo.
--------------------------------------------------------- */

export const alumni = [
  {
    name: "Ahmad Ali",
    title: "ALUMNI OF THE YEAR",
    designation: "Outstanding contribution to GEARS",
    image: "allteam/alumni/ahmad.jpeg",
    order: 0,
  },
  {
    name: "Waqas Ahmad",
    title: "ALUMNI OF THE YEAR",
    designation: "Outstanding contribution to GEARS",
    image: "allteam/alumni/waqas.png",
    order: 1,
  },
  {
    name: "Daniyal",
    title: "ALUMNI OF THE YEAR",
    designation: "Outstanding contribution to GEARS",
    image: null,
    order: 2,
  },
];

/* ---------------------------------------------------------
   PRESIDENTS  (oldest first, matching the current page order)
--------------------------------------------------------- */

export const presidents = [
  {
    name: "Umer Ahmad",
    startYear: "2017",
    endYear: "2018",
    image: "allteam/allpresident/president-8.png",
    order: 0,
  },
  {
    name: "Waseem ullah Minhas",
    startYear: "2018",
    endYear: "2019",
    image: "allteam/allpresident/president-7.jpeg",
    order: 1,
  },
  {
    name: "Waqas Ahmad",
    startYear: "2019",
    endYear: "2020",
    image: "allteam/allpresident/president-6.png",
    order: 2,
  },
  {
    name: "Sufyan",
    startYear: "2020",
    endYear: "2021",
    image: "allteam/allpresident/president-5.png",
    order: 3,
  },
  {
    name: "Fahwad Khan",
    startYear: "2021",
    endYear: "2022",
    image: "allteam/allpresident/president-4.jpeg",
    order: 4,
  },
  {
    name: "Haziq",
    startYear: "2022",
    endYear: "2023",
    image: "allteam/allpresident/president-3.jpeg",
    order: 5,
  },
  {
    name: "Zaheer Akram",
    startYear: "2023",
    endYear: "2024",
    image: "allteam/allpresident/president-2.jpeg",
    order: 6,
  },
  {
    name: "Karimullah",
    startYear: "2024",
    endYear: "2025",
    image: "allteam/allpresident/president-1.png",
    order: 7,
  },
];

/* ---------------------------------------------------------
   IMAGE FOLDERS

   The original components glob these directories and sort the
   filenames numerically, so the seed reproduces that order.
--------------------------------------------------------- */

export const homeImageFolder = "gallary";
export const galleryImageFolder = "ourgallery";
