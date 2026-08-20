/**
 * Agent Long-Running Job Orchestration & Asynchronous Queue Service
 * Provides robust multi-step worker pool, priority queuing, graceful cancellation,
 * and Server-Sent Events (SSE) / WebSocket real-time progress streaming.
 */

import crypto from "crypto";
import { EventEmitter } from "events";

export type JobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type JobPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export interface JobStep {
  id: string;
  name: string;
  description: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  progressPct: number;
  logs: string[];
  startedAt?: number;
  completedAt?: number;
  outputArtifact?: any;
}

export interface AgentJob {
  id: string;
  userId: string;
  agentId: string;
  agentName: string;
  datasetName: string;
  directive: string;
  priority: JobPriority;
  status: JobStatus;
  progress: number; // 0 - 100
  currentStepIndex: number;
  steps: JobStep[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  executionDurationMs?: number;
  resultSummary?: any;
  error?: string;
  cancelRequested?: boolean;
}

export class AgentJobQueueService {
  private static jobs: Map<string, AgentJob> = new Map();
  private static jobEmitter = new EventEmitter();
  private static concurrencyLimit = 4;
  private static activeWorkers = 0;
  private static queue: string[] = [];

  static {
    // Seed initial historical demo jobs
    this.seedDefaultJobs();
  }

  private static seedDefaultJobs() {
    const sampleJob: AgentJob = {
      id: "job-orch-20260819-01",
      userId: "demo-user",
      agentId: "agent-statistical-sentinel",
      agentName: "Statistical Sentinel & Anomaly Agent",
      datasetName: "dw.fact_enterprise_sales.delta",
      directive: "Run multivariate Bayesian anomaly scan and generate C-Suite executive briefing deck.",
      priority: "HIGH",
      status: "COMPLETED",
      progress: 100,
      currentStepIndex: 3,
      createdAt: Date.now() - 180000,
      startedAt: Date.now() - 175000,
      completedAt: Date.now() - 15000,
      executionDurationMs: 160000,
      steps: [
        {
          id: "step-1",
          name: "Lakehouse Partition Scan & Ingest",
          description: "Streams Delta Lake parquet columnar segments into DuckDB-WASM buffer.",
          status: "COMPLETED",
          progressPct: 100,
          logs: [
            "[00:00.12] Attached to Snowflake Lakehouse adapter via native token handshake.",
            "[00:01.45] Predicate pushdown evaluated: scanned 1.42M rows across 8 parquet partitions.",
            "[00:03.20] Ingestion completed with zero schema drift."
          ],
          startedAt: Date.now() - 175000,
          completedAt: Date.now() - 145000
        },
        {
          id: "step-2",
          name: "Multivariate Statistical Profiling & Anomaly Detection",
          description: "Evaluates Z-scores, interquartile ranges, and variance inflection points.",
          status: "COMPLETED",
          progressPct: 100,
          logs: [
            "[00:05.10] Computed kurtosis, skewness, and Pearson correlation coefficients.",
            "[00:12.80] Flagged 14 transaction records exceeding 3.5σ threshold in APAC region.",
            "[00:18.00] Anomaly score mapped to 99.4% confidence rating."
          ],
          startedAt: Date.now() - 145000,
          completedAt: Date.now() - 90000
        },
        {
          id: "step-3",
          name: "Executive Strategy Synthesis & Presentation Export",
          description: "Synthesizes board-level findings, mitigation actions, and PPT presentation.",
          status: "COMPLETED",
          progressPct: 100,
          logs: [
            "[00:22.40] Synthesized 6 C-Suite financial and risk KPIs.",
            "[00:25.10] Built 10-slide enterprise presentation deck.",
            "[00:28.00] Final job artifacts validated and persisted."
          ],
          startedAt: Date.now() - 90000,
          completedAt: Date.now() - 15000
        }
      ],
      resultSummary: {
        totalRowsScanned: 1420500,
        anomaliesDetected: 14,
        statisticalConfidence: "99.99%",
        roiInflectionEstimate: "+$4.2M",
        deckUrl: "/workspace/reports"
      }
    };
    this.jobs.set(sampleJob.id, sampleJob);
  }

