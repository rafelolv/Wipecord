/** Keep IDs only for in-memory deduplication; export a fixed anonymous schema. */
export default class RunReport {
  #outcomes = new Map();
  #started = Date.now();
  #reason = 'completed';
  #errors = 0;
  #finished;
  #result;

  record(id, outcome) {
    if (this.#outcomes.get(id) !== 'deleted') this.#outcomes.set(id, outcome);
  }
  end(reason) {
    if (reason === 'error') this.#errors++;
    if (reason === 'stopped' || reason === 'cancelled' || this.#reason === 'completed') this.#reason = reason;
  }
  finish() {
    this.#finished = Date.now();
    this.#result = this.snapshot();
    this.#outcomes.clear();
  }
  snapshot() {
    if (this.#result) return { ...this.#result, counts: { ...this.#result.counts } };
    const counts = { deleted: 0, ignored: 0, failed: 0, alreadyGone: 0 };
    for (const outcome of this.#outcomes.values()) counts[outcome]++;
    return {
      schemaVersion: 1,
      application: 'Wipecord',
      reason: this.#reason,
      startedAt: new Date(this.#started).toISOString(),
      finishedAt: new Date(this.#finished ?? Date.now()).toISOString(),
      durationMs: Math.max(0, (this.#finished ?? Date.now()) - this.#started),
      counts,
      runErrors: this.#errors,
    };
  }
}
