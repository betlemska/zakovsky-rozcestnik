declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    CLASS_REP_SEED_1?: string;
    CLASS_REP_SEED_2?: string;
    PORTAL_SCHEDULER_OWNER_EMAIL?: string;
    ADMIN_BOOTSTRAP_VERIFIER?: string;
    BUCKET?: R2Bucket;
  }
}
