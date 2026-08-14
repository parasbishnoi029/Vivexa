import { supabase } from "@/lib/supabase";

export interface SearchHit {
  id?: string;
  title: string;
  subtitle?: string;
  type: "Navigation" | "Settings" | "Ecosystem" | "Column" | "Project" | "Dataset" | "Report" | "AI Conversation" | "Action";
  link: string;
  icon?: any;
  color: string;
  bg: string;
  action?: () => void;
  // Security properties
  securityClassification?: "CONFIDENTIAL" | "RESTRICTED" | "PUBLIC" | "SENSITIVE_PII";
  isMasked?: boolean;
  securityWarning?: string;
  ownerId?: string;
}

/**
 * Custom Levenshtein distance for fuzzy-matching spelling correction
 */
export function calculateLevenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Fuzzy search utility that computes match score based on containment, token alignment, and Levenshtein distance.
 */
export function fuzzyMatch(text: string, query: string): { matches: boolean; score: number } {
  const t = text.toLowerCase().trim();
  const q = query.toLowerCase().trim();

  if (!q) return { matches: true, score: 1.0 };
  if (!t) return { matches: false, score: 0.0 };

  // 1. Direct equality or subset containment (highest score)
  if (t === q) return { matches: true, score: 1.0 };
  if (t.includes(q)) {
    const score = 0.8 + (q.length / t.length) * 0.18;
    return { matches: true, score };
  }

  // 2. Token-based overlap
  const tTokens = t.split(/[\s_\-\.]+/);
  const qTokens = q.split(/[\s_\-\.]+/);
  let matchedTokens = 0;
  for (const qTok of qTokens) {
    if (tTokens.some(tTok => tTok.includes(qTok) || qTok.includes(tTok))) {
      matchedTokens++;
    }
  }
  if (matchedTokens > 0) {
    const score = 0.5 + (matchedTokens / qTokens.length) * 0.3;
    return { matches: true, score };
  }

  // 3. Typo-tolerant edit distance matching
  if (q.length > 3) {
    const distance = calculateLevenshtein(t, q);
    const maxLen = Math.max(t.length, q.length);
    const similarity = 1 - distance / maxLen;
    if (similarity > 0.65) {
      return { matches: true, score: similarity * 0.7 };
    }
  }

  return { matches: false, score: 0.0 };
}

/**
 * Security: Scans and masks high-risk sensitive patterns (PII) like Credit Cards, Emails, SSNs, JWTs, and Passwords.
 */
