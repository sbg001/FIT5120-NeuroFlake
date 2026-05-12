import bearIcon from "openmoji/color/svg/1F9F8.svg";
import catIcon from "openmoji/color/svg/1F431.svg";
import dogIcon from "openmoji/color/svg/1F436.svg";
import robotIcon from "openmoji/color/svg/1F916.svg";
import starIcon from "openmoji/color/svg/2B50.svg";
import turtleIcon from "openmoji/color/svg/1F422.svg";

const buddyIcons = {
  bear: bearIcon,
  cat: catIcon,
  dog: dogIcon,
  robot: robotIcon,
  star: starIcon,
  turtle: turtleIcon,
};

function BuddyIcon({ type = "dog", label = "Buddy", className = "", decorative = false }) {
  const safeType = buddyIcons[type] ? type : "dog";
  const classes = ["buddy-icon", `buddy-icon--${safeType}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <img
      src={buddyIcons[safeType]}
      alt={decorative ? "" : label}
      aria-hidden={decorative ? "true" : undefined}
      className={classes}
    />
  );
}

export default BuddyIcon;
