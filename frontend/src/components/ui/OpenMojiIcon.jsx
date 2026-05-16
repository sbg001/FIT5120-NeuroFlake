import babyIcon from "openmoji/color/svg/1F476.svg";
import booksIcon from "openmoji/color/svg/1F4DA.svg";
import brainIcon from "openmoji/color/svg/1F9E0.svg";
import calendarIcon from "openmoji/color/svg/1F4C5.svg";
import checkIcon from "openmoji/color/svg/2705.svg";
import compassIcon from "openmoji/color/svg/1F9ED.svg";
import fireIcon from "openmoji/color/svg/1F525.svg";
import giftIcon from "openmoji/color/svg/1F381.svg";
import grinningIcon from "openmoji/color/svg/1F600.svg";
import herbIcon from "openmoji/color/svg/1F33F.svg";
import hourglassIcon from "openmoji/color/svg/23F3.svg";
import lightbulbIcon from "openmoji/color/svg/1F4A1.svg";
import magnifierIcon from "openmoji/color/svg/1F50E.svg";
import memoIcon from "openmoji/color/svg/1F4DD.svg";
import musicIcon from "openmoji/color/svg/1F3B5.svg";
import seedlingIcon from "openmoji/color/svg/1F331.svg";
import speechIcon from "openmoji/color/svg/1F4AC.svg";
import sparklesIcon from "openmoji/color/svg/2728.svg";
import starIcon from "openmoji/color/svg/2B50.svg";
import sleepingIcon from "openmoji/color/svg/1F634.svg";
import targetIcon from "openmoji/color/svg/1F3AF.svg";
import trashIcon from "openmoji/color/svg/1F5D1.svg";
import worriedIcon from "openmoji/color/svg/1F61F.svg";

const openMojiIcons = {
  baby: babyIcon,
  books: booksIcon,
  brain: brainIcon,
  calendar: calendarIcon,
  check: checkIcon,
  compass: compassIcon,
  fire: fireIcon,
  gift: giftIcon,
  grinning: grinningIcon,
  herb: herbIcon,
  hourglass: hourglassIcon,
  lightbulb: lightbulbIcon,
  magnifier: magnifierIcon,
  memo: memoIcon,
  music: musicIcon,
  seedling: seedlingIcon,
  speech: speechIcon,
  sparkles: sparklesIcon,
  star: starIcon,
  sleeping: sleepingIcon,
  target: targetIcon,
  trash: trashIcon,
  worried: worriedIcon,
};

function OpenMojiIcon({ name = "star", label = "", decorative = true, className = "" }) {
  const safeName = openMojiIcons[name] ? name : "star";
  const classes = ["openmoji-icon", `openmoji-icon--${safeName}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <img
      src={openMojiIcons[safeName]}
      alt={decorative ? "" : label}
      aria-hidden={decorative ? "true" : undefined}
      className={classes}
    />
  );
}

export default OpenMojiIcon;
