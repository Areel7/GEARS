import { useEffect, useRef, useState } from "react";
import "./MemberTeam.css";
import fallbackMembers from "./MemberData";

import { publicApi } from "../../services/api";
import { useRemoteData } from "../../hooks/useRemoteData";

const MemberTeam = () => {
  const { data: members } = useRemoteData(
    publicApi.home,
    (response) => response?.coreMembers,
    fallbackMembers
  );

  /*
    Only the selected id is stored. The active member is derived from
    it, so swapping the bundled list for the backend one can never
    leave a stale selection behind.
  */
  const [activeId, setActiveId] = useState(members[0]?.id);

  const activeMember =
    members.find((item) => item.id === activeId) || members[0];

  /*
    The scroll handlers below are attached once and read the member
    list from a ref, so swapping in the backend data does not need to
    tear down and rebuild the listeners.
  */
  const membersRef = useRef(members);

  useEffect(() => {
    membersRef.current = members;
  });

  const galleryRef = useRef(null);

  // Prevent manual scroll detection during click-based scrolling
  const programmaticScrollRef = useRef(false);

  // Currently clicked member
  const clickedMemberRef = useRef(null);

  const manualTimerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const programmaticTimerRef = useRef(null);

  /* =========================================================
     FIND CLOSEST MEMBER
  ========================================================= */

  const findClosestMember = () => {
    const gallery = galleryRef.current;

    if (!gallery) return;

    // Don't allow scroll detection while programmatic scrolling
    if (programmaticScrollRef.current) {
      return;
    }

    const cards = Array.from(
      gallery.querySelectorAll(".member-card")
    );

    if (!cards.length) return;

    const galleryStyle = window.getComputedStyle(gallery);

    const horizontal =
      galleryStyle.flexDirection === "row" ||
      galleryStyle.flexDirection === "row-reverse";

    const galleryRect =
      gallery.getBoundingClientRect();

    const galleryCenter = horizontal
      ? galleryRect.left + galleryRect.width / 2
      : galleryRect.top + galleryRect.height / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();

      const cardCenter = horizontal
        ? rect.left + rect.width / 2
        : rect.top + rect.height / 2;

      const distance = Math.abs(
        galleryCenter - cardCenter
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    const closestMember = membersRef.current[closestIndex];

    if (!closestMember) return;

    setActiveId(closestMember.id);
  };

  /* =========================================================
     CLICK MEMBER
  ========================================================= */

  const handleMemberClick = (member) => {
    const gallery = galleryRef.current;

    // Immediately make clicked member active
    setActiveId(member.id);

    // Remember exactly which member was clicked
    clickedMemberRef.current = member.id;

    if (!gallery) return;

    const clickedCard = gallery.querySelector(
      `[data-member-id="${member.id}"]`
    );

    if (!clickedCard) return;

    // Lock manual active-member detection
    programmaticScrollRef.current = true;

    // Clear old timer
    clearTimeout(programmaticTimerRef.current);

    const galleryStyle =
      window.getComputedStyle(gallery);

    const horizontal =
      galleryStyle.flexDirection === "row" ||
      galleryStyle.flexDirection === "row-reverse";

    if (horizontal) {
      const galleryRect =
        gallery.getBoundingClientRect();

      const cardRect =
        clickedCard.getBoundingClientRect();

      const currentScroll = gallery.scrollLeft;

      const cardCenter =
        cardRect.left +
        cardRect.width / 2;

      const galleryCenter =
        galleryRect.left +
        galleryRect.width / 2;

      const targetLeft =
        currentScroll +
        (cardCenter - galleryCenter);

      const maxScroll =
        gallery.scrollWidth -
        gallery.clientWidth;

      const finalLeft = Math.max(
        0,
        Math.min(targetLeft, maxScroll)
      );

      gallery.scrollTo({
        left: finalLeft,
        behavior: "smooth",
      });
    } else {
      const galleryRect =
        gallery.getBoundingClientRect();

      const cardRect =
        clickedCard.getBoundingClientRect();

      const currentScroll =
        gallery.scrollTop;

      const cardCenter =
        cardRect.top +
        cardRect.height / 2;

      const galleryCenter =
        galleryRect.top +
        galleryRect.height / 2;

      const targetTop =
        currentScroll +
        (cardCenter - galleryCenter);

      const maxScroll =
        gallery.scrollHeight -
        gallery.clientHeight;

      const finalTop = Math.max(
        0,
        Math.min(targetTop, maxScroll)
      );

      gallery.scrollTo({
        top: finalTop,
        behavior: "smooth",
      });
    }

    /*
      Keep checking until the scroll has settled.
      This is more reliable than a fixed 700ms timeout.
    */

    let lastPosition = horizontal
      ? gallery.scrollLeft
      : gallery.scrollTop;

    let stableFrames = 0;

    const waitForScrollEnd = () => {
      const currentPosition = horizontal
        ? gallery.scrollLeft
        : gallery.scrollTop;

      const difference = Math.abs(
        currentPosition - lastPosition
      );

      if (difference < 0.5) {
        stableFrames++;
      } else {
        stableFrames = 0;
      }

      lastPosition = currentPosition;

      if (stableFrames >= 8) {
        /*
          Smooth scrolling has finished.
          IMPORTANT:
          Keep the clicked member active.
        */

        programmaticScrollRef.current = false;

        const clickedId =
          clickedMemberRef.current;

        const selectedMember =
          membersRef.current.find(
            (item) => item.id === clickedId
          );

        if (selectedMember) {
          setActiveId(selectedMember.id);
        }

        clickedMemberRef.current = null;

        return;
      }

      animationFrameRef.current =
        requestAnimationFrame(
          waitForScrollEnd
        );
    };

    animationFrameRef.current =
      requestAnimationFrame(
        waitForScrollEnd
      );
  };

  /* =========================================================
     MANUAL SCROLL
  ========================================================= */

  useEffect(() => {
    const gallery = galleryRef.current;

    if (!gallery) return;

    const handleScroll = () => {
      // Ignore scroll caused by clicking a card
      if (programmaticScrollRef.current) {
        return;
      }

      clearTimeout(manualTimerRef.current);

      manualTimerRef.current = setTimeout(() => {
        if (programmaticScrollRef.current) {
          return;
        }

        if (animationFrameRef.current) {
          cancelAnimationFrame(
            animationFrameRef.current
          );
        }

        animationFrameRef.current =
          requestAnimationFrame(() => {
            findClosestMember();
          });
      }, 50);
    };

    const handleResize = () => {
      if (programmaticScrollRef.current) {
        return;
      }

      findClosestMember();
    };

    gallery.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      clearTimeout(
        manualTimerRef.current
      );

      clearTimeout(
        programmaticTimerRef.current
      );

      if (animationFrameRef.current) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }

      gallery.removeEventListener(
        "scroll",
        handleScroll
      );

      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  /* =========================================================
     JSX
  ========================================================= */

  return (
    <section className="member-team">

      {/* ============================
          LEFT
      ============================ */}

      <div className="member-left">

        <span className="batch-number">
          26
        </span>

        <div className="left-content">

          <span className="small-heading">
            GEARS PEOPLE
          </span>

          <h2 className="main-heading">

            <span className="orange">
              OUR CORE
            </span>

            <br />

            TEAM

          </h2>

          <p className="intro-text">
            Meet the passionate members
            driving innovation,
            collaboration and excellence
            through robotics, artificial
            intelligence and intelligent
            engineering.
          </p>

        </div>

      </div>

      {/* ============================
          CENTER
      ============================ */}

      <div className="member-center">

        <div
          ref={galleryRef}
          className="member-gallery"
        >

          {members.map((member) => {

            const isActive =
              activeMember?.id === member.id;

            return (
              <button
                key={member.id}
                type="button"

                className={`member-card ${
                  isActive ? "active" : ""
                }`}

                data-member-id={member.id}

                onClick={() =>
                  handleMemberClick(member)
                }

                aria-label={`Select ${member.name}`}

                aria-pressed={isActive}
              >

                <img
                  src={member.image}
                  alt={member.name}
                  draggable="false"
                />

              </button>
            );
          })}

        </div>

      </div>

      {/* ============================
          RIGHT
      ============================ */}

      <div className="member-right">

        <span className="member-label">
          CORE MEMBER
        </span>

        <h2 className="member-name">
          {activeMember?.name}
        </h2>

        <h3 className="member-designation">
          {activeMember?.designation}
        </h3>

        <div className="member-divider" />

        <p className="member-description">
          {activeMember?.description}
        </p>

      </div>

    </section>
  );
};

export default MemberTeam;