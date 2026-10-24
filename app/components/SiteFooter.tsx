import { XLogo } from "./icons";
import s from "./SiteFooter.module.css";

// One way to reach me: the X profile has the Follow button and takes replies.
export default function SiteFooter() {
  return (
    <footer className={`wrap ${s.foot}`}>
      <div className={s.row}>
        <p>
          Made by Ashish. Found a bug, or want a cinema added?
          <a className={s.x} href="https://x.com/feat_ashish" aria-label="Tell Ashish on X, @feat_ashish"><XLogo />@feat_ashish</a>
        </p>
        <a href="https://github.com/dedkul/pickmemovie">Source on GitHub</a>
      </div>
    </footer>
  );
}