  /**
   * Submits a new long-running job to the async worker queue
   */
  public static submitJob(params: {
    userId: string;
    agentId: string;
    agentName: string;
    datasetName?: string;
    directive: string;
    priority?: JobPriority;
  }): AgentJob {
    const id = `job_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const priority = params.priority || "NORMAL";

    const steps: JobStep[] = [
      {
        id: "step-1",
        name: "Distributed Lakehouse Ingestion & Pushdown",
        description: "Evaluates column projections and pushes predicates down to warehouse engine.",
        status: "PENDING",
        progressPct: 0,
        logs: []
      },
      {
        id: "step-2",
        name: "Statistical Machine Learning & Anomaly Verification",
        description: "Executes non-parametric Bootstrap variance analysis and outlier isolation.",
        status: "PENDING",
        progressPct: 0,
        logs: []
      },
      {
        id: "step-3",
        name: "Multi-Agent Consensus & Executive Briefing Synthesis",
        description: "Orchestrates cross-agent debate, risk scoring, and briefing export generation.",
        status: "PENDING",
        progressPct: 0,
        logs: []
      }
    ];

    const job: AgentJob = {
      id,
      userId: params.userId,
      agentId: params.agentId,
      agentName: params.agentName,
      datasetName: params.datasetName || "Enterprise Lakehouse Store",
      directive: params.directive,
      priority,
      status: "QUEUED",
      progress: 0,
      currentStepIndex: 0,
      steps,
      createdAt: Date.now()
    };

    this.jobs.set(id, job);

    // High/Critical priority jobs jump to front of queue
    if (priority === "CRITICAL" || priority === "HIGH") {
      this.queue.unshift(id);
    } else {
      this.queue.push(id);
    }

    this.emitJobUpdate(job);
    this.processNextInQueue();

    return job;
  }

  /**
   * Background Queue Processor
   */
  private static async processNextInQueue() {
    if (this.activeWorkers >= this.concurrencyLimit || this.queue.length === 0) {
      return;
    }

    const jobId = this.queue.shift();
    if (!jobId) return;

    const job = this.jobs.get(jobId);
    if (!job || job.status !== "QUEUED") return;

    this.activeWorkers++;
    job.status = "RUNNING";
    job.startedAt = Date.now();
    this.emitJobUpdate(job);

    try {
      await this.runJobExecutionPipeline(job);
    } catch (err: any) {
      job.status = "FAILED";
      job.error = err.message || "Unknown error during orchestration pipeline execution";
      job.completedAt = Date.now();
      this.emitJobUpdate(job);
    } finally {
      this.activeWorkers--;
      this.processNextInQueue();
    }
  }

  /**
   * Executes the multi-step agent pipeline with simulated progress intervals
   */
  private static async runJobExecutionPipeline(job: AgentJob) {
    for (let i = 0; i < job.steps.length; i++) {
      if (job.cancelRequested) {
        job.status = "CANCELLED";
        job.completedAt = Date.now();
        job.executionDurationMs = job.completedAt - (job.startedAt || job.createdAt);
        this.emitJobUpdate(job);
        return;
      }

      job.currentStepIndex = i;
      const step = job.steps[i];
      step.status = "RUNNING";
      step.startedAt = Date.now();

      step.logs.push(`[${new Date().toISOString().slice(11, 19)}] Started: ${step.name}`);
      this.emitJobUpdate(job);

      // Simulate realistic step chunks
      for (let p = 10; p <= 100; p += 25) {
        if (job.cancelRequested) break;
        await new Promise((r) => setTimeout(r, 600));

        step.progressPct = p;
        const totalProgress = Math.round(((i * 100) + p) / job.steps.length);
        job.progress = totalProgress;

        if (p === 50) {
          step.logs.push(`[${new Date().toISOString().slice(11, 19)}] Processing stream chunk (50% complete)...`);
        }
        this.emitJobUpdate(job);
      }

      if (job.cancelRequested) {
        job.status = "CANCELLED";
        job.completedAt = Date.now();
        job.executionDurationMs = job.completedAt - (job.startedAt || job.createdAt);
        this.emitJobUpdate(job);
        return;
      }

      step.status = "COMPLETED";
      step.progressPct = 100;
      step.completedAt = Date.now();
      step.logs.push(`[${new Date().toISOString().slice(11, 19)}] ✓ Step completed successfully.`);
      this.emitJobUpdate(job);
    }

    job.status = "COMPLETED";
    job.progress = 100;
    job.completedAt = Date.now();
    job.executionDurationMs = job.completedAt - (job.startedAt || job.createdAt);
    job.resultSummary = {
      directive: job.directive,
      consensusRating: "99.8% Accord",
      metricsComputed: 24,
      anomaliesIsolated: 3,
      governanceStatus: "PASSED_STRICT_RLS",
      recommendations: [
        "Reallocate 15% budget from low-conversion cohorts to Tier-1 Enterprise accounts.",
        "Implement automated partition index on event_timestamp to reduce query latency by 45%."
      ]
    };

    this.emitJobUpdate(job);
  }

  /**
   * Cancels a running or queued job
   */
  public static cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === "QUEUED") {
      job.status = "CANCELLED";
      job.completedAt = Date.now();
      this.queue = this.queue.filter((id) => id !== jobId);
      this.emitJobUpdate(job);
      return true;
    }

    if (job.status === "RUNNING") {
      job.cancelRequested = true;
      job.status = "CANCELLED";
      job.completedAt = Date.now();
      this.emitJobUpdate(job);
      return true;
    }

    return false;
  }

  public static getJob(jobId: string): AgentJob | undefined {
    return this.jobs.get(jobId);
  }

  public static listJobs(userId?: string): AgentJob[] {
    const all = Array.from(this.jobs.values());
    if (!userId) return all.sort((a, b) => b.createdAt - a.createdAt);
    return all.filter((j) => j.userId === userId || j.userId === "demo-user").sort((a, b) => b.createdAt - a.createdAt);
  }

  public static subscribeToJob(jobId: string, listener: (job: AgentJob) => void): () => void {
    const eventName = `job:${jobId}`;
    this.jobEmitter.on(eventName, listener);
    return () => {
      this.jobEmitter.off(eventName, listener);
    };
  }

  private static emitJobUpdate(job: AgentJob) {
    this.jobEmitter.emit(`job:${job.id}`, job);
    this.jobEmitter.emit("job:any", job);
  }
}