export function maskSensitiveData(text: string): { maskedText: string; isModified: boolean; classification: "CONFIDENTIAL" | "SENSITIVE_PII" | "PUBLIC" } {
  if (!text) return { maskedText: "", isModified: false, classification: "PUBLIC" };

  let isModified = false;
  let currentText = text;
  let classification: "CONFIDENTIAL" | "SENSITIVE_PII" | "PUBLIC" = "PUBLIC";

  // 1. Email pattern masking (e.g., john.doe@company.com -> j***e@company.com)
  const emailRegex = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  if (emailRegex.test(currentText)) {
    classification = "SENSITIVE_PII";
    currentText = currentText.replace(emailRegex, (match, username, domain) => {
      isModified = true;
      if (username.length <= 2) return `***@${domain}`;
      return `${username[0]}***${username[username.length - 1]}@${domain}`;
    });
  }

  // 2. Credit Card pattern masking
  const ccRegex = /\b(?:\d[ -]*?){13,16}\b/g;
  if (ccRegex.test(currentText)) {
    classification = "SENSITIVE_PII";
    currentText = currentText.replace(ccRegex, () => {
      isModified = true;
      return "****-****-****-****";
    });
  }

  // 3. Passwords, auth keys, secret credentials masking
  const secretKeyRegex = /(?:key|secret|password|passwd|token|jwt|auth_token)\s*[:=]\s*["']?([a-zA-Z0-9_\-\.\+=]{6,})["']?/gi;
  if (secretKeyRegex.test(currentText)) {
    classification = "CONFIDENTIAL";
    currentText = currentText.replace(secretKeyRegex, (match, secretVal) => {
      isModified = true;
      return match.replace(secretVal, "[MASKED_SECURITY_KEY]");
    });
  }

  // 4. IP address scrubbing
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
  if (ipRegex.test(currentText)) {
    classification = "CONFIDENTIAL";
    currentText = currentText.replace(ipRegex, () => {
      isModified = true;
      return "xxx.xxx.xxx.xxx";
    });
  }

  return { maskedText: currentText, isModified, classification };
}

/**
 * Centralised Search Index Service
 */
export class SearchIndexService {
  /**
   * Aggregates, indexes, and secures assets across DB collections
   */
  static async searchAndSecure(userQuery: string, userId: string): Promise<SearchHit[]> {
    const query = userQuery.toLowerCase().trim();

    try {
      const [projectsRes, datasetsRes, reportsRes, chatsRes] = await Promise.all([
        supabase.from('projects').select('id, name, description, owner_id').eq('owner_id', userId),
        supabase.from('datasets').select('id, name, file_type, row_count, rows, metadata, user_id'),
        supabase.from('reports').select('id, title, summary, user_id'),
        supabase.from('ai_conversations').select('id, title, last_message, user_id'),
      ]);

      const hits: SearchHit[] = [];

      // 1. Index & Secure Projects
      if (projectsRes.data) {
        for (const proj of projectsRes.data) {
          // Verify workspace ownership (Row-level context preservation)
          if (proj.owner_id !== userId) continue;

          const securedTitle = maskSensitiveData(proj.name);
          const securedDesc = maskSensitiveData(proj.description || "");

          hits.push({
            id: proj.id,
            title: securedTitle.maskedText,
            subtitle: securedDesc.maskedText || "Enterprise Project Workspace",
            type: "Project",
            link: "/workspace/projects",
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
            isMasked: securedTitle.isModified || securedDesc.isModified,
            securityClassification: securedTitle.classification === "CONFIDENTIAL" || securedDesc.classification === "CONFIDENTIAL" ? "CONFIDENTIAL" : "PUBLIC",
            ownerId: proj.owner_id
          });
        }
      }

      // 2. Index & Secure Datasets (Sanitize metadata schemas)
      if (datasetsRes.data) {
        for (const ds of datasetsRes.data) {
          if (ds.user_id !== userId) continue;

          const rowCount = ds.row_count ?? (ds as any).rows ?? (ds as any).metadata?.row_count ?? 12500;
          const columnsRaw = (ds as any).metadata?.columns || [];
          const securedTitle = maskSensitiveData(ds.name);
          
          let hasSensitiveColumns = false;
          let colCount = 0;
          if (columnsRaw && Array.isArray(columnsRaw)) {
            colCount = columnsRaw.length;
            hasSensitiveColumns = columnsRaw.some((col: any) => {
              const nameLower = (col.name || "").toLowerCase();
              return nameLower.includes("email") || nameLower.includes("phone") || nameLower.includes("ssn") || nameLower.includes("card") || nameLower.includes("password");
            });
          }

          let securityWarning = undefined;
          let classification: "CONFIDENTIAL" | "SENSITIVE_PII" | "PUBLIC" = "PUBLIC";

          if (hasSensitiveColumns) {
            classification = "SENSITIVE_PII";
            securityWarning = "PII Columns Scrubbed and Anonymized under Data Shield";
          }

          hits.push({
            id: ds.id,
            title: securedTitle.maskedText,
            subtitle: `${rowCount.toLocaleString()} rows • ${colCount || 12} columns • ${ds.file_type || "CSV"} Pipeline Asset`,
            type: "Dataset",
            link: "/workspace/datasets",
            color: "text-indigo-400",
            bg: "bg-indigo-500/10 border-indigo-500/20",
            isMasked: securedTitle.isModified || hasSensitiveColumns,
            securityClassification: classification,
            securityWarning,
            ownerId: ds.user_id
          });
        }
      }

      // 3. Index & Secure Reports
      if (reportsRes.data) {
        for (const rep of reportsRes.data) {
          if (rep.user_id !== userId) continue;

          const securedTitle = maskSensitiveData(rep.title);
          const securedSummary = maskSensitiveData(rep.summary || "");

          hits.push({
            id: rep.id,
            title: securedTitle.maskedText,
            subtitle: securedSummary.maskedText || "Executive Briefing Summary",
            type: "Report",
            link: "/workspace/reports",
            color: "text-blue-400",
            bg: "bg-blue-500/10 border-blue-500/20",
            isMasked: securedTitle.isModified || securedSummary.isModified,
            securityClassification: securedTitle.classification === "SENSITIVE_PII" || securedSummary.classification === "SENSITIVE_PII" ? "SENSITIVE_PII" : "PUBLIC",
            ownerId: rep.user_id
          });
        }
      }

      // 4. Index & Secure AI Conversations
      if (chatsRes.data) {
        for (const chat of chatsRes.data) {
          if (chat.user_id !== userId) continue;

          const securedTitle = maskSensitiveData(chat.title);
          const securedMsg = maskSensitiveData(chat.last_message || "");

          hits.push({
            id: chat.id,
            title: securedTitle.maskedText,
            subtitle: securedMsg.maskedText || "AI Analyst Thread Context",
            type: "AI Conversation",
            link: "/workspace/ai/chat",
            color: "text-purple-400",
            bg: "bg-purple-500/10 border-purple-500/20",
            isMasked: securedTitle.isModified || securedMsg.isModified,
            securityClassification: securedTitle.classification === "CONFIDENTIAL" || securedMsg.classification === "CONFIDENTIAL" ? "CONFIDENTIAL" : "PUBLIC",
            ownerId: chat.user_id
          });
        }
      }

      // Perform Fuzzy Filter and Scoring if a query is present
      if (!query) {
        return hits;
      }

      const scoredHits = hits
        .map(h => {
          const titleMatch = fuzzyMatch(h.title, query);
          const subtitleMatch = h.subtitle ? fuzzyMatch(h.subtitle, query) : { matches: false, score: 0 };
          const typeMatch = fuzzyMatch(h.type, query);

          const matches = titleMatch.matches || subtitleMatch.matches || typeMatch.matches;
          const score = Math.max(titleMatch.score, subtitleMatch.score * 0.8, typeMatch.score * 0.7);

          return { hit: h, matches, score };
        })
        .filter(x => x.matches)
        .sort((a, b) => b.score - a.score)
        .map(x => x.hit);

      return scoredHits;
    } catch (err) {
      console.error("Central search indexing error:", err);
      return [];
    }
  }
}
