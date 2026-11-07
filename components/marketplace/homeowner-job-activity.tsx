import { Check, Gavel, MessageCircle, Radio, Search } from "lucide-react";
import { getJobActivity, type JobActivityInput } from "@/lib/job-activity";
import styles from "./homeowner-job-activity.module.css";

export function HomeownerJobActivity({ job }: { job: JobActivityInput }) {
  const activity = getJobActivity(job);
  return (
    <section className={styles.panel} data-live={activity.live} data-attention={activity.attention} aria-label="Job activity">
      <div className={styles.heading}>
        <h2><Radio aria-hidden="true" />{activity.live ? "Live activity" : "Job activity"}</h2>
        <span className={styles.badge}>{activity.badge}</span>
      </div>
      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.icon}><Search aria-hidden="true" /></span>
          <div className={styles.copy}><h3>{activity.searchTitle}</h3><p>{activity.searchDetail}</p></div>
          {activity.live ? <ActivityDots /> : !activity.attention ? <Check className={styles.complete} aria-hidden="true" /> : null}
        </div>
        <div className={styles.row}>
          <span className={styles.icon}><Gavel aria-hidden="true" /></span>
          <div className={styles.copy}><h3>{activity.bidsTitle}</h3><p>{activity.bidsDetail}</p></div>
          {activity.live ? <ActivityDots /> : null}
        </div>
        <div className={styles.row}>
          <span className={styles.icon}><MessageCircle aria-hidden="true" /></span>
          <div className={styles.copy}><h3>Bids and messages</h3><p>Every reply, together in one place.</p></div>
          {activity.live ? <span className={styles.bars} aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <i key={i} />)}</span> : null}
        </div>
      </div>
    </section>
  );
}

function ActivityDots() {
  return <span className={styles.dots} aria-hidden="true"><i /><i /><i /></span>;
}
